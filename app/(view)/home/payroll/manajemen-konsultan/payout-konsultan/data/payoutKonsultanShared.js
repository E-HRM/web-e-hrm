'use client';

export const STATUS_PAYOUT_KONSULTAN = {
  DRAFT: 'DRAFT',
  DISETUJUI: 'DISETUJUI',
  DIPOSTING_KE_PAYROLL: 'DIPOSTING_KE_PAYROLL',
  DITAHAN: 'DITAHAN',
};

const BULAN_MAP = {
  JANUARI: 'Januari',
  FEBRUARI: 'Februari',
  MARET: 'Maret',
  APRIL: 'April',
  MEI: 'Mei',
  JUNI: 'Juni',
  JULI: 'Juli',
  AGUSTUS: 'Agustus',
  SEPTEMBER: 'September',
  OKTOBER: 'Oktober',
  NOVEMBER: 'November',
  DESEMBER: 'Desember',
};

export function normalizeText(value) {
  return String(value || '').trim();
}

export function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toNonNegativeInt(value, fallback = 0) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(0, Math.trunc(parsed));
}

export function toDecimalPayload(value) {
  return toNumber(value).toFixed(2);
}

export function normalizeIdArray(values) {
  if (!Array.isArray(values)) return [];

  return Array.from(
    new Set(
      values
        .map((value) => normalizeText(value))
        .filter(Boolean),
    ),
  );
}

export function createInitialPayoutKonsultanForm(defaults = {}) {
  return {
    id_user: normalizeText(defaults.id_user),
    id_periode_konsultan: normalizeText(defaults.id_periode_konsultan),
    nominal_penyesuaian: toNumber(defaults.nominal_penyesuaian),
    id_transaksi_konsultan_ditahan: normalizeIdArray(
      defaults.id_transaksi_konsultan_ditahan,
    ),
    catatan: normalizeText(defaults.catatan),
  };
}

export function createInitialPostPayrollForm(defaults = {}) {
  return {
    id_periode_payroll: normalizeText(defaults.id_periode_payroll),
    id_definisi_komponen_payroll: normalizeText(defaults.id_definisi_komponen_payroll),
    urutan_tampil: toNonNegativeInt(defaults.urutan_tampil, 900),
  };
}

export function calculateNominalDibayarkan({ total_share = 0, nominal_ditahan = 0, nominal_penyesuaian = 0 }) {
  return toNumber(total_share) - toNumber(nominal_ditahan) + toNumber(nominal_penyesuaian);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function formatDate(value) {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

export function formatBulan(value) {
  const normalized = normalizeText(value).toUpperCase();
  return BULAN_MAP[normalized] || normalizeText(value) || '-';
}

export function formatPeriodeKonsultanLabel(periode) {
  if (!periode) return '-';
  if (typeof periode === 'string') return normalizeText(periode) || '-';

  const bulan = formatBulan(periode.bulan);
  const tahun = normalizeText(periode.tahun);
  const label = [bulan !== '-' ? bulan : '', tahun].filter(Boolean).join(' ');

  return label || normalizeText(periode.id_periode_konsultan) || '-';
}

export function formatPeriodePayrollLabel(periode) {
  if (!periode) return '-';
  if (typeof periode === 'string') return normalizeText(periode) || '-';

  const bulan = formatBulan(periode.bulan);
  const tahun = normalizeText(periode.tahun);
  const label = [bulan !== '-' ? bulan : '', tahun].filter(Boolean).join(' ');

  return label || normalizeText(periode.id_periode_payroll) || '-';
}

export function getConsultantDisplayName(user) {
  return normalizeText(user?.nama_pengguna) || normalizeText(user?.email) || normalizeText(user?.id_user) || '-';
}

export function getConsultantIdentity(user) {
  return normalizeText(user?.nomor_induk_karyawan) || normalizeText(user?.email) || normalizeText(user?.id_user) || '-';
}

export function getInitials(value) {
  const normalized = normalizeText(value);

  if (!normalized) return 'PK';

  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}
