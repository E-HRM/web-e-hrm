export function normalizeText(value) {
  return String(value || '').trim();
}

export function normalizeTextLower(value) {
  return normalizeText(value).toLowerCase();
}

export function createInitialTipeKomponenPayrollForm() {
  return {
    nama_tipe_komponen: '',
  };
}

export function createTipeKomponenPayrollFormData(item) {
  if (!item) {
    return createInitialTipeKomponenPayrollForm();
  }

  return {
    nama_tipe_komponen: normalizeText(item.nama_tipe_komponen),
  };
}

export function normalizeTipeKomponenPayrollItem(item) {
  if (!item) return null;

  const id = normalizeText(item.id_tipe_komponen_payroll);
  if (!id) return null;

  return {
    id_tipe_komponen_payroll: id,
    nama_tipe_komponen: normalizeText(item.nama_tipe_komponen),
    created_at: item.created_at || '',
    updated_at: item.updated_at || '',
    deleted_at: item.deleted_at || null,
    definisi_komponen_count: Number(item?._count?.definisi_komponen || item?.definisi_komponen_count || 0),
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

export function buildSearchText(item) {
  const normalized = normalizeTipeKomponenPayrollItem(item);
  if (!normalized) return '';

  return [
    normalized.nama_tipe_komponen,
    normalized.definisi_komponen_count,
    normalized.deleted_at ? 'terhapus' : 'aktif',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}
