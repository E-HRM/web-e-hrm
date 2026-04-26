export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { findFileInBody, isNullLike, parseRequestBody } from '@/app/api/_utils/requestBody';
import { markPostedCicilanAsPaidForPayroll, recalculateLoanSnapshot } from '@/app/api/admin/cicilan-pinjaman-karyawan/payrollPosting.shared';

import {
  EDIT_ROLES,
  DELETE_ROLES,
  VIEW_ROLES,
  buildSelect,
  deriveApprovalState,
  ensureCanMarkPayrollAsPaid,
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
  computePph21NominalFromSnapshot,
  computePendapatanBersihFromTotals,
  replaceApprovalSteps,
  resolveApprovalSteps,
  STATUS_PAYROLL_VALUES,
  addDecimalStrings,
} from '../payrollKaryawan.shared';

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'e-hrm';

function createHttpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw createHttpError('Supabase env tidak lengkap.', 500);
  }

  return createClient(url, key);
}

function extractBucketPath(publicUrl) {
  if (!publicUrl) return null;

  try {
    const url = new URL(publicUrl);
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (match) {
      return {
        bucket: match[1],
        path: decodeURIComponent(match[2]),
      };
    }
  } catch (_) {
    const fallback = String(publicUrl).match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (fallback) {
      return {
        bucket: fallback[1],
        path: decodeURIComponent(fallback[2]),
      };
    }
  }

  return null;
}

function sanitizePathPart(part) {
  const safe = String(part || '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);

  return safe || 'unknown';
}

async function uploadBuktiBayarToSupabase(actorId, payrollId, file) {
  if (!file) return null;

  const supabase = getSupabase();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extCandidate = (file.name?.split('.').pop() || '').toLowerCase();
  const ext = extCandidate && /^[a-z0-9]+$/.test(extCandidate) ? extCandidate : 'bin';
  const timestamp = Date.now();
  const safeActorId = sanitizePathPart(actorId);
  const safePayrollId = sanitizePathPart(payrollId);
  const path = `payroll/bukti_bayar/${safeActorId}/${safePayrollId}-${timestamp}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, buffer, {
    upsert: true,
    contentType: file.type || 'application/octet-stream',
  });

  if (uploadError) {
    throw createHttpError(`Gagal upload bukti bayar: ${uploadError.message}`, 502);
  }

  const { data: publicData, error: publicError } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  if (publicError) {
    throw createHttpError(`Gagal membuat URL bukti bayar: ${publicError.message}`, 502);
  }

  return publicData?.publicUrl || null;
}

async function deleteBuktiBayarFromSupabase(publicUrl) {
  const info = extractBucketPath(publicUrl);
  if (!info) return;

  try {
    const supabase = getSupabase();
    const { error } = await supabase.storage.from(info.bucket).remove([info.path]);
    if (error) {
      console.warn('Gagal hapus bukti bayar upload yang batal:', error.message);
    }
  } catch (err) {
    console.warn('Gagal hapus bukti bayar upload yang batal:', err?.message || err);
  }
}

function resolveDraftDecimalStrings(body = {}, existing = null, options = {}) {
  const existingPph21 = Number(existing?.pph21_nominal || 0);
  const existingTunjanganBpjs = Number(existing?.tunjangan_bpjs_snapshot || 0);
  const existingTotalPotongan = Number(existing?.total_potongan || 0);
  const existingOtherPotongan = Math.max(existingTotalPotongan - existingPph21 - existingTunjanganBpjs, 0);
  const statusPayroll = String(options?.statusPayroll ?? body?.status_payroll ?? existing?.status_payroll ?? 'DRAFT')
    .trim()
    .toUpperCase();
  const allowNegativePendapatanBersih = statusPayroll === 'DRAFT';

  const totalPendapatanBruto = parseNonNegativeDecimal(body?.total_pendapatan_bruto ?? body?.total_bruto_kena_pajak ?? existing?.total_pendapatan_bruto ?? '0', 'total_pendapatan_bruto');
  const persenTarifSnapshot = options?.persenTarifSnapshot ?? existing?.persen_tarif_snapshot ?? body?.persen_tarif_snapshot ?? '0';
  const tunjanganBpjsSnapshot = parseNonNegativeDecimal(options?.tunjanganBpjsSnapshot ?? body?.tunjangan_bpjs_snapshot ?? existing?.tunjangan_bpjs_snapshot ?? '0', 'tunjangan_bpjs_snapshot');
  const pph21Nominal = parseNonNegativeDecimal(computePph21NominalFromSnapshot(totalPendapatanBruto, persenTarifSnapshot), 'pph21_nominal');
  const totalPotonganLain = parseNonNegativeDecimal(body?.total_potongan_lain ?? existingOtherPotongan, 'total_potongan_lain');
  const totalPotongan = parseNonNegativeDecimal(addDecimalStrings(pph21Nominal, totalPotonganLain, tunjanganBpjsSnapshot), 'total_potongan');
  const pendapatanBersih = computePendapatanBersihFromTotals(totalPendapatanBruto, totalPotongan, {
    allowNegative: allowNegativePendapatanBersih,
  });

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

  return {
    status_payroll,
    finalized_at: existing?.finalized_at || null,
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
  let gaji_pokok_snapshot = existing.gaji_pokok_snapshot;
  let tunjangan_bpjs_snapshot = existing.tunjangan_bpjs_snapshot;

  if (shouldRefreshSnapshot) {
    const profilPayroll = await ensureProfilPayrollExists(nextUserId);

    if (!profilPayroll) {
      return { error: NextResponse.json({ message: 'Profil payroll aktif untuk user ini belum tersedia.' }, { status: 404 }) };
    }

    tarifPajakTer = requestedTarifId
      ? await ensureTarifPajakTerExists(requestedTarifId)
      : existing.id_tarif_pajak_ter
        ? await ensureTarifPajakTerExists(existing.id_tarif_pajak_ter)
        : null;

    if (!tarifPajakTer) {
      return { error: NextResponse.json({ message: 'Tarif pajak TER wajib dipilih untuk payroll karyawan ini.' }, { status: 400 }) };
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
    gaji_pokok_snapshot = parseNonNegativeDecimal(profilPayroll?.gaji_pokok ?? existing.gaji_pokok_snapshot ?? '0', 'gaji_pokok_snapshot');
    tunjangan_bpjs_snapshot = parseNonNegativeDecimal(profilPayroll?.tunjangan_bpjs ?? existing.tunjangan_bpjs_snapshot ?? '0', 'tunjangan_bpjs_snapshot');
  }

  const totalInput = {
    ...body,
    ...(!hasOwn(body, 'total_pendapatan_bruto') && !hasOwn(body, 'total_bruto_kena_pajak') && shouldRefreshSnapshot ? { total_pendapatan_bruto: gaji_pokok_snapshot } : {}),
  };

  const totals = resolveDraftDecimalStrings(totalInput, existing, {
    persenTarifSnapshot: persen_tarif_snapshot,
    tunjanganBpjsSnapshot: tunjangan_bpjs_snapshot,
  });
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
      gaji_pokok_snapshot,
      tunjangan_bpjs_snapshot,
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
      issue_number: hasOwn(body, 'issue_number') ? normalizeNullableString(body?.issue_number, 'issue_number', 100) : existing.issue_number,
      issued_at: hasOwn(body, 'issued_at') ? parseDateTime(body?.issued_at, 'issued_at') : existing.issued_at,
      company_name_snapshot: hasOwn(body, 'company_name_snapshot')
        ? normalizeNullableString(body?.company_name_snapshot, 'company_name_snapshot', 255)
        : existing.company_name_snapshot,
      catatan: hasOwn(body, 'catatan') ? normalizeNullableString(body?.catatan, 'catatan') : existing.catatan,
      ...totals,
      ...statusFields,
    },
  };
}

async function detachPostedCicilanFromPayroll(tx, id_payroll_karyawan) {
  const cicilanRows = await tx.cicilanPinjamanKaryawan.findMany({
    where: {
      id_payroll_karyawan,
      deleted_at: null,
      status_cicilan: 'DIPOSTING',
    },
    select: {
      id_pinjaman_karyawan: true,
    },
  });

  const loanIds = [...new Set(cicilanRows.map((item) => item.id_pinjaman_karyawan).filter(Boolean))];

  const affected = await tx.cicilanPinjamanKaryawan.updateMany({
    where: {
      id_payroll_karyawan,
      deleted_at: null,
      status_cicilan: 'DIPOSTING',
    },
    data: {
      id_payroll_karyawan: null,
      status_cicilan: 'MENUNGGU',
      nominal_terbayar: '0.00',
      diposting_pada: null,
      dibayar_pada: null,
    },
  });

  for (const loanId of loanIds) {
    await recalculateLoanSnapshot(tx, loanId);
  }

  return affected;
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
    const effectiveApprovalStatus = approvalState?.status_approval || enrichPayroll(existing)?.status_approval || existing.status_approval;

    ensureCanMarkPayrollAsPaid(resolved.payload.status_payroll, effectiveApprovalStatus);

    if (resolved.payload.status_payroll === 'DIBAYAR' && !existing.bukti_bayar_url) {
      return NextResponse.json({ message: 'Upload bukti bayar wajib dilakukan sebelum payroll ditandai dibayar.' }, { status: 400 });
    }

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
          dibayar_pada: resolved.payload.finalized_at || new Date(),
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

    if (
      err instanceof Error &&
      (err.message.startsWith('Field ') ||
        err.message.includes('tidak valid') ||
        err.message.includes('tanggal') ||
        err.message.includes('cicilan') ||
        err.message.includes('pinjaman') ||
        err.message.includes('Payroll hanya dapat'))
    ) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }

    console.error('PUT /api/admin/payroll-karyawan/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, EDIT_ROLES);
  if (forbidden) return forbidden;

  const actorId = String(auth.actor?.id || '').trim();
  const payrollId = String(params?.id || '').trim();

  if (!payrollId) {
    return NextResponse.json({ message: 'ID payroll karyawan wajib diisi.' }, { status: 400 });
  }

  let body;
  try {
    const parsed = await parseRequestBody(req);
    body = parsed.body;
  } catch (err) {
    return NextResponse.json({ message: err?.message || 'Body tidak valid.' }, { status: err?.status || 400 });
  }

  const buktiFile = findFileInBody(body, ['bukti_bayar', 'bukti_bayar_file', 'bukti', 'file']);
  const directUrl = hasOwn(body || {}, 'bukti_bayar_url') && !isNullLike(body?.bukti_bayar_url) ? String(body.bukti_bayar_url).trim() : null;

  if (!buktiFile && !directUrl) {
    return NextResponse.json({ message: 'Bukti bayar wajib diunggah.' }, { status: 400 });
  }

  let uploadedUrl = null;
  let paymentPersisted = false;

  try {
    const initialPayroll = await ensurePayrollExists(payrollId);

    if (!initialPayroll || initialPayroll.deleted_at) {
      return NextResponse.json({ message: 'Payroll karyawan tidak ditemukan.' }, { status: 404 });
    }

    const enrichedInitial = enrichPayroll(initialPayroll);
    if (enrichedInitial.status_approval !== 'disetujui') {
      return NextResponse.json({ message: 'Bukti bayar hanya dapat diunggah setelah seluruh approval disetujui.' }, { status: 409 });
    }

    if (initialPayroll.bukti_bayar_url && initialPayroll.status_payroll === 'DIBAYAR') {
      return NextResponse.json({ message: 'Bukti bayar untuk payroll ini sudah diunggah.' }, { status: 409 });
    }

    if (buktiFile) {
      uploadedUrl = await uploadBuktiBayarToSupabase(actorId, payrollId, buktiFile);
    }

    const nextBuktiBayarUrl = uploadedUrl || directUrl;
    const result = await db.$transaction(async (tx) => {
      const current = await tx.payrollKaryawan.findUnique({
        where: { id_payroll_karyawan: payrollId },
        select: buildSelect(),
      });

      if (!current || current.deleted_at) {
        throw createHttpError('Payroll karyawan tidak ditemukan.', 404);
      }

      const enrichedCurrent = enrichPayroll(current);
      if (enrichedCurrent.status_approval !== 'disetujui') {
        throw createHttpError('Bukti bayar hanya dapat diunggah setelah seluruh approval disetujui.', 409);
      }

      if (current.bukti_bayar_url && current.status_payroll === 'DIBAYAR') {
        throw createHttpError('Bukti bayar untuk payroll ini sudah diunggah.', 409);
      }

      const finalizedAt = current.finalized_at || new Date();

      const updated = await tx.payrollKaryawan.update({
        where: { id_payroll_karyawan: payrollId },
        data: {
          bukti_bayar_url: nextBuktiBayarUrl,
          status_payroll: 'DIBAYAR',
          finalized_at: finalizedAt,
        },
        select: buildSelect(),
      });

      let cicilanSyncSummary = null;
      if (current.status_payroll !== 'DIBAYAR') {
        cicilanSyncSummary = await markPostedCicilanAsPaidForPayroll(tx, {
          id_payroll_karyawan: payrollId,
          dibayar_pada: finalizedAt,
        });
      }

      return {
        updated,
        cicilanSyncSummary,
      };
    });
    paymentPersisted = true;

    return NextResponse.json({
      message: 'Bukti bayar berhasil diunggah dan payroll ditandai dibayar.',
      ...(result.cicilanSyncSummary
        ? {
            cicilan_sync_summary: result.cicilanSyncSummary,
          }
        : {}),
      data: enrichPayroll(result.updated),
    });
  } catch (err) {
    if (uploadedUrl && !paymentPersisted) {
      await deleteBuktiBayarFromSupabase(uploadedUrl);
    }

    if (err instanceof Error) {
      return NextResponse.json({ message: err.message }, { status: err.status || 500 });
    }

    console.error('PATCH /api/admin/payroll-karyawan/[id] error:', err);
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

      const { deleted, affectedItems, affectedCicilan, affectedApprovals } = await db.$transaction(async (tx) => {
        const deletedRecord = await tx.payrollKaryawan.update({
          where: { id_payroll_karyawan: id },
          data: {
            deleted_at: deletedAt,
          },
          select: buildSelect(),
        });

        const affectedPayrollItems = await tx.itemKomponenPayroll.updateMany({
          where: {
            id_payroll_karyawan: id,
            deleted_at: null,
          },
          data: {
            deleted_at: deletedAt,
          },
        });

        const affectedLoanInstallments = await detachPostedCicilanFromPayroll(tx, id);

        const affectedApprovalSteps = await tx.approvalPayrollKaryawan.updateMany({
          where: {
            id_payroll_karyawan: id,
            deleted_at: null,
          },
          data: {
            deleted_at: deletedAt,
          },
        });

        return {
          deleted: deletedRecord,
          affectedItems: affectedPayrollItems,
          affectedCicilan: affectedLoanInstallments,
          affectedApprovals: affectedApprovalSteps,
        };
      });

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
      const affectedCicilan = await detachPostedCicilanFromPayroll(tx, id);

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
