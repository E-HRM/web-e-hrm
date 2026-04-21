// app/(view)/home/payroll/transaksi-konsultan/data/transaksiKonsultanUtils.js
const BULAN_LABEL_MAP = {
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

const STATUS_PERIODE_LABEL_MAP = {
  DRAFT: 'Draft',
  DIREVIEW: 'Direview',
  DISETUJUI: 'Disetujui',
  TERKUNCI: 'Terkunci',
};

export function createInitialTransaksiForm(activePeriode = '') {
  return {
    id_user_konsultan: '',
    id_jenis_produk_konsultan: '',
    id_periode_konsultan: activePeriode,
    tanggal_transaksi: '',
    nama_klien: '',
    deskripsi: '',
    nominal_debit: '0',
    nominal_kredit: '0',
    persen_share_default: '60',
    persen_share_override: '',
    override_manual: false,
  };
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return '-';

  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function toDateInputValue(value) {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function formatDecimalPercent(value) {
  if (value === null || value === undefined || value === '') return '-';

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);

  return parsed.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

export function formatStatusPeriode(status) {
  return STATUS_PERIODE_LABEL_MAP[status] || status || '-';
}

export function formatPeriodeLabel(value, periodeOptions = []) {
  const found = Array.isArray(periodeOptions) ? periodeOptions.find((item) => item.value === value) : null;

  if (found?.plainLabel) return found.plainLabel;
  return value || '-';
}

export function formatPeriodeFromItem(periode) {
  if (!periode) return '-';

  const bulan = BULAN_LABEL_MAP[String(periode.bulan || '').toUpperCase()] || periode.bulan || '-';
  const tahun = periode.tahun || '-';

  return `${bulan} ${tahun}`;
}

export function buildPeriodeOption(periode) {
  const plainLabel = formatPeriodeFromItem(periode);
  const statusLabel = formatStatusPeriode(periode?.status_periode);

  return {
    value: periode.id_periode_konsultan,
    label: `${plainLabel} • ${statusLabel}`,
    plainLabel,
    status_periode: periode?.status_periode || null,
    tanggal_mulai: periode?.tanggal_mulai || null,
    tanggal_selesai: periode?.tanggal_selesai || null,
    disabled: Boolean(periode?.deleted_at),
  };
}

export function getConsultantDisplayName(user) {
  return user?.nama_pengguna || user?.name || user?.email || user?.id_user || 'Konsultan';
}

export function getConsultantIdentity(user) {
  return user?.nomor_induk_karyawan || user?.email || user?.id_user || '-';
}

export function getConsultantPhoto(user) {
  return user?.foto_profil_user || user?.avatarUrl || user?.foto || user?.foto_url || user?.photoUrl || user?.photo || user?.avatar || null;
}

export function getConsultantSecondaryText(user) {
  return user?.jabatan?.nama_jabatan || user?.role || user?.departement?.nama_departement || '-';
}
