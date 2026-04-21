export function normalizeKodeKategoriPajak(value) {
  if (value === undefined) return undefined;

  const normalized = String(value || '').trim();

  if (!normalized) {
    throw new Error("Field 'kode_kategori_pajak' tidak boleh kosong.");
  }

  return normalized;
}

export function formatKodeKategoriPajak(value) {
  const normalized = String(value || '').trim();
  return normalized || '-';
}

export function compareKodeKategoriPajak(a, b) {
  return formatKodeKategoriPajak(a).localeCompare(formatKodeKategoriPajak(b), 'id', {
    numeric: true,
    sensitivity: 'base',
  });
}
