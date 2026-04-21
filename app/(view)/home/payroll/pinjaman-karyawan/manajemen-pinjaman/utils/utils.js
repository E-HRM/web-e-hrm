export const STATUS_PINJAMAN = {
  DRAFT: 'DRAFT',
  AKTIF: 'AKTIF',
  LUNAS: 'LUNAS',
  DIBATALKAN: 'DIBATALKAN',
};

export const PINJAMAN_FORM_STATUS_OPTIONS = [
  {
    value: STATUS_PINJAMAN.DRAFT,
    label: 'DRAFT',
  },
  {
    value: STATUS_PINJAMAN.AKTIF,
    label: 'AKTIF',
  },
  {
    value: STATUS_PINJAMAN.DIBATALKAN,
    label: 'DIBATALKAN',
  },
];

export function createInitialPinjamanForm() {
  return {
    id_user: '',
    nama_pinjaman: '',
    nominal_pinjaman: 0,
    nominal_cicilan: 0,
    tanggal_mulai: '',
    status_pinjaman: STATUS_PINJAMAN.DRAFT,
    catatan: '',
  };
}

export function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toDateInputValue(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60 * 1000);
  return adjusted.toISOString().slice(0, 10);
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

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
