import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { markPostedCicilanAsPaidForPayroll } from '@/app/api/admin/cicilan-pinjaman-karyawan/payrollPosting.shared';

import {
  EDIT_ROLES,
  DELETE_ROLES,
  VIEW_ROLES,
  buildSelect,
  deriveApprovalState,
  ensureAuth,
  ensurePayrollExists,
  ensurePeriodeExists,
  ensureProfilPayrollExists,
  ensureTarifPajakTerExists,
  ensureUserExists,
  enrichPayroll,
  guardRole,
  IMMUTABLE_PERIODE_STATUS,
  JENIS_HUBUNGAN_KERJA_VALUES,
  normalizeEnum,
  normalizeNullableString,
  parseDateTime,
  parseNonNegativeDecimal,
  replaceApprovalSteps,
  resolveApprovalSteps,
  STATUS_PAYROLL_VALUES,
  addDecimalStrings,
  subtractDecimalStrings,
} from '../payrollKaryawan.shared';

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

function resolveDraftDecimalStrings(body = {}, existing = null) {
  const existingPph21 = Number(existing?.pph21_nominal || 0);
  const existingTotalPotongan = Number(existing?.total_potongan || 0);
  const existingOtherPotongan = Math.max(existingTotalPotongan - existingPph21, 0);

  const totalPendapatanBruto = parseNonNegativeDecimal(body?.total_pendapatan_bruto ?? body?.total_bruto_kena_pajak ?? existing?.total_pendapatan_bruto ?? '0', 'total_pendapatan_bruto');
  const pph21Nominal = parseNonNegativeDecimal(body?.pph21_nominal ?? body?.total_pajak ?? existing?.pph21_nominal ?? '0', 'pph21_nominal');
  const totalPotonganLain = parseNonNegativeDecimal(body?.total_potongan_lain ?? existingOtherPotongan, 'total_potongan_lain');
  const totalPotongan = parseNonNegativeDecimal(body?.total_potongan ?? addDecimalStrings(pph21Nominal, totalPotonganLain), 'total_potongan');
  const pendapatanBersih = parseNonNegativeDecimal(
    body?.pendapatan_bersih ?? body?.total_dibayarkan ?? existing?.pendapatan_bersih ?? subtractDecimalStrings(totalPendapatanBruto, totalPotongan),
    'pendapatan_bersih',
  );

  return {
    total_pendapatan_bruto: totalPendapatanBruto,
    total_potongan: totalPotongan,
    pph21_nominal: pph21Nominal,
    pendapatan_bersih: pendapatanBersih,
  };
}

function normalizeStatusRelatedFields(body = {}, existing = null) {
  const status_payroll = body?.status_payroll
    ? normalizeEnum(body.status_payroll, STATUS_PAYROLL_VALUES, 'status_payroll')
    : String(existing?.status_payroll || 'DRAFT').trim().toUpperCase();

  const dibayar_pada_raw = body?.dibayar_pada !== undefined ? body.dibayar_pada : existing?.dibayar_pada;
  const finalized_at_raw = body?.finalized_at !== undefined ? body.finalized_at : existing?.finalized_at;
  const locked_at_raw = body?.locked_at !== undefined ? body.locked_at : existing?.locked_at;

  return {
    status_payroll,
    dibayar_pada: status_payroll === 'DIBAYAR' ? parseDateTime(dibayar_pada_raw || new Date().toISOString(), 'dibayar_pada') : null,
    finalized_at: parseDateTime(finalized_at_raw, 'finalized_at'),
    locked_at: parseDateTime(locked_at_raw, 'locked_at'),
  };
}

async function resolveUpdatePayload(existing, body = {}) {
  const nextPeriodeId = normalizeNullableString(body?.id_periode_payroll, 'id_periode_payroll', 36) || existing.id_periode_payroll;
  const nextUserId = normalizeNullableString(body?.id_user, 'id_user', 36) || existing.id_user;

  const [periode, user] = await Promise.all([ensurePeriodeExists(nextPeriodeId), ensureUserExists(nextUserId)]);

  if (!periode) {
    return { error: NextResponse.json({ message: 'Periode payroll tidak ditemukan.' }, { status: 404 }) };
  }

  if (!user) {
    return { error: NextResponse.json({ message: 'User tidak ditemukan atau sudah dihapus.' }, { status: 404 }) };
  }

  if (IMMUTABLE_PERIODE_STATUS.has(String(periode.status_periode || '').toUpperCase())) {
    return { error: NextResponse.json({ message: 'Periode payroll tujuan sudah final/terkunci.' }, { status: 409 }) };
  }

  const requestedTarifId = hasOwn(body, 'id_tarif_pajak_ter') ? normalizeNullableString(body?.id_tarif_pajak_ter, 'id_tarif_pajak_ter', 36) : undefined;
  const requestedJenisHubungan = hasOwn(body, 'jenis_hubungan_kerja') ? normalizeEnum(body?.jenis_hubungan_kerja, JENIS_HUBUNGAN_KERJA_VALUES, 'jenis_hubungan_kerja') : undefined;

  const shouldRefreshSnapshot =
    hasOwn(body, 'id_user') || hasOwn(body, 'id_tarif_pajak_ter') || hasOwn(body, 'jenis_hubungan_kerja') || !existing.id_tarif_pajak_ter;

  let tarifPajakTer = null;
  let id_profil_payroll = existing.id_profil_payroll;
  let jenis_hubungan_kerja = existing.jenis_hubungan_kerja;
  let id_tarif_pajak_ter = existing.id_tarif_pajak_ter;
  let kode_kategori_pajak_snapshot = existing.kode_kategori_pajak_snapshot;
  let persen_tarif_snapshot = existing.persen_tarif_snapshot;
  let penghasilan_dari_snapshot = existing.penghasilan_dari_snapshot;
  let penghasilan_sampai_snapshot = existing.penghasilan_sampai_snapshot;
  let berlaku_mulai_tarif_snapshot = existing.berlaku_mulai_tarif_snapshot;
  let berlaku_sampai_tarif_snapshot = existing.berlaku_sampai_tarif_snapshot;

  if (shouldRefreshSnapshot) {
    const profilPayroll = await ensureProfilPayrollExists(nextUserId);

    tarifPajakTer = requestedTarifId
      ? await ensureTarifPajakTerExists(requestedTarifId)
      : profilPayroll?.id_tarif_pajak_ter
        ? await ensureTarifPajakTerExists(profilPayroll.id_tarif_pajak_ter)
        : null;

    if (!tarifPajakTer) {
      return { error: NextResponse.json({ message: 'Tarif pajak TER untuk user ini belum tersedia.' }, { status: 404 }) };
    }

    id_profil_payroll = profilPayroll?.id_profil_payroll || existing.id_profil_payroll;
    jenis_hubungan_kerja = requestedJenisHubungan || String(profilPayroll?.jenis_hubungan_kerja || existing.jenis_hubungan_kerja || '').trim().toUpperCase();

    if (!jenis_hubungan_kerja || !JENIS_HUBUNGAN_KERJA_VALUES.has(jenis_hubungan_kerja)) {
      return {
        error: NextResponse.json(
          {
            message: `Jenis hubungan kerja tidak valid. Nilai yang diizinkan: ${Array.from(JENIS_HUBUNGAN_KERJA_VALUES).join(', ')}`,
          },
          { status: 400 },
        ),
      };
    }

    id_tarif_pajak_ter = tarifPajakTer.id_tarif_pajak_ter;
    kode_kategori_pajak_snapshot = tarifPajakTer.kode_kategori_pajak;
    persen_tarif_snapshot = parseNonNegativeDecimal(tarifPajakTer.persen_tarif, 'persen_tarif_snapshot', { scale: 4 });
    penghasilan_dari_snapshot = parseNonNegativeDecimal(tarifPajakTer.penghasilan_dari, 'penghasilan_dari_snapshot');
    penghasilan_sampai_snapshot =
      tarifPajakTer.penghasilan_sampai == null ? null : parseNonNegativeDecimal(tarifPajakTer.penghasilan_sampai, 'penghasilan_sampai_snapshot', { allowNull: true });
    berlaku_mulai_tarif_snapshot = tarifPajakTer.berlaku_mulai;
    berlaku_sampai_tarif_snapshot = tarifPajakTer.berlaku_sampai;
  }

  const totals = resolveDraftDecimalStrings(body, existing);
  const statusFields = normalizeStatusRelatedFields(body, existing);

  return {
    payload: {
      id_periode_payroll: nextPeriodeId,
      id_user: nextUserId,
      id_profil_payroll,
      id_tarif_pajak_ter,
      nama_karyawan:
        normalizeNullableString(body?.nama_karyawan, 'nama_karyawan', 255) ||
        normalizeNullableString(body?.nama_karyawan_snapshot, 'nama_karyawan_snapshot', 255) ||
        user.nama_pengguna ||
        existing.nama_karyawan,
      jenis_hubungan_kerja,
      kode_kategori_pajak_snapshot,
      persen_tarif_snapshot,
      penghasilan_dari_snapshot,
      penghasilan_sampai_snapshot,
      berlaku_mulai_tarif_snapshot,
      berlaku_sampai_tarif_snapshot,
      bank_name:
        normalizeNullableString(body?.bank_name, 'bank_name', 50) ||
        normalizeNullableString(body?.nama_bank_snapshot, 'nama_bank_snapshot', 50) ||
        user.jenis_bank ||
        existing.bank_name,
      bank_account:
        normalizeNullableString(body?.bank_account, 'bank_account', 50) ||
        normalizeNullableString(body?.nomor_rekening_snapshot, 'nomor_rekening_snapshot', 50) ||
        user.nomor_rekening ||
        existing.bank_account,
      catatan: hasOwn(body, 'catatan') ? normalizeNullableString(body?.catatan, 'catatan') : existing.catatan,
      ...totals,
      ...statusFields,
    },
  };
}

export async function GET(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;
    const data = await ensurePayrollExists(id);

    if (!data) {
      return NextResponse.json({ message: 'Payroll karyawan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data: enrichPayroll(data) });
  } catch (err) {
    console.error('GET /api/admin/payroll-karyawan/[id] error:', err);
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

    const existing = await ensurePayrollExists(id);

    if (!existing) {
      return NextResponse.json({ message: 'Payroll karyawan tidak ditemukan.' }, { status: 404 });
    }

    if (existing.deleted_at) {
      return NextResponse.json({ message: 'Payroll karyawan sudah dihapus sebelumnya.' }, { status: 409 });
    }

    const businessState = enrichPayroll(existing)?.business_state || {};
    if (!businessState.bisa_diubah) {
      return NextResponse.json({ message: 'Payroll karyawan sudah final/terkunci dan tidak bisa diubah.' }, { status: 409 });
    }

    const resolved = await resolveUpdatePayload(existing, body);
    if (resolved.error) return resolved.error;

    const shouldReplaceApprovals = Object.prototype.hasOwnProperty.call(body || {}, 'approval_steps');
    const approvalSteps = shouldReplaceApprovals ? await resolveApprovalSteps(body.approval_steps) : null;
    const approvalState = approvalSteps ? deriveApprovalState(approvalSteps) : null;

    if (resolved.payload.id_periode_payroll !== existing.id_periode_payroll || resolved.payload.id_user !== existing.id_user) {
      const duplicate = await db.payrollKaryawan.findFirst({
        where: {
          id_periode_payroll: resolved.payload.id_periode_payroll,
          id_user: resolved.payload.id_user,
          NOT: {
            id_payroll_karyawan: existing.id_payroll_karyawan,
          },
        },
        select: {
          id_payroll_karyawan: true,
          deleted_at: true,
        },
      });

      if (duplicate && duplicate.deleted_at === null) {
        return NextResponse.json({ message: 'Payroll karyawan untuk user dan periode tujuan sudah ada.' }, { status: 409 });
      }

      if (duplicate && duplicate.deleted_at !== null) {
        return NextResponse.json(
          {
            message: 'Kombinasi user dan periode tujuan sudah digunakan oleh payroll yang di-soft delete. Pulihkan atau hapus permanen data tersebut terlebih dahulu.',
          },
          { status: 409 },
        );
      }
    }

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.payrollKaryawan.update({
        where: { id_payroll_karyawan: existing.id_payroll_karyawan },
        data: {
          ...resolved.payload,
          ...(approvalState
            ? {
                status_approval: approvalState.status_approval,
                current_level_approval: approvalState.current_level_approval,
              }
            : {}),
        },
        select: buildSelect(),
      });

      if (approvalSteps) {
        await replaceApprovalSteps(tx, existing.id_payroll_karyawan, approvalSteps);
      }

      const refreshed = await tx.payrollKaryawan.findUnique({
        where: { id_payroll_karyawan: existing.id_payroll_karyawan },
        select: buildSelect(),
      });

      let cicilanSyncSummary = null;

      if (existing.status_payroll !== 'DIBAYAR' && resolved.payload.status_payroll === 'DIBAYAR') {
        cicilanSyncSummary = await markPostedCicilanAsPaidForPayroll(tx, {
          id_payroll_karyawan: existing.id_payroll_karyawan,
          dibayar_pada: resolved.payload.dibayar_pada || new Date(),
        });
      }

      return {
        updated: refreshed || updated,
        cicilanSyncSummary,
      };
    });

    return NextResponse.json({
      message: 'Payroll karyawan berhasil diperbarui.',
      ...(result.cicilanSyncSummary
        ? {
            cicilan_sync_summary: result.cicilanSyncSummary,
          }
        : {}),
      data: enrichPayroll(result.updated),
    });
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Payroll karyawan untuk user dan periode tujuan sudah ada.' }, { status: 409 });
    }

    if (err instanceof Error && (err.message.startsWith('Field ') || err.message.includes('tidak valid') || err.message.includes('tanggal') || err.message.includes('cicilan') || err.message.includes('pinjaman'))) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }

    console.error('PUT /api/admin/payroll-karyawan/[id] error:', err);
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

    const hardDelete = ['1', 'true'].includes((searchParams.get('hard') || searchParams.get('force') || '').toLowerCase());
    const existing = await ensurePayrollExists(id);

    if (!existing) {
      return NextResponse.json({ message: 'Payroll karyawan tidak ditemukan.' }, { status: 404 });
    }

    if (!hardDelete) {
      if (existing.deleted_at) {
        return NextResponse.json({ message: 'Payroll karyawan sudah dihapus sebelumnya.' }, { status: 409 });
      }

      if (existing.business_state?.payroll_immutable) {
        return NextResponse.json({ message: 'Payroll karyawan yang sudah final/disetujui tidak boleh dihapus.' }, { status: 409 });
      }

      const deletedAt = new Date();

      const [deleted, affectedItems, affectedCicilan, affectedApprovals] = await db.$transaction([
        db.payrollKaryawan.update({
          where: { id_payroll_karyawan: id },
          data: {
            deleted_at: deletedAt,
          },
          select: buildSelect(),
        }),
        db.itemKomponenPayroll.updateMany({
          where: {
            id_payroll_karyawan: id,
            deleted_at: null,
          },
          data: {
            deleted_at: deletedAt,
          },
        }),
        db.cicilanPinjamanKaryawan.updateMany({
          where: {
            id_payroll_karyawan: id,
            deleted_at: null,
            status_cicilan: 'DIPOSTING',
          },
          data: {
            id_payroll_karyawan: null,
            status_cicilan: 'MENUNGGU',
            diposting_pada: null,
          },
        }),
        db.approvalPayrollKaryawan.updateMany({
          where: {
            id_payroll_karyawan: id,
            deleted_at: null,
          },
          data: {
            deleted_at: deletedAt,
          },
        }),
      ]);

      return NextResponse.json({
        message: 'Payroll karyawan berhasil dihapus (soft delete).',
        mode: 'soft',
        data: enrichPayroll(deleted),
        cascade_summary: {
          item_komponen_soft_deleted: affectedItems.count,
          cicilan_pinjaman_dilepas_dari_payroll: affectedCicilan.count,
          approval_karyawan_soft_deleted: affectedApprovals.count,
        },
      });
    }

    if (existing.business_state?.payroll_immutable) {
      return NextResponse.json({ message: 'Payroll karyawan yang sudah final/disetujui tidak boleh dihapus permanen.' }, { status: 409 });
    }

    const detachedCicilan = await db.$transaction(async (tx) => {
      const affectedCicilan = await tx.cicilanPinjamanKaryawan.updateMany({
        where: {
          id_payroll_karyawan: id,
          deleted_at: null,
          status_cicilan: 'DIPOSTING',
        },
        data: {
          id_payroll_karyawan: null,
          status_cicilan: 'MENUNGGU',
          diposting_pada: null,
        },
      });

      await tx.payrollKaryawan.delete({
        where: { id_payroll_karyawan: id },
      });

      return affectedCicilan.count;
    });

    return NextResponse.json({
      message: 'Payroll karyawan berhasil dihapus permanen.',
      mode: 'hard',
      relation_summary: {
        item_komponen_terhapus_mengikuti_cascade: existing?._count?.item_komponen || 0,
        cicilan_pinjaman_dilepas_dari_payroll: detachedCicilan,
        approval_karyawan_terhapus_mengikuti_cascade: existing?._count?.approvals || 0,
      },
    });
  } catch (err) {
    if (err?.code === 'P2003') {
      return NextResponse.json(
        {
          message: 'Payroll karyawan tidak bisa dihapus permanen karena masih direferensikan oleh data lain.',
        },
        { status: 409 },
      );
    }

    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Payroll karyawan tidak ditemukan.' }, { status: 404 });
    }

    console.error('DELETE /api/admin/payroll-karyawan/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
