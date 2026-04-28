const BULAN_TO_MONTH = {
  JANUARI: 1,
  FEBRUARI: 2,
  MARET: 3,
  APRIL: 4,
  MEI: 5,
  JUNI: 6,
  JULI: 7,
  AGUSTUS: 8,
  SEPTEMBER: 9,
  OKTOBER: 10,
  NOVEMBER: 11,
  DESEMBER: 12,
};

function padNumber(value, length) {
  return String(value).padStart(length, '0');
}

function normalizeMonth(value) {
  if (value === undefined || value === null || value === '') return null;

  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 12) {
    return value;
  }

  const normalized = String(value).trim().toUpperCase();
  if (/^\d+$/.test(normalized)) {
    const parsed = Number(normalized);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : null;
  }

  return BULAN_TO_MONTH[normalized] || null;
}

export function resolvePayrollPeriodCode(periode) {
  if (!periode) return '';

  const fallbackDate = periode?.tanggal_mulai ? new Date(periode.tanggal_mulai) : null;
  const fallbackDateIsValid = fallbackDate instanceof Date && !Number.isNaN(fallbackDate.getTime());
  const fallbackYear = fallbackDateIsValid ? fallbackDate.getUTCFullYear() : null;
  const fallbackMonth = fallbackDateIsValid ? fallbackDate.getUTCMonth() + 1 : null;

  const year = Number(periode?.tahun || fallbackYear);
  const month = normalizeMonth(periode?.bulan) || fallbackMonth;

  if (!Number.isInteger(year) || year < 1 || !month) return '';

  return `${padNumber(year, 4)}${padNumber(month, 2)}`;
}

export function buildPayrollSlipNumber(periodCode, sequence) {
  const normalizedPeriodCode = String(periodCode || '').trim();
  const normalizedSequence = Number(sequence);

  if (!/^\d{6}$/.test(normalizedPeriodCode)) return '';
  if (!Number.isInteger(normalizedSequence) || normalizedSequence < 1) return '';

  return `${normalizedPeriodCode}${padNumber(normalizedSequence, 3)}`;
}

export function getPayrollSlipNumberSequence(issueNumber, periodCode) {
  const normalizedIssueNumber = String(issueNumber || '').trim();
  const normalizedPeriodCode = String(periodCode || '').trim();

  if (!/^\d{6}$/.test(normalizedPeriodCode)) return 0;
  if (!normalizedIssueNumber.startsWith(normalizedPeriodCode)) return 0;

  const sequencePart = normalizedIssueNumber.slice(normalizedPeriodCode.length);
  if (!/^\d+$/.test(sequencePart)) return 0;

  const sequence = Number(sequencePart);
  return Number.isInteger(sequence) && sequence > 0 ? sequence : 0;
}

export function buildNextPayrollSlipNumber(periode, payrollRows = [], options = {}) {
  const periodCode = resolvePayrollPeriodCode(periode);
  if (!periodCode) return '';

  const excludePayrollId = String(options?.excludePayrollId || '').trim();
  let countedRows = 0;
  let maxSequence = 0;

  (Array.isArray(payrollRows) ? payrollRows : []).forEach((row) => {
    if (!row) return;
    if (excludePayrollId && String(row?.id_payroll_karyawan || '').trim() === excludePayrollId) return;

    countedRows += 1;
    maxSequence = Math.max(maxSequence, getPayrollSlipNumberSequence(row?.issue_number, periodCode));
  });

  return buildPayrollSlipNumber(periodCode, Math.max(maxSequence, countedRows) + 1);
}
