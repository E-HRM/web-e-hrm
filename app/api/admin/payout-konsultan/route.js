import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import {
  ALLOWED_ORDER_BY,
  CREATE_ROLES,
  STATUS_PAYOUT_VALUES,
  VIEW_ROLES,
  buildSelect,
  createHttpError,
  ensureAuth,
  enrichPayout,
  findConflictingPayout,
  guardRole,
  normalizeDecimalString,
  normalizeEnum,
  normalizeIdList,
  normalizeNullableString,
  normalizeOptionalId,
  normalizeOptionalInt,
  normalizeRequiredString,
  replacePayoutDetails,
  resolvePayoutPayload,
  setTransaksiPostingStatusByPayout,
  upsertPayrollItemForPayout,
} from './_helper';

export async function GET(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1), 100);

    const search = (searchParams.get('search') || '').trim();
    const id_periode_konsultan = (searchParams.get('id_periode_konsultan') || '').trim();
    const id_user = (searchParams.get('id_user') || '').trim();
    const id_periode_payroll = (searchParams.get('id_periode_payroll') || '').trim();

    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());
    const deletedOnly = ['1', 'true'].includes((searchParams.get('deletedOnly') || '').toLowerCase());

    const orderByParam = (searchParams.get('orderBy') || 'created_at').trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam) ? orderByParam : 'created_at';
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let status_payout;
    if (searchParams.get('status_payout') !== null && searchParams.get('status_payout') !== '') {
      status_payout = normalizeEnum(searchParams.get('status_payout'), STATUS_PAYOUT_VALUES, 'status_payout');
    }

    const where = {
      ...(deletedOnly ? { deleted_at: { not: null } } : {}),
      ...(!includeDeleted && !deletedOnly ? { deleted_at: null } : {}),
      ...(id_periode_konsultan ? { id_periode_konsultan } : {}),
      ...(id_user ? { id_user } : {}),
      ...(id_periode_payroll ? { id_periode_payroll } : {}),
      ...(status_payout ? { status_payout } : {}),
      ...(search
        ? {
            OR: [
              {
                catatan: {
                  contains: search,
                },
              },
              {
                user: {
                  is: {
                    nama_pengguna: {
                      contains: search,
                    },
                  },
                },
              },
              {
                user: {
                  is: {
                    email: {
                      contains: search,
                    },
                  },
                },
              },
              {
                user: {
                  is: {
                    nomor_induk_karyawan: {
                      contains: search,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      db.payoutKonsultan.count({ where }),
      db.payoutKonsultan.findMany({
        where,
        orderBy: {
          [orderBy]: sort,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: buildSelect({ includeDetails: false }),
      }),
    ]);

    return NextResponse.json({
      data: rows.map((item) => enrichPayout(item)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('tidak valid')) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }

    console.error('GET /api/admin/payout-konsultan error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, CREATE_ROLES);
  if (forbidden) return forbidden;

  try {
    const body = await req.json();

    const forbiddenFields = ['total_share', 'nominal_ditahan', 'nominal_dibayarkan', 'disetujui_pada', 'diposting_pada', 'payout_detail'];
    const sentForbiddenField = forbiddenFields.find((field) => Object.prototype.hasOwnProperty.call(body || {}, field));

    if (sentForbiddenField) {
      return NextResponse.json(
        {
          message: `Field '${sentForbiddenField}' diatur otomatis oleh sistem dan tidak boleh dikirim saat create.`,
        },
        { status: 400 },
      );
    }

    const sanitizedInput = {
      id_periode_konsultan: normalizeRequiredString(body?.id_periode_konsultan, 'id_periode_konsultan', 36),
      id_user: normalizeRequiredString(body?.id_user, 'id_user', 36),
      ...(body?.id_periode_payroll !== undefined ? { id_periode_payroll: normalizeOptionalId(body?.id_periode_payroll, 'id_periode_payroll') } : {}),
      ...(body?.id_definisi_komponen_payroll !== undefined
        ? {
            id_definisi_komponen_payroll: normalizeOptionalId(
              body?.id_definisi_komponen_payroll,
              'id_definisi_komponen_payroll',
            ),
          }
        : {}),
      ...(body?.urutan_tampil !== undefined
        ? {
            urutan_tampil: normalizeOptionalInt(body?.urutan_tampil, 'urutan_tampil', {
              min: 0,
            }),
          }
        : {}),
      ...(body?.id_transaksi_konsultan_ditahan !== undefined
        ? {
            id_transaksi_konsultan_ditahan: normalizeIdList(
              body?.id_transaksi_konsultan_ditahan,
              'id_transaksi_konsultan_ditahan',
            ),
          }
        : {}),
      ...(body?.nominal_penyesuaian !== undefined ? { nominal_penyesuaian: normalizeDecimalString(body?.nominal_penyesuaian, 'nominal_penyesuaian', 2) } : {}),
      ...(body?.status_payout !== undefined ? { status_payout: normalizeEnum(body?.status_payout, STATUS_PAYOUT_VALUES, 'status_payout') } : {}),
      ...(body?.catatan !== undefined ? { catatan: normalizeNullableString(body?.catatan, 'catatan') } : {}),
    };

    const result = await db.$transaction(async (tx) => {
      const resolved = await resolvePayoutPayload(tx, sanitizedInput, null, auth.actor);

      const conflict = await findConflictingPayout(tx, {
        id_periode_konsultan: resolved.payload.id_periode_konsultan,
        id_user: resolved.payload.id_user,
      });

      let record;
      let mode = 'created';

      if (conflict && !conflict.deleted_at) {
        throw createHttpError(409, 'Payout konsultan untuk user dan periode tersebut sudah ada.', {
          conflictId: conflict.id_payout_konsultan,
        });
      }

      if (conflict && conflict.deleted_at) {
        record = await tx.payoutKonsultan.update({
          where: {
            id_payout_konsultan: conflict.id_payout_konsultan,
          },
          data: {
            ...resolved.payload,
            deleted_at: null,
          },
          select: buildSelect({ includeDetails: true }),
        });
        mode = 'restored';
      } else {
        record = await tx.payoutKonsultan.create({
          data: {
            ...resolved.payload,
            deleted_at: null,
          },
          select: buildSelect({ includeDetails: true }),
        });
      }

      await replacePayoutDetails(tx, record.id_payout_konsultan, resolved.transactions);

      let postingSummary = null;
      if (resolved.payload.status_payout === 'DIPOSTING_KE_PAYROLL') {
        postingSummary = await upsertPayrollItemForPayout(tx, record, auth.actor, {
          id_definisi_komponen_payroll: sanitizedInput.id_definisi_komponen_payroll,
          urutan_tampil: sanitizedInput.urutan_tampil,
        });
        await setTransaksiPostingStatusByPayout(tx, record.id_payout_konsultan, true);
      }

      const finalRecord = await tx.payoutKonsultan.findUnique({
        where: {
          id_payout_konsultan: record.id_payout_konsultan,
        },
        select: buildSelect({ includeDetails: true }),
      });

      return {
        mode,
        postingSummary,
        data: enrichPayout(finalRecord),
      };
    });

    return NextResponse.json(
      {
        message: result.mode === 'restored' ? 'Payout konsultan soft delete berhasil dipulihkan.' : 'Payout konsultan berhasil dibuat.',
        mode: result.mode,
        ...(result.postingSummary
          ? {
              posting_summary: {
                payroll_karyawan: result.postingSummary.payroll,
                item_komponen_payroll: result.postingSummary.item,
              },
            }
          : {}),
        data: result.data,
      },
      { status: result.mode === 'restored' ? 200 : 201 },
    );
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ message: 'Payload JSON tidak valid.' }, { status: 400 });
    }

    if (err?.statusCode) {
      return NextResponse.json(
        {
          message: err.message,
          ...(err.conflictId ? { conflict_id: err.conflictId } : {}),
        },
        { status: err.statusCode },
      );
    }

    if (
      err instanceof Error &&
      (err.message.startsWith('Field ') ||
        err.message.includes('tidak ditemukan') ||
        err.message.includes('sudah dihapus') ||
        err.message.includes('sudah terkunci') ||
        err.message.includes('siap dipayout') ||
        err.message.includes('sudah terhubung') ||
        err.message.includes('lebih besar') ||
        err.message.includes('negatif'))
    ) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }

    console.error('POST /api/admin/payout-konsultan error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
