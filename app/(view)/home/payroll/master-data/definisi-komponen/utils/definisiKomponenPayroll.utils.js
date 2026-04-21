import { ARAH_KOMPONEN_OPTIONS } from './definisiKomponenPayroll.constants';

export function normalizeText(value) {
  return String(value || '').trim();
}

export function normalizeUppercaseText(value) {
  return normalizeText(value).toUpperCase();
}

export function createInitialDefinisiKomponenPayrollForm() {
  return {
    id_tipe_komponen_payroll: undefined,
    nama_komponen: '',
    arah_komponen: 'PEMASUKAN',
    kena_pajak_default: true,
    berulang_default: true,
    aktif: true,
    catatan: '',
  };
}

export function createDefinisiKomponenPayrollFormData(item) {
  if (!item) {
    return createInitialDefinisiKomponenPayrollForm();
  }

  return {
    id_tipe_komponen_payroll: normalizeText(item.id_tipe_komponen_payroll) || undefined,
    nama_komponen: normalizeText(item.nama_komponen),
    arah_komponen: normalizeUppercaseText(item.arah_komponen) || 'PEMASUKAN',
    kena_pajak_default: Boolean(item.kena_pajak_default),
    berulang_default: Boolean(item.berulang_default),
    aktif: Boolean(item.aktif),
    catatan: normalizeText(item.catatan),
  };
}

export function normalizeDefinisiKomponenPayrollItem(item) {
  if (!item) return null;

  const id = normalizeText(item.id_definisi_komponen_payroll);
  if (!id) return null;

  const tipeKomponen = item?.tipe_komponen
    ? {
        id_tipe_komponen_payroll: normalizeText(item.tipe_komponen.id_tipe_komponen_payroll),
        nama_tipe_komponen: normalizeText(item.tipe_komponen.nama_tipe_komponen),
        deleted_at: item.tipe_komponen.deleted_at || null,
      }
    : null;

  return {
    id_definisi_komponen_payroll: id,
    id_tipe_komponen_payroll: normalizeText(item.id_tipe_komponen_payroll || tipeKomponen?.id_tipe_komponen_payroll),
    nama_komponen: normalizeText(item.nama_komponen),
    arah_komponen: normalizeUppercaseText(item.arah_komponen),
    kena_pajak_default: Boolean(item.kena_pajak_default),
    berulang_default: Boolean(item.berulang_default),
    aktif: Boolean(item.aktif),
    catatan: normalizeText(item.catatan),
    created_at: item.created_at || '',
    updated_at: item.updated_at || '',
    deleted_at: item.deleted_at || null,
    item_payroll_count: Number(item?._count?.item_payroll || item?.item_payroll_count || 0),
    tipe_komponen: tipeKomponen,
    nama_tipe_komponen: normalizeText(item?.nama_tipe_komponen || tipeKomponen?.nama_tipe_komponen),
  };
}

export function formatDateTime(value) {
  if (!value) return '-';

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    const normalized = String(value).replace(' ', 'T');
    const fallbackDate = new Date(normalized);

    if (Number.isNaN(fallbackDate.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(fallbackDate);
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatKomponenLabel(value) {
  if (!value) return '-';

  if (typeof value === 'object') {
    const nama = normalizeText(value?.nama_tipe_komponen);
    if (nama) return nama;
  }

  const normalizedValue = normalizeUppercaseText(value);

  const arah = ARAH_KOMPONEN_OPTIONS.find((item) => item.value === normalizedValue);
  if (arah) return arah.label;

  return normalizedValue
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
