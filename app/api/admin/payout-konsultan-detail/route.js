import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import {
  ALLOWED_ORDER_BY,
  CREATE_ROLES,
  VIEW_ROLES,
  buildSelect,
  buildCreateOrUpdatePayload,
  createHttpError,
  ensureAuth,
  enrichPayoutDetail,
  findDetailByComposite,
  getExistingPayout,
  guardRole,
  normalizeBoolean,
  normalizeDecimalString,
  normalizeNullableString,
  normalizeRequiredString,
  recalculatePayoutSummary,
  resolvePayoutAndTransaksi,
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
    const id_payout_konsultan = (searchParams.get('id_payout_konsultan') || '').trim();
    const id_transaksi_konsultan = (searchParams.get('id_transaksi_konsultan') || '').trim();
    const id_periode_konsultan = (searchParams.get('id_periode_konsultan') || '').trim();
    const id_user = (searchParams.get('id_user') || '').trim();

    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());
    const deletedOnly = ['1', 'true'].includes((searchParams.get('deletedOnly') || '').toLowerCase());

    const orderByParam = (searchParams.get('orderBy') || 'created_at').trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam) ? orderByParam : 'created_at';
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where = {
      ...(deletedOnly ? { deleted_at: { not: null } } : {}),
      ...(!includeDeleted && !deletedOnly ? { deleted_at: null } : {}),
      ...(id_payout_konsultan ? { id_payout_konsultan } : {}),
      ...(id_transaksi_konsultan ? { id_transaksi_konsultan } : {}),
      ...((id_periode_konsultan || id_user || search)
        ? {
            payout: {
              is: {
                ...(id_periode_konsultan ? { id_periode_konsultan } : {}),
                ...(id_user ? { id_user } : {}),
              },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { catatan: { contains: search } },
              { payout: { is: { catatan: { contains: search } } } },
              { payout: { is: { user: { is: { nama_pengguna: { contains: search } } } } } },
              { payout: { is: { user: { is: { email: { contains: search } } } } } },
              { transaksi: { is: { nama_klien: { contains: search } } } },
              { transaksi: { is: { deskripsi: { contains: search } } } },
              { transaksi: { is: { catatan: { contains: search } } } },
              { transaksi: { is: { jenis_produk: { is: { nama_produk: { contains: search } } } } } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      db.payoutKonsultanDetail.count({ where }),
      db.payoutKonsultanDetail.findMany({
        where,
        orderBy: {
          [orderBy]: sort,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: buildSelect(),
      }),
    ]);

    return NextResponse.json({
      data: rows.map((item) => enrichPayoutDetail(item)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    if (err?.statusCode) {
      return NextResponse.json({ message: err.message }, { status: err.statusCode });
    }

    if (err instanceof Error && (err.message.startsWith('Field ') || err.message.includes('tidak valid'))) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }

    console.error('GET /api/admin/payout-konsultan-detail error:', err);
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

    const payload = {
      id_payout_konsultan: normalizeRequiredString(body?.id_payout_konsultan, 'id_payout_konsultan', 36),
      id_transaksi_konsultan: normalizeRequiredString(body?.id_transaksi_konsultan, 'id_transaksi_konsultan', 36),
      ...(body?.nominal_share !== undefined ? { nominal_share: normalizeDecimalString(body?.nominal_share, 'nominal_share', 2, { min: '0' }) } : {}),
      ...(body?.nominal_oss !== undefined ? { nominal_oss: normalizeDecimalString(body?.nominal_oss, 'nominal_oss', 2, { min: '0' }) } : {}),
      ...(body?.ditahan !== undefined ? { ditahan: normalizeBoolean(body?.ditahan, 'ditahan') } : {}),
      ...(body?.catatan !== undefined ? { catatan: normalizeNullableString(body?.catatan, 'catatan') } : {}),
    };

    const result = await db.$transaction(async (tx) => {
      const { payout, transaksi } = await resolvePayoutAndTransaksi(tx, payload);

      const sameComposite = await findDetailByComposite(tx, {
        id_payout_konsultan: payload.id_payout_konsultan,
        id_transaksi_konsultan: payload.id_transaksi_konsultan,
      });

      const recordPayload = buildCreateOrUpdatePayload(payload, transaksi);

      let detail;
      let mode = 'created';

      if (sameComposite?.deleted_at) {
        detail = await tx.payoutKonsultanDetail.update({
          where: {
            id_payout_konsultan_detail: sameComposite.id_payout_konsultan_detail,
          },
          data: {
            ...recordPayload,
            deleted_at: null,
          },
          select: buildSelect(),
        });
        mode = 'restored';
      } else if (sameComposite) {
        throw createHttpError(409, 'Detail payout konsultan untuk kombinasi payout dan transaksi tersebut sudah ada.');
      } else {
        detail = await tx.payoutKonsultanDetail.create({
          data: {
            id_payout_konsultan: payout.id_payout_konsultan,
            id_transaksi_konsultan: transaksi.id_transaksi_konsultan,
            ...recordPayload,
            deleted_at: null,
          },
          select: buildSelect(),
        });
      }

      const payout_summary = await recalculatePayoutSummary(tx, payload.id_payout_konsultan);

      return {
        mode,
        detail: enrichPayoutDetail(detail),
        payout_summary,
      };
    });

    return NextResponse.json(
      {
        message:
          result.mode === 'restored'
            ? 'Payout konsultan detail berhasil dipulihkan dan diperbarui.'
            : 'Payout konsultan detail berhasil dibuat.',
        data: result.detail,
        payout_summary: result.payout_summary,
      },
      { status: result.mode === 'restored' ? 200 : 201 },
    );
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ message: 'Payload JSON tidak valid.' }, { status: 400 });
    }

    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Detail payout konsultan dengan kombinasi payout dan transaksi tersebut sudah ada.' }, { status: 409 });
    }

    if (err?.statusCode) {
      return NextResponse.json({ message: err.message }, { status: err.statusCode });
    }

    if (
      err instanceof Error &&
      (err.message.startsWith('Field ') ||
        err.message.includes('payout') ||
        err.message.includes('transaksi') ||
        err.message.includes('boolean') ||
        err.message.includes('desimal') ||
        err.message.includes('karakter') ||
        err.message.includes('nilai negatif'))
    ) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }

    console.error('POST /api/admin/payout-konsultan-detail error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
