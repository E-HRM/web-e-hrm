import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import {
  DELETE_ROLES,
  EDIT_ROLES,
  STATUS_PAYOUT_VALUES,
  VIEW_ROLES,
  buildSelect,
  createHttpError,
  ensureAuth,
  ensurePayoutDeletable,
  ensurePayoutMutable,
  enrichPayout,
  findConflictingPayout,
  getExistingPayout,
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
} from '../_helper';

export async function GET(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;

    const data = await getExistingPayout(id, {
      includeDetails: true,
      client: db,
    });

    if (!data) {
      return NextResponse.json({ message: 'Payout konsultan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data: enrichPayout(data) });
  } catch (err) {
    console.error('GET /api/admin/payout-konsultan/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, EDIT_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;
    const body = await req.json();

    const existing = await getExistingPayout(id, {
      includeDetails: true,
      client: db,
    });

    if (!existing) {
      return NextResponse.json({ message: 'Payout konsultan tidak ditemukan.' }, { status: 404 });
    }

    ensurePayoutMutable(existing);

    const forbiddenFields = ['total_share', 'nominal_ditahan', 'nominal_dibayarkan', 'disetujui_pada', 'diposting_pada', 'payout_detail'];
    const sentForbiddenField = forbiddenFields.find((field) => Object.prototype.hasOwnProperty.call(body || {}, field));

    if (sentForbiddenField) {
      return NextResponse.json(
        {
          message: `Field '${sentForbiddenField}' diatur otomatis oleh sistem dan tidak boleh dikirim saat update.`,
        },
        { status: 400 },
      );
    }

    const payload = {};

    if (body?.id_periode_konsultan !== undefined) {
      payload.id_periode_konsultan = normalizeRequiredString(body?.id_periode_konsultan, 'id_periode_konsultan', 36);
    }

    if (body?.id_user !== undefined) {
      payload.id_user = normalizeRequiredString(body?.id_user, 'id_user', 36);
    }

    if (body?.id_periode_payroll !== undefined) {
      payload.id_periode_payroll = normalizeOptionalId(body?.id_periode_payroll, 'id_periode_payroll');
    }

    if (body?.id_definisi_komponen_payroll !== undefined) {
      payload.id_definisi_komponen_payroll = normalizeOptionalId(
        body?.id_definisi_komponen_payroll,
        'id_definisi_komponen_payroll',
      );
    }

    if (body?.urutan_tampil !== undefined) {
      payload.urutan_tampil = normalizeOptionalInt(body?.urutan_tampil, 'urutan_tampil', {
        min: 0,
      });
    }

    if (body?.nominal_penyesuaian !== undefined) {
      payload.nominal_penyesuaian = normalizeDecimalString(body?.nominal_penyesuaian, 'nominal_penyesuaian', 2);
    }

    if (body?.id_transaksi_konsultan_ditahan !== undefined) {
      payload.id_transaksi_konsultan_ditahan = normalizeIdList(
        body?.id_transaksi_konsultan_ditahan,
        'id_transaksi_konsultan_ditahan',
      );
    }

    if (body?.status_payout !== undefined) {
      payload.status_payout = normalizeEnum(body?.status_payout, STATUS_PAYOUT_VALUES, 'status_payout');
    }

    if (body?.catatan !== undefined) {
      payload.catatan = normalizeNullableString(body?.catatan, 'catatan');
    }

    const updated = await db.$transaction(async (tx) => {
      const resolved = await resolvePayoutPayload(tx, payload, existing, auth.actor);

      const conflict = await findConflictingPayout(tx, {
        id_periode_konsultan: resolved.payload.id_periode_konsultan,
        id_user: resolved.payload.id_user,
        excludeId: id,
      });

      if (conflict && !conflict.deleted_at) {
        throw createHttpError(409, 'Payout konsultan untuk user dan periode tersebut sudah ada.', {
          conflictId: conflict.id_payout_konsultan,
        });
      }

      if (conflict && conflict.deleted_at) {
        throw createHttpError(
          409,
          'Kombinasi periode dan user sudah dipakai oleh data payout soft delete lain. Pulihkan atau hapus permanen data tersebut terlebih dahulu.',
          {
            conflictId: conflict.id_payout_konsultan,
          },
        );
      }

      await tx.payoutKonsultan.update({
        where: {
          id_payout_konsultan: id,
        },
        data: {
          ...resolved.payload,
        },
      });

      await replacePayoutDetails(tx, id, resolved.transactions);

      const finalRecord = await tx.payoutKonsultan.findUnique({
        where: {
          id_payout_konsultan: id,
        },
        select: buildSelect({ includeDetails: true }),
      });

      let postingSummary = null;
      if (resolved.payload.status_payout === 'DIPOSTING_KE_PAYROLL') {
        postingSummary = await upsertPayrollItemForPayout(tx, finalRecord, auth.actor, {
          id_definisi_komponen_payroll: payload.id_definisi_komponen_payroll,
          urutan_tampil: payload.urutan_tampil,
        });
        await setTransaksiPostingStatusByPayout(tx, id, true);
      }

      const fresh = await tx.payoutKonsultan.findUnique({
        where: {
          id_payout_konsultan: id,
        },
        select: buildSelect({ includeDetails: true }),
      });

      return {
        postingSummary,
        data: enrichPayout(fresh),
      };
    });

    return NextResponse.json({
      message: 'Payout konsultan berhasil diperbarui.',
      ...(updated.postingSummary
        ? {
            posting_summary: {
              payroll_karyawan: updated.postingSummary.payroll,
              item_komponen_payroll: updated.postingSummary.item,
            },
          }
        : {}),
      data: updated.data,
    });
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

    console.error('PUT /api/admin/payout-konsultan/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, DELETE_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);

    const isHardDelete = ['1', 'true'].includes((searchParams.get('hard') || '').toLowerCase());
    const isForceDelete = ['1', 'true'].includes((searchParams.get('force') || '').toLowerCase());
    const hardDelete = isHardDelete || isForceDelete;

    const existing = await getExistingPayout(id, {
      includeDetails: true,
      client: db,
    });

    if (!existing) {
      return NextResponse.json({ message: 'Payout konsultan tidak ditemukan.' }, { status: 404 });
    }

    ensurePayoutDeletable(existing);

    if (!hardDelete) {
      if (existing.deleted_at) {
        return NextResponse.json(
          {
            message: 'Payout konsultan sudah dihapus sebelumnya.',
            mode: 'soft',
          },
          { status: 409 },
        );
      }

      const deletedAt = new Date();

      const [deleted] = await db.$transaction([
        db.payoutKonsultan.update({
          where: {
            id_payout_konsultan: id,
          },
          data: {
            deleted_at: deletedAt,
          },
          select: buildSelect({ includeDetails: true }),
        }),
        db.payoutKonsultanDetail.updateMany({
          where: {
            id_payout_konsultan: id,
            deleted_at: null,
          },
          data: {
            deleted_at: deletedAt,
          },
        }),
      ]);

      return NextResponse.json({
        message: 'Payout konsultan berhasil dihapus (soft delete).',
        mode: 'soft',
        data: enrichPayout(deleted),
      });
    }

    await db.payoutKonsultan.delete({
      where: {
        id_payout_konsultan: id,
      },
    });

    return NextResponse.json({
      message: 'Payout konsultan berhasil dihapus permanen.',
      mode: 'hard',
    });
  } catch (err) {
    if (err?.statusCode) {
      return NextResponse.json({ message: err.message }, { status: err.statusCode });
    }

    if (err?.code === 'P2003') {
      return NextResponse.json(
        {
          message: 'Payout konsultan tidak bisa dihapus permanen karena masih direferensikan data lain.',
        },
        { status: 409 },
      );
    }

    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Payout konsultan tidak ditemukan.' }, { status: 404 });
    }

    console.error('DELETE /api/admin/payout-konsultan/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
