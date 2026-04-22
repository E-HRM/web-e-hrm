import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

export const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
export const CREATE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
export const EDIT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
export const DELETE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

export const STATUS_PAYROLL_VALUES = new Set(['DRAFT', 'TERSIMPAN', 'DISETUJUI', 'DIBAYAR']);
export const STATUS_PERIODE_VALUES = new Set(['DRAFT', 'DIPROSES', 'DIREVIEW', 'FINAL', 'TERKUNCI']);
export const STATUS_APPROVAL_VALUES = new Set(['pending', 'disetujui', 'ditolak']);
export const JENIS_HUBUNGAN_KERJA_VALUES = new Set(['FREELANCE', 'INTERNSHIP', 'PKWT', 'PKWTT']);

export const IMMUTABLE_PAYROLL_STATUS = new Set(['DISETUJUI', 'DIBAYAR']);
export const IMMUTABLE_PERIODE_STATUS = new Set(['FINAL', 'TERKUNCI']);

export const ALLOWED_ORDER_BY = new Set([
  'created_at',
  'updated_at',
  'nama_karyawan',
  'status_payroll',
  'status_approval',
  'current_level_approval',
  'total_pendapatan_bruto',
  'total_potongan',
  'pph21_nominal',
  'pendapatan_bersih',
  'dibayar_pada',
  'finalized_at',
  'locked_at',
]);

export const normRole = (role) =>
  String(role || '')
    .trim()
    .toUpperCase();

export function normalizeRequiredId(value, fieldName = 'id') {
  const normalized = String(value || '').trim();

  if (!normalized) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  if (normalized.length > 36) {
    throw new Error(`Field '${fieldName}' maksimal 36 karakter.`);
  }

  return normalized;
}

function normalizeApprovalStatus(value, fieldName = 'status_approval') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (!normalized) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  if (!STATUS_APPROVAL_VALUES.has(normalized)) {
    throw new Error(`${fieldName} tidak valid. Nilai yang diizinkan: ${Array.from(STATUS_APPROVAL_VALUES).join(', ')}`);
  }

  return normalized;
}

export function normalizeNullableString(value, fieldName = 'string', maxLength = null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  if (maxLength !== null && normalized.length > maxLength) {
    throw new Error(`Field '${fieldName}' maksimal ${maxLength} karakter.`);
  }

  return normalized;
}

export function normalizeBoolean(value, fieldName = 'boolean') {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'ya', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'tidak', 'no'].includes(normalized)) return false;
  }

  throw new Error(`Field '${fieldName}' harus bernilai boolean.`);
}

export function normalizeEnum(value, allowedValues, fieldName) {
  const normalized = String(value || '')
    .trim()
    .toUpperCase();

  if (!normalized) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  if (!allowedValues.has(normalized)) {
    throw new Error(`${fieldName} tidak valid. Nilai yang diizinkan: ${Array.from(allowedValues).join(', ')}`);
  }

  return normalized;
}

export function parseDateOnly(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Field '${fieldName}' harus berupa tanggal yang valid.`);
  }

  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

export function parseDateTime(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Field '${fieldName}' harus berupa tanggal/waktu yang valid.`);
  }

  return parsed;
}

export function parseNonNegativeDecimal(value, fieldName, options = {}) {
  const { allowNull = false, scale = 2 } = options;

  if (value === undefined) return undefined;
  if (value === null || value === '') {
    if (allowNull) return null;
    throw new Error(`Field '${fieldName}' tidak boleh kosong.`);
  }

  const normalized = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim().replace(',', '.') : value && typeof value.toString === 'function' ? String(value.toString()).trim().replace(',', '.') : null;

  if (!normalized || !/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Field '${fieldName}' harus berupa angka yang valid.`);
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Field '${fieldName}' harus berupa angka yang valid.`);
  }

  if (parsed < 0) {
    throw new Error(`Field '${fieldName}' tidak boleh bernilai negatif.`);
  }

  return parsed.toFixed(scale);
}

export function addDecimalStrings(...values) {
  const total = values.reduce((sum, value) => sum + Number(value || 0), 0);
  return total.toFixed(2);
}

export function subtractDecimalStrings(minuend, subtrahend, fieldName = 'pendapatan_bersih') {
  const result = Number(minuend || 0) - Number(subtrahend || 0);

  if (!Number.isFinite(result)) {
    throw new Error(`Field '${fieldName}' tidak valid.`);
  }

  if (result < 0) {
    throw new Error(`Field '${fieldName}' tidak boleh bernilai negatif.`);
  }

  return result.toFixed(2);
}

export function computePph21NominalFromSnapshot(totalPendapatanBruto, persenTarifSnapshot, scale = 2) {
  const bruto = Number(totalPendapatanBruto || 0);
  const persenTarif = Number(persenTarifSnapshot || 0);

  if (!Number.isFinite(bruto) || bruto <= 0) {
    return (0).toFixed(scale);
  }

  if (!Number.isFinite(persenTarif) || persenTarif <= 0) {
    return (0).toFixed(scale);
  }

  return ((bruto * persenTarif) / 100).toFixed(scale);
}

export async function ensureAuth(req) {
  const auth = req.headers.get('authorization') || '';

  if (auth.startsWith('Bearer ')) {
    try {
      const payload = verifyAuthToken(auth.slice(7));

      return {
        actor: {
          id: payload?.sub || payload?.id_user || payload?.userId,
          role: normRole(payload?.role),
          source: 'bearer',
        },
      };
    } catch (_) {
      // fallback ke session
    }
  }

  const sessionOrRes = await authenticateRequest();
  if (sessionOrRes instanceof NextResponse) return sessionOrRes;

  return {
    actor: {
      id: sessionOrRes?.user?.id || sessionOrRes?.user?.id_user,
      role: normRole(sessionOrRes?.user?.role),
      source: 'session',
    },
  };
}

export function guardRole(actor, allowedRoles) {
  if (!allowedRoles.has(normRole(actor?.role))) {
    return NextResponse.json({ message: 'Forbidden: Anda tidak memiliki akses ke resource ini.' }, { status: 403 });
  }

  return null;
}

export function buildSelect() {
  return {
    id_payroll_karyawan: true,
    id_periode_payroll: true,
    id_user: true,
    id_profil_payroll: true,
    id_tarif_pajak_ter: true,
    nama_karyawan: true,
    jenis_hubungan_kerja: true,
    kode_kategori_pajak_snapshot: true,
    persen_tarif_snapshot: true,
    penghasilan_dari_snapshot: true,
    penghasilan_sampai_snapshot: true,
    berlaku_mulai_tarif_snapshot: true,
    berlaku_sampai_tarif_snapshot: true,
    gaji_pokok_snapshot: true,
    total_pendapatan_bruto: true,
    total_potongan: true,
    pph21_nominal: true,
    pendapatan_bersih: true,
    bank_name: true,
    bank_account: true,
    status_payroll: true,
    status_approval: true,
    current_level_approval: true,
    dibayar_pada: true,
    finalized_at: true,
    locked_at: true,
    catatan: true,
    issue_number: true,
    issued_at: true,
    company_name_snapshot: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    periode: {
      select: {
        id_periode_payroll: true,
        tahun: true,
        bulan: true,
        tanggal_mulai: true,
        tanggal_selesai: true,
        status_periode: true,
        catatan: true,
        created_at: true,
        updated_at: true,
      },
    },
    user: {
      select: {
        id_user: true,
        nama_pengguna: true,
        email: true,
        role: true,
        nomor_induk_karyawan: true,
        status_kerja: true,
        nomor_rekening: true,
        jenis_bank: true,
        foto_profil_user: true,
        deleted_at: true,
        departement: {
          select: {
            id_departement: true,
            nama_departement: true,
          },
        },
        jabatan: {
          select: {
            id_jabatan: true,
            nama_jabatan: true,
          },
        },
      },
    },
    profil_payroll: {
      select: {
        id_profil_payroll: true,
        gaji_pokok: true,
        jenis_hubungan_kerja: true,
        payroll_aktif: true,
      },
    },
    tarif_pajak_ter: {
      select: {
        id_tarif_pajak_ter: true,
        kode_kategori_pajak: true,
        persen_tarif: true,
        penghasilan_dari: true,
        penghasilan_sampai: true,
        berlaku_mulai: true,
        berlaku_sampai: true,
        deleted_at: true,
      },
    },
    approvals: {
      where: {
        deleted_at: null,
      },
      orderBy: {
        level: 'asc',
      },
      select: {
        id_approval_payroll_karyawan: true,
        level: true,
        approver_user_id: true,
        approver_role: true,
        approver_nama_snapshot: true,
        decision: true,
        decided_at: true,
        note: true,
        ttd_approval_url: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        approver: {
          select: {
            id_user: true,
            nama_pengguna: true,
            email: true,
            role: true,
            foto_profil_user: true,
            deleted_at: true,
          },
        },
      },
    },
    _count: {
      select: {
        item_komponen: true,
        cicilan_pinjaman: true,
        approvals: true,
      },
    },
  };
}

function buildSlipItemSelect() {
  return {
    id_item_komponen_payroll: true,
    id_definisi_komponen_payroll: true,
    tipe_komponen: true,
    arah_komponen: true,
    nama_komponen: true,
    nominal: true,
    kena_pajak: true,
    urutan_tampil: true,
    catatan: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    definisi_komponen: {
      select: {
        id_definisi_komponen_payroll: true,
        nama_komponen: true,
        arah_komponen: true,
        kena_pajak_default: true,
        tipe_komponen: {
          select: {
            id_tipe_komponen_payroll: true,
            nama_tipe_komponen: true,
          },
        },
      },
    },
  };
}

export function buildSlipSelect() {
  return {
    ...buildSelect(),
    item_komponen: {
      where: {
        deleted_at: null,
      },
      orderBy: [{ urutan_tampil: 'asc' }, { created_at: 'asc' }],
      select: buildSlipItemSelect(),
    },
  };
}

export function deriveApprovalState(approvalSteps = []) {
  const orderedSteps = Array.isArray(approvalSteps) ? approvalSteps.filter((step) => !step?.deleted_at).sort((a, b) => Number(a?.level || 0) - Number(b?.level || 0)) : [];

  const total_steps = orderedSteps.length;
  const approved_steps = orderedSteps.filter((step) => step?.decision === 'disetujui').length;
  const rejected_steps = orderedSteps.filter((step) => step?.decision === 'ditolak').length;
  const pending_steps = orderedSteps.filter((step) => step?.decision === 'pending').length;

  const rejectedStep = orderedSteps.find((step) => step?.decision === 'ditolak') || null;
  const pendingStep = orderedSteps.find((step) => step?.decision === 'pending') || null;
  const lastStep = orderedSteps.at(-1) || null;

  let status_approval = 'pending';
  let current_level_approval = orderedSteps[0]?.level ?? null;
  let current_step = orderedSteps[0] || null;

  if (rejectedStep) {
    status_approval = 'ditolak';
    current_level_approval = rejectedStep.level;
    current_step = rejectedStep;
  } else if (pendingStep) {
    status_approval = 'pending';
    current_level_approval = pendingStep.level;
    current_step = pendingStep;
  } else if (total_steps > 0) {
    status_approval = 'disetujui';
    current_level_approval = lastStep?.level ?? null;
    current_step = lastStep;
  }

  return {
    status_approval,
    current_level_approval,
    total_steps,
    approved_steps,
    rejected_steps,
    pending_steps,
    current_step,
  };
}

export function enrichPayroll(item) {
  if (!item) return item;

  const payrollStatus = String(item.status_payroll || '').toUpperCase();
  const periodeStatus = String(item?.periode?.status_periode || '').toUpperCase();
  const approvalState = deriveApprovalState(item.approvals);
  const resolvedStatusApproval = approvalState.total_steps > 0 ? approvalState.status_approval : normalizeApprovalStatus(item.status_approval || 'pending');
  const resolvedCurrentLevelApproval = approvalState.total_steps > 0 ? approvalState.current_level_approval : (item.current_level_approval ?? null);
  const approvalImmutable = resolvedStatusApproval === 'disetujui';
  const payrollImmutable = IMMUTABLE_PAYROLL_STATUS.has(payrollStatus) || Boolean(item.finalized_at) || Boolean(item.locked_at);
  const periodeImmutable = IMMUTABLE_PERIODE_STATUS.has(periodeStatus);

  return {
    ...item,
    status_approval: resolvedStatusApproval,
    current_level_approval: resolvedCurrentLevelApproval,
    approval_state: {
      ...approvalState,
      status_approval: resolvedStatusApproval,
      current_level_approval: resolvedCurrentLevelApproval,
    },
    business_state: {
      approval_immutable: approvalImmutable,
      payroll_immutable: payrollImmutable,
      periode_immutable: periodeImmutable,
      bisa_diubah: !Boolean(item.deleted_at) && !approvalImmutable && !payrollImmutable && !periodeImmutable,
      bisa_dihapus: !Boolean(item.deleted_at) && !approvalImmutable && !payrollImmutable && !periodeImmutable,
    },
  };
}

function toDecimalNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortSlipItems(items = []) {
  return [...items].sort((left, right) => {
    const leftOrder = Number.isFinite(Number(left?.urutan_tampil)) ? Number(left.urutan_tampil) : Number.MAX_SAFE_INTEGER;
    const rightOrder = Number.isFinite(Number(right?.urutan_tampil)) ? Number(right.urutan_tampil) : Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    const leftCreatedAt = new Date(left?.created_at || 0).getTime();
    const rightCreatedAt = new Date(right?.created_at || 0).getTime();

    if (leftCreatedAt !== rightCreatedAt) {
      return leftCreatedAt - rightCreatedAt;
    }

    return String(left?.nama_komponen || '').localeCompare(String(right?.nama_komponen || ''));
  });
}

function normalizeSlipItem(item) {
  if (!item) return null;

  const tipeKomponenLabel = String(item?.definisi_komponen?.tipe_komponen?.nama_tipe_komponen || item?.tipe_komponen || '')
    .trim()
    .toUpperCase();

  return {
    ...item,
    nominal_number: toDecimalNumber(item?.nominal),
    tipe_komponen_label: tipeKomponenLabel,
  };
}

export function buildSlipPayload(payroll) {
  if (!payroll) return null;

  const enrichedPayroll = enrichPayroll(payroll);
  const normalizedItems = Array.isArray(enrichedPayroll?.item_komponen) ? enrichedPayroll.item_komponen.map(normalizeSlipItem).filter(Boolean) : [];

  const pemasukanItems = normalizedItems.filter((item) => item.arah_komponen === 'PEMASUKAN');
  const potonganItems = normalizedItems.filter((item) => item.arah_komponen === 'POTONGAN');

  const pph21Nominal = toDecimalNumber(enrichedPayroll?.pph21_nominal);

  const groupedItems = [
    {
      key: 'PEMASUKAN',
      label: 'Pendapatan',
      items: sortSlipItems(pemasukanItems),
    },
    {
      key: 'POTONGAN',
      label: 'Potongan',
      items: sortSlipItems(potonganItems),
    },
  ];

  const approvalSteps = Array.isArray(enrichedPayroll?.approvals) ? enrichedPayroll.approvals : [];
  const approvedSteps = approvalSteps.filter((step) => step?.decision === 'disetujui');

  return {
    payroll: enrichedPayroll,
    document: {
      issue_number: enrichedPayroll.issue_number || null,
      issued_at: enrichedPayroll.issued_at || null,
      company_name_snapshot: enrichedPayroll.company_name_snapshot || null,
    },
    employee: {
      nama_karyawan: enrichedPayroll.nama_karyawan || enrichedPayroll?.user?.nama_pengguna || null,
      nama_jabatan: enrichedPayroll?.user?.jabatan?.nama_jabatan || null,
      nama_departement: enrichedPayroll?.user?.departement?.nama_departement || null,
      jenis_hubungan_kerja: enrichedPayroll.jenis_hubungan_kerja || null,
    },
    period: {
      id_periode_payroll: enrichedPayroll?.periode?.id_periode_payroll || enrichedPayroll.id_periode_payroll,
      bulan: enrichedPayroll?.periode?.bulan || null,
      tahun: enrichedPayroll?.periode?.tahun || null,
      tanggal_mulai: enrichedPayroll?.periode?.tanggal_mulai || null,
      tanggal_selesai: enrichedPayroll?.periode?.tanggal_selesai || null,
      status_periode: enrichedPayroll?.periode?.status_periode || null,
    },
    groups: groupedItems,
    summary: {
      total_pendapatan_bruto: toDecimalNumber(enrichedPayroll?.total_pendapatan_bruto),
      total_potongan: toDecimalNumber(enrichedPayroll?.total_potongan),
      pph21_nominal: pph21Nominal,
      pendapatan_bersih: toDecimalNumber(enrichedPayroll?.pendapatan_bersih),
    },
    approval: {
      status_approval: enrichedPayroll.status_approval,
      current_level_approval: enrichedPayroll.current_level_approval,
      steps: approvalSteps,
      approved_steps: approvedSteps,
    },
  };
}

export function buildSearchClauses(search) {
  if (!search) return [];

  return [
    { nama_karyawan: { contains: search } },
    { catatan: { contains: search } },
    { kode_kategori_pajak_snapshot: { contains: search } },
    { user: { is: { nama_pengguna: { contains: search } } } },
    { user: { is: { email: { contains: search } } } },
    { user: { is: { nomor_induk_karyawan: { contains: search } } } },
    { user: { is: { departement: { is: { nama_departement: { contains: search } } } } } },
    { user: { is: { jabatan: { is: { nama_jabatan: { contains: search } } } } } },
    { periode: { is: { catatan: { contains: search } } } },
    { tarif_pajak_ter: { is: { kode_kategori_pajak: { contains: search } } } },
    {
      approvals: {
        some: {
          deleted_at: null,
          OR: [{ approver_nama_snapshot: { contains: search } }, { approver: { is: { nama_pengguna: { contains: search } } } }, { approver: { is: { email: { contains: search } } } }],
        },
      },
    },
  ];
}

export async function ensurePeriodeExists(id_periode_payroll) {
  return db.periodePayroll.findUnique({
    where: {
      id_periode_payroll,
    },
    select: {
      id_periode_payroll: true,
      status_periode: true,
      tahun: true,
      bulan: true,
    },
  });
}

export async function ensureUserExists(id_user) {
  return db.user.findFirst({
    where: {
      id_user,
      deleted_at: null,
    },
    select: {
      id_user: true,
      nama_pengguna: true,
      email: true,
      role: true,
      nomor_induk_karyawan: true,
      nomor_rekening: true,
      jenis_bank: true,
      deleted_at: true,
      departement: {
        select: {
          id_departement: true,
          nama_departement: true,
        },
      },
      jabatan: {
        select: {
          id_jabatan: true,
          nama_jabatan: true,
        },
      },
    },
  });
}

export async function ensureTarifPajakTerExists(id_tarif_pajak_ter) {
  return db.tarifPajakTER.findFirst({
    where: {
      id_tarif_pajak_ter,
      deleted_at: null,
    },
    select: {
      id_tarif_pajak_ter: true,
      kode_kategori_pajak: true,
      persen_tarif: true,
      penghasilan_dari: true,
      penghasilan_sampai: true,
      berlaku_mulai: true,
      berlaku_sampai: true,
      deleted_at: true,
    },
  });
}

export async function ensureProfilPayrollExists(id_user) {
  return db.profilPayroll.findFirst({
    where: {
      id_user,
      deleted_at: null,
      payroll_aktif: true,
    },
    select: {
      id_profil_payroll: true,
      id_user: true,
      id_tarif_pajak_ter: true,
      jenis_hubungan_kerja: true,
      gaji_pokok: true,
      payroll_aktif: true,
      deleted_at: true,
      tarif_pajak_ter: {
        select: {
          id_tarif_pajak_ter: true,
          kode_kategori_pajak: true,
          persen_tarif: true,
          penghasilan_dari: true,
          penghasilan_sampai: true,
          berlaku_mulai: true,
          berlaku_sampai: true,
          deleted_at: true,
        },
      },
    },
  });
}

export async function ensurePayrollExists(id_payroll_karyawan) {
  return db.payrollKaryawan.findUnique({
    where: { id_payroll_karyawan },
    select: buildSelect(),
  });
}

export async function resolveApprovalSteps(rawSteps) {
  if (!Array.isArray(rawSteps)) {
    throw new Error("Field 'approval_steps' wajib berupa array.");
  }

  if (rawSteps.length === 0) {
    throw new Error('Minimal satu approval karyawan wajib dipilih.');
  }

  const approverIds = rawSteps.map((step, index) => normalizeRequiredId(step?.approver_user_id, `approval_steps[${index + 1}].approver_user_id`));

  if (new Set(approverIds).size !== approverIds.length) {
    throw new Error('User approval tidak boleh duplikat pada payroll yang sama.');
  }

  const approverUsers = await Promise.all(approverIds.map((approverId) => ensureUserExists(approverId)));

  return approverUsers.map((user, index) => {
    if (!user) {
      throw new Error(`User approval level ${index + 1} tidak ditemukan atau sudah dihapus.`);
    }

    return {
      level: index + 1,
      approver_user_id: user.id_user,
      approver_role: normRole(user.role) || null,
      approver_nama_snapshot: normalizeNullableString(user.nama_pengguna, 'approver_nama_snapshot', 255) || null,
      decision: 'pending',
      decided_at: null,
      note: null,
      ttd_approval_url: null,
      deleted_at: null,
    };
  });
}

export async function replaceApprovalSteps(tx, id_payroll_karyawan, approvalSteps = []) {
  await tx.approvalPayrollKaryawan.deleteMany({
    where: {
      id_payroll_karyawan,
    },
  });

  if (!approvalSteps.length) {
    return;
  }

  await tx.approvalPayrollKaryawan.createMany({
    data: approvalSteps.map((step) => ({
      ...step,
      id_payroll_karyawan,
    })),
  });
}
