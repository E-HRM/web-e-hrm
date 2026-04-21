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
export const JENIS_HUBUNGAN_KERJA_VALUES = new Set(['FREELANCE', 'INTERNSHIP', 'PKWT', 'PKWTT']);

export const IMMUTABLE_PAYROLL_STATUS = new Set(['DISETUJUI', 'DIBAYAR']);
export const IMMUTABLE_PERIODE_STATUS = new Set(['FINAL', 'TERKUNCI']);

export const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'nama_karyawan', 'status_payroll', 'total_pendapatan_bruto', 'total_potongan', 'pph21_nominal', 'pendapatan_bersih', 'dibayar_pada', 'finalized_at', 'locked_at']);

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
    dibayar_pada: true,
    finalized_at: true,
    locked_at: true,
    catatan: true,
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
        diproses_pada: true,
        difinalkan_pada: true,
        deleted_at: true,
      },
    },
    user: {
      select: {
        id_user: true,
        nama_pengguna: true,
        email: true,
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
    _count: {
      select: {
        item_komponen: true,
        cicilan_pinjaman: true,
      },
    },
  };
}

export function enrichPayroll(item) {
  if (!item) return item;

  const payrollStatus = String(item.status_payroll || '').toUpperCase();
  const periodeStatus = String(item?.periode?.status_periode || '').toUpperCase();

  return {
    ...item,
    business_state: {
      payroll_immutable: IMMUTABLE_PAYROLL_STATUS.has(payrollStatus) || Boolean(item.finalized_at) || Boolean(item.locked_at),
      periode_immutable: IMMUTABLE_PERIODE_STATUS.has(periodeStatus) || Boolean(item?.periode?.difinalkan_pada),
      bisa_diubah: !Boolean(item.deleted_at) && !Boolean(item?.periode?.deleted_at) && !IMMUTABLE_PAYROLL_STATUS.has(payrollStatus) && !IMMUTABLE_PERIODE_STATUS.has(periodeStatus) && !Boolean(item.finalized_at) && !Boolean(item.locked_at),
      bisa_dihapus: !Boolean(item.deleted_at) && !Boolean(item?.periode?.deleted_at) && !IMMUTABLE_PAYROLL_STATUS.has(payrollStatus) && !IMMUTABLE_PERIODE_STATUS.has(periodeStatus) && !Boolean(item.finalized_at) && !Boolean(item.locked_at),
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
  ];
}

export async function ensurePeriodeExists(id_periode_payroll) {
  return db.periodePayroll.findFirst({
    where: {
      id_periode_payroll,
      deleted_at: null,
    },
    select: {
      id_periode_payroll: true,
      status_periode: true,
      diproses_pada: true,
      difinalkan_pada: true,
      deleted_at: true,
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
