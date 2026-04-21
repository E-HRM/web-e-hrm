const BULAN_ENTRIES = [
  ['JANUARI', 'Januari', 1],
  ['FEBRUARI', 'Februari', 2],
  ['MARET', 'Maret', 3],
  ['APRIL', 'April', 4],
  ['MEI', 'Mei', 5],
  ['JUNI', 'Juni', 6],
  ['JULI', 'Juli', 7],
  ['AGUSTUS', 'Agustus', 8],
  ['SEPTEMBER', 'September', 9],
  ['OKTOBER', 'Oktober', 10],
  ['NOVEMBER', 'November', 11],
  ['DESEMBER', 'Desember', 12],
];

export const BULAN_OPTIONS = BULAN_ENTRIES.map(([value, label, number]) => ({
  value,
  label,
  number,
}));

export const BULAN_LABEL_MAP = BULAN_ENTRIES.reduce((acc, [value, label]) => {
  acc[value] = label;
  return acc;
}, {});

export const BULAN_NUMBER_MAP = BULAN_ENTRIES.reduce((acc, [value, _label, number]) => {
  acc[value] = number;
  return acc;
}, {});

export const STATUS_PERIODE_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'DIREVIEW', label: 'Direview' },
  { value: 'DISETUJUI', label: 'Disetujui' },
  { value: 'TERKUNCI', label: 'Terkunci' },
];

const STATUS_LABEL_MAP = STATUS_PERIODE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

function pad(value) {
  return String(value).padStart(2, '0');
}

function resolveDate(value) {
  if (!value) return null;

  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);

  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatDate(value) {
  const date = resolveDate(value);
  if (!date) return value || '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value) {
  const date = resolveDate(value);
  if (!date) return value || '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function toDateInputValue(value) {
  const date = resolveDate(value);
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatStatusPeriode(status) {
  return STATUS_LABEL_MAP[String(status || '').toUpperCase()] || status || '-';
}

export function formatPeriodeLabel(periode) {
  if (!periode) return '-';

  const bulanKey = String(periode?.bulan || '').toUpperCase();
  const bulanLabel = BULAN_LABEL_MAP[bulanKey] || periode?.bulan || '-';
  const tahun = periode?.tahun || '-';

  return `${bulanLabel} ${tahun}`;
}

export function getBulanNumber(value) {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 1 && value <= 12 ? value : null;
  }

  const normalized = String(value || '')
    .trim()
    .toUpperCase();
  return BULAN_NUMBER_MAP[normalized] || null;
}

export function getBulanEnumFromNumber(value) {
  const found = BULAN_OPTIONS.find((item) => item.number === Number(value));
  return found?.value || '';
}

export function buildDateRangeForMonth(bulan, tahun) {
  const monthNumber = getBulanNumber(bulan);
  const yearNumber = Number(tahun);

  if (!monthNumber || !Number.isInteger(yearNumber)) {
    return {
      tanggal_mulai: '',
      tanggal_selesai: '',
    };
  }

  const start = new Date(yearNumber, monthNumber - 1, 1);
  const end = new Date(yearNumber, monthNumber, 0);

  return {
    tanggal_mulai: toDateInputValue(start),
    tanggal_selesai: toDateInputValue(end),
  };
}

export function createInitialPeriodeForm(referenceDate = new Date()) {
  const bulan = getBulanEnumFromNumber(referenceDate.getMonth() + 1);
  const tahun = referenceDate.getFullYear();
  const { tanggal_mulai, tanggal_selesai } = buildDateRangeForMonth(bulan, tahun);

  return {
    bulan,
    tahun,
    tanggal_mulai,
    tanggal_selesai,
    status_periode: 'DRAFT',
    catatan: '',
  };
}

export function serializePeriodePayload(formData) {
  return {
    bulan: String(formData?.bulan || '')
      .trim()
      .toUpperCase(),
    tahun: Number(formData?.tahun),
    tanggal_mulai: formData?.tanggal_mulai || '',
    tanggal_selesai: formData?.tanggal_selesai || '',
    status_periode: String(formData?.status_periode || 'DRAFT')
      .trim()
      .toUpperCase(),
    catatan: String(formData?.catatan || '').trim() || null,
  };
}
