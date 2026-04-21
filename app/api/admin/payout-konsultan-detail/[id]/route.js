import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import {
  DELETE_ROLES,
  EDIT_ROLES,
  VIEW_ROLES,
  buildCreateOrUpdatePayload,
  buildSelect,
  createHttpError,
  ensureAuth,
  ensurePayoutMutable,
  enrichPayoutDetail,
  findDetailByComposite,
  getExistingPayout,
  getExistingPayoutDetail,
  guardRole,
  normalizeBoolean,
  normalizeDecimalString,
  normalizeNullableString,
  normalizeRequiredString,
  recalculatePayoutSummary,
  resolvePayoutAndTransaksi,
} from '../_helper';

export async function GET(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;

    const detail = await getExistingPayoutDetail(id);

    if (!detail) {
      return NextResponse.json({ message: 'Payout konsultan detail tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data: enrichPayoutDetail(detail) });
  } catch (err) {
    console.error('GET /api/admin/payout-konsultan-detail/[id] error:', err);
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
    const { searchParams } = new URL(req.url);
    const restore = ['1', 'true'].includes((searchParams.get('restore') || '').toLowerCase());
    const body = await req.json();

    const existing = await getExistingPayoutDetail(id);

    if (!existing) {
      return NextResponse.json({ message: 'Payout konsultan detail tidak ditemukan.' }, { status: 404 });
    }

    if (existing.deleted_at && !restore) {
      return NextResponse.json(
        {
          message: 'Payout konsultan detail sudah dihapus. Gunakan ?restore=true jika ingin memulihkan sambil memperbarui.',
        },
        { status: 409 },
      );
    }

    if (!existing.deleted_at) {
      const currentPayout = await getExistingPayout(existing.id_payout_konsultan);

      try {
        ensurePayoutMutable(currentPayout);
      } catch (err) {
        if (err?.statusCode) {
          return NextResponse.json({ message: err.message }, { status: err.statusCode });
        }
        throw err;
      }
    }

    const payload = {
      id_payout_konsultan:
        body?.id_payout_konsultan !== undefined
          ? normalizeRequiredString(body?.id_payout_konsultan, 'id_payout_konsultan', 36)
          : existing.id_payout_konsultan,
      id_transaksi_konsultan:
        body?.id_transaksi_konsultan !== undefined
          ? normalizeRequiredString(body?.id_transaksi_konsultan, 'id_transaksi_konsultan', 36)
          : existing.id_transaksi_konsultan,
      ...(body?.nominal_share !== undefined ? { nominal_share: normalizeDecimalString(body?.nominal_share, 'nominal_share', 2, { min: '0' }) } : {}),
      ...(body?.nominal_oss !== undefined ? { nominal_oss: normalizeDecimalString(body?.nominal_oss, 'nominal_oss', 2, { min: '0' }) } : {}),
      ...(body?.ditahan !== undefined ? { ditahan: normalizeBoolean(body?.ditahan, 'ditahan') } : {}),
      ...(body?.catatan !== undefined ? { catatan: normalizeNullableString(body?.catatan, 'catatan') } : {}),
    };

    const result = await db.$transaction(async (tx) => {
      const { payout, transaksi } = await resolvePayoutAndTransaksi(tx, {
        id_payout_konsultan: payload.id_payout_konsultan,
        id_transaksi_konsultan: payload.id_transaksi_konsultan,
        excludeDetailId: existing.id_payout_konsultan_detail,
      });

      const sameComposite = await findDetailByComposite(tx, {
        id_payout_konsultan: payload.id_payout_konsultan,
        id_transaksi_konsultan: payload.id_transaksi_konsultan,
        excludeId: existing.id_payout_konsultan_detail,
      });

      if (sameComposite) {
        throw createHttpError(
          409,
          sameComposite.deleted_at
            ? 'Kombinasi payout dan transaksi tersebut sudah digunakan oleh detail lain yang sudah dihapus. Pulihkan record tersebut atau gunakan kombinasi lain.'
            : 'Detail payout konsultan untuk kombinasi payout dan transaksi tersebut sudah ada.',
        );
      }

      const previousPayoutId = existing.id_payout_konsultan;
      const recordPayload = buildCreateOrUpdatePayload(payload, transaksi, {
        existing,
        useTransaksiDefault: body?.id_transaksi_konsultan !== undefined,
      });

      const detail = await tx.payoutKonsultanDetail.update({
        where: {
          id_payout_konsultan_detail: existing.id_payout_konsultan_detail,
        },
        data: {
          id_payout_konsultan: payout.id_payout_konsultan,
          id_transaksi_konsultan: transaksi.id_transaksi_konsultan,
          ...recordPayload,
          ...(existing.deleted_at && restore ? { deleted_at: null } : {}),
        },
        select: buildSelect(),
      });

      const payout_summary = await recalculatePayoutSummary(tx, payout.id_payout_konsultan);

      let previous_payout_summary = null;
      if (previousPayoutId !== payout.id_payout_konsultan) {
        previous_payout_summary = await recalculatePayoutSummary(tx, previousPayoutId);
      }

      return {
        detail: enrichPayoutDetail(detail),
        payout_summary,
        previous_payout_summary,
        restored: Boolean(existing.deleted_at && restore),
      };
    });

    return NextResponse.json({
      message: result.restored ? 'Payout konsultan detail berhasil dipulihkan dan diperbarui.' : 'Payout konsultan detail berhasil diperbarui.',
      data: result.detail,
      payout_summary: result.payout_summary,
      previous_payout_summary: result.previous_payout_summary,
    });
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

    console.error('PUT /api/admin/payout-konsultan-detail/[id] error:', err);
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
    const hardDelete = ['1', 'true'].includes((searchParams.get('hard') || '').toLowerCase());

    const existing = await getExistingPayoutDetail(id);

    if (!existing) {
      return NextResponse.json({ message: 'Payout konsultan detail tidak ditemukan.' }, { status: 404 });
    }

    const payout = await getExistingPayout(existing.id_payout_konsultan);
    if (!payout) {
      return NextResponse.json({ message: 'Payout konsultan induk tidak ditemukan.' }, { status: 404 });
    }

    if (payout.deleted_at) {
      return NextResponse.json({ message: 'Payout konsultan induk sudah dihapus.' }, { status: 409 });
    }

    if (payout.periode_konsultan?.deleted_at) {
      return NextResponse.json({ message: 'Periode konsultan untuk payout ini sudah dihapus.' }, { status: 409 });
    }

    if (payout.periode_konsultan?.status_periode === 'TERKUNCI') {
      return NextResponse.json({ message: 'Periode konsultan untuk payout ini sudah terkunci.' }, { status: 409 });
    }

    if (payout.status_payout === 'DIPOSTING_KE_PAYROLL' || payout.diposting_pada) {
      return NextResponse.json({ message: 'Payout konsultan sudah diposting ke payroll dan detail tidak boleh dihapus.' }, { status: 409 });
    }

    if (!hardDelete && existing.deleted_at) {
      return NextResponse.json(
        {
          message: 'Payout konsultan detail sudah dihapus sebelumnya.',
          mode: 'soft',
        },
        { status: 409 },
      );
    }

    const result = await db.$transaction(async (tx) => {
      if (hardDelete) {
        await tx.payoutKonsultanDetail.delete({
          where: {
            id_payout_konsultan_detail: id,
          },
        });

        const payout_summary = existing.deleted_at ? null : await recalculatePayoutSummary(tx, existing.id_payout_konsultan);

        return {
          mode: 'hard',
          payout_summary,
        };
      }

      const deleted = await tx.payoutKonsultanDetail.update({
        where: {
          id_payout_konsultan_detail: id,
        },
        data: {
          deleted_at: new Date(),
        },
        select: buildSelect(),
      });

      const payout_summary = await recalculatePayoutSummary(tx, existing.id_payout_konsultan);

      return {
        mode: 'soft',
        data: enrichPayoutDetail(deleted),
        payout_summary,
      };
    });

    if (result.mode === 'hard') {
      return NextResponse.json({
        message: 'Payout konsultan detail berhasil dihapus permanen.',
        mode: 'hard',
        payout_summary: result.payout_summary,
      });
    }

    return NextResponse.json({
      message: 'Payout konsultan detail berhasil dihapus (soft delete).',
      mode: 'soft',
      data: result.data,
      payout_summary: result.payout_summary,
    });
  } catch (err) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Payout konsultan detail tidak ditemukan.' }, { status: 404 });
    }

    if (err?.statusCode) {
      return NextResponse.json({ message: err.message }, { status: err.statusCode });
    }

    if (err instanceof Error && (err.message.includes('payout') || err.message.includes('terkunci') || err.message.includes('dihapus'))) {
      return NextResponse.json({ message: err.message }, { status: 409 });
    }

    console.error('DELETE /api/admin/payout-konsultan-detail/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
