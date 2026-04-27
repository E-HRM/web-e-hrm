import {
  compareKodeKategoriPajak,
  formatKodeKategoriPajak,
} from '@/helpers/kodeKategoriPajak';

export { compareKodeKategoriPajak, formatKodeKategoriPajak };

export function createInitialTarifPajakTERForm() {
  return {
    kode_kategori_pajak: '',
    penghasilan_dari: null,
    penghasilan_sampai: null,
    persen_tarif: null,
    berlaku_mulai: '',
    berlaku_sampai: null,
  };
}

export function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeDecimalInput(value, { allowNull = false, fallback = '0' } = {}) {
  if (value === undefined || value === null || value === '') {
    return allowNull ? null : fallback;
  }

  const normalized = String(value).trim().replace(',', '.');

  if (!normalized) {
    return allowNull ? null : fallback;
  }

  return normalized;
}

export function toDateInputValue(value) {
  if (!value) return '';

  const raw = String(value).trim();
  const exactDateMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);

  if (exactDateMatch) {
    return exactDateMatch[1];
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatCurrency(value) {
  const parsed = toNullableNumber(value);

  if (parsed === null) return '-';

  const hasFraction = !Number.isInteger(parsed);

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(parsed);
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

export function formatPercent(value) {
  const parsed = toNumber(value, 0);

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(parsed);
}

export function normalizeTarifTERItem(item) {
  if (!item) return null;

  const kodeKategoriPajak = String(item?.kode_kategori_pajak || '').trim();
  const penghasilanDari = normalizeDecimalInput(item?.penghasilan_dari, { fallback: '0' }) || '0';
  const penghasilanSampai = normalizeDecimalInput(item?.penghasilan_sampai, { allowNull: true });
  const persenTarif = normalizeDecimalInput(item?.persen_tarif, { fallback: '0' }) || '0';
  const berlakuMulai = toDateInputValue(item?.berlaku_mulai);
  const berlakuSampai = toDateInputValue(item?.berlaku_sampai);

  return {
    ...item,
    kode_kategori_pajak: kodeKategoriPajak,
    kode_kategori_pajak_display: formatKodeKategoriPajak(kodeKategoriPajak),
    penghasilan_dari: penghasilanDari,
    penghasilan_sampai: penghasilanSampai,
    persen_tarif: persenTarif,
    berlaku_mulai: berlakuMulai,
    berlaku_sampai: berlakuSampai || null,
    penghasilan_dari_number: toNumber(penghasilanDari, 0),
    penghasilan_sampai_number: toNullableNumber(penghasilanSampai),
    persen_tarif_number: toNumber(persenTarif, 0),
  };
}

export function createTarifFormData(item) {
  const normalized = item ? normalizeTarifTERItem(item) : null;

  if (!normalized) {
    return createInitialTarifPajakTERForm();
  }

  return {
    kode_kategori_pajak: normalized.kode_kategori_pajak || '',
    penghasilan_dari: normalized.penghasilan_dari_number,
    penghasilan_sampai: normalized.penghasilan_sampai_number,
    persen_tarif: normalized.persen_tarif_number,
    berlaku_mulai: normalized.berlaku_mulai || '',
    berlaku_sampai: normalized.berlaku_sampai || null,
  };
}

export function buildTarifSearchText(item) {
  const normalized = normalizeTarifTERItem(item);

  if (!normalized) return '';

  return [
    normalized.kode_kategori_pajak,
    normalized.kode_kategori_pajak_display,
    normalized.penghasilan_dari,
    normalized.penghasilan_sampai ?? 'tidak terbatas',
    normalized.persen_tarif,
    normalized.berlaku_mulai,
    normalized.berlaku_sampai ?? 'tidak terbatas',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function formatIncomeRange(from, until) {
  const normalizedUntil = until === null || until === undefined || until === '' ? null : until;
  return `${formatCurrency(from)} - ${normalizedUntil === null ? 'Tidak terbatas' : formatCurrency(normalizedUntil)}`;
}
