import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const IMPORT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const STATUS_PERIODE_TERKUNCI = 'TERKUNCI';
const MONEY_SCALE = 2;

const normRole = (role) =>
  String(role || '')
    .trim()
    .toUpperCase();

function stripLeadingZeros(numStr) {
  const stripped = numStr.replace(/^0+(?=\d)/, '');
  return stripped || '0';
}

function decimalToScaledBigInt(value, scale = MONEY_SCALE) {
  const stringValue = String(value);
  const negative = stringValue.startsWith('-');
  const unsigned = negative ? stringValue.slice(1) : stringValue;
  const [intPartRaw, fracPartRaw = ''] = unsigned.split('.');
  const intPart = stripLeadingZeros(intPartRaw || '0');
  const fracPart = fracPartRaw.padEnd(scale, '0').slice(0, scale);
  const bigintValue = BigInt(`${intPart}${fracPart}`);
  return negative ? -bigintValue : bigintValue;
}

function scaledBigIntToDecimalString(value, scale = MONEY_SCALE) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const padded = absolute.toString().padStart(scale + 1, '0');
  const integerPart = padded.slice(0, -scale) || '0';
  const fractionPart = padded.slice(-scale);
  return `${negative ? '-' : ''}${integerPart}.${fractionPart}`;
}

function sumMoney(left, right) {
  return scaledBigIntToDecimalString(decimalToScaledBigInt(left) + decimalToScaledBigInt(right));
}

function subtractMoney(left, right) {
  return scaledBigIntToDecimalString(decimalToScaledBigInt(left) - decimalToScaledBigInt(right));
}

function moneyToNumber(value) {
  return Number(scaledBigIntToDecimalString(decimalToScaledBigInt(value)));
}

function issue(code, message) {
  return { code, message };
}

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLookup(value) {
  return normalizeText(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function isOssValue(value) {
  const normalized = normalizeLookup(value);
  return normalized === 'oss' || normalized === 'one step solution';
}

function normalizeMoneyStringFromNumber(value) {
  const scaled = BigInt(Math.round(Number(value) * 100));
  return scaledBigIntToDecimalString(scaled);
}

function parseMoneyCell(value, { allowBlank = true } = {}) {
  if (value === null || value === undefined || value === '') {
    if (allowBlank) return { value: '0.00', blank: true };
    throw new Error('Nilai nominal wajib diisi.');
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Nilai nominal tidak valid.');
    return { value: normalizeMoneyStringFromNumber(value), blank: false };
  }

  const raw = String(value).trim();
  if (!raw) {
    if (allowBlank) return { value: '0.00', blank: true };
    throw new Error('Nilai nominal wajib diisi.');
  }

  const parenthesizedNegative = /^\(.*\)$/.test(raw);
  let cleaned = raw.replace(/[^\d,.\-]/g, '');
  if (parenthesizedNegative && !cleaned.startsWith('-')) cleaned = `-${cleaned}`;

  if (!cleaned || cleaned === '-') {
    if (allowBlank) return { value: '0.00', blank: true };
    throw new Error('Nilai nominal wajib diisi.');
  }

  const negative = cleaned.startsWith('-');
  const unsigned = negative ? cleaned.slice(1).replace(/-/g, '') : cleaned.replace(/-/g, '');
  const lastComma = unsigned.lastIndexOf(',');
  const lastDot = unsigned.lastIndexOf('.');
  let normalized = unsigned;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = unsigned.replaceAll(thousandsSeparator, '').replace(decimalSeparator, '.');
  } else if (lastComma >= 0) {
    const parts = unsigned.split(',');
    const lastPart = parts.at(-1) || '';
    normalized = parts.length > 1 && lastPart.length <= 2 ? `${parts.slice(0, -1).join('')}.${lastPart}` : unsigned.replaceAll(',', '');
  } else if (lastDot >= 0) {
    const parts = unsigned.split('.');
    const lastPart = parts.at(-1) || '';
    normalized = parts.length > 2 || lastPart.length === 3 ? unsigned.replaceAll('.', '') : unsigned;
  }

  const parsed = Number(`${negative ? '-' : ''}${normalized}`);
  if (!Number.isFinite(parsed)) throw new Error('Nilai nominal tidak valid.');
  return { value: normalizeMoneyStringFromNumber(parsed), blank: false };
}

function makeDateUTC(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function dateToYmd(value) {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateString(value) {
  const raw = normalizeText(value);
  if (!raw) return null;

  let match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) return makeDateUTC(Number(match[1]), Number(match[2]), Number(match[3]));

  match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) return makeDateUTC(Number(match[3]), Number(match[2]), Number(match[1]));

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return makeDateUTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, parsed.getUTCDate());
}

function parseDateCell(value, XLSX) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const date = makeDateUTC(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
    return date ? { date, ymd: dateToYmd(date) } : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const date = makeDateUTC(parsed.y, parsed.m, parsed.d);
    return date ? { date, ymd: dateToYmd(date) } : null;
  }

  const date = parseDateString(value);
  return date ? { date, ymd: dateToYmd(date) } : null;
}

function parseYmdDate(value) {
  const date = parseDateString(value);
  return date ? { date, ymd: dateToYmd(date) } : null;
}

function toDateOnlyComparable(value) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())).getTime();
}

function isDateWithinRange(targetDate, startDate, endDate) {
  const target = toDateOnlyComparable(targetDate);
  return target >= toDateOnlyComparable(startDate) && target <= toDateOnlyComparable(endDate);
}

function findColumn(row, candidates) {
  const wanted = candidates.map(normalizeLookup);
  return row.findIndex((cell) => {
    const normalized = normalizeLookup(cell);
    if (!normalized) return false;
    return wanted.some((candidate) => normalized === candidate || normalized.includes(candidate));
  });
}

function firstNonBlank(values) {
  return values.find((value) => !isBlank(value));
}

function buildTransactionKey(row) {
  return [
    row.tanggal_transaksi,
    normalizeLookup(row.nama_klien),
    normalizeLookup(row.deskripsi),
    row.nominal_debit,
    row.nominal_kredit,
    row.total_income,
  ].join('|');
}

function buildDbTransactionKey(row) {
  return buildTransactionKey({
    tanggal_transaksi: dateToYmd(row.tanggal_transaksi),
    nama_klien: row.nama_klien,
    deskripsi: row.deskripsi,
    nominal_debit: parseMoneyCell(String(row.nominal_debit)).value,
    nominal_kredit: parseMoneyCell(String(row.nominal_kredit)).value,
    total_income: parseMoneyCell(String(row.total_income)).value,
  });
}

function resolveUser(sharingIncomeRaw, users) {
  const raw = normalizeText(sharingIncomeRaw);
  if (!raw) {
    return {
      isOss: false,
      user: null,
      candidates: [],
      error: issue('KONSULTAN_EMPTY', 'Sharing income wajib diisi dengan nama konsultan atau OSS.'),
    };
  }

  if (isOssValue(raw)) {
    return {
      isOss: true,
      user: null,
      candidates: [],
      error: null,
    };
  }

  const target = normalizeLookup(raw);
  const matches = users.filter((user) => {
    const name = normalizeLookup(user.nama_pengguna);
    const email = normalizeLookup(user.email);
    const firstToken = name.split(' ')[0];
    return name === target || email === target || firstToken === target || name.includes(target);
  });

  if (matches.length === 1) {
    return {
      isOss: false,
      user: matches[0],
      candidates: matches,
      error: null,
    };
  }

  return {
    isOss: false,
    user: null,
    candidates: matches.slice(0, 5),
    error:
      matches.length > 1
        ? issue('KONSULTAN_AMBIGUOUS', `Nama konsultan '${raw}' cocok ke lebih dari satu user. Pilih manual.`)
        : issue('KONSULTAN_NOT_FOUND', `Nama konsultan '${raw}' belum cocok dengan user. Pilih manual.`),
  };
}

function resolveProduct(row, produkList) {
  const haystack = normalizeLookup(`${row.nama_klien || ''} ${row.deskripsi || ''}`);
  if (!haystack) return null;

  const matches = produkList
    .filter((produk) => {
      if (produk.aktif === false) return false;
      const key = normalizeLookup(produk.nama_produk);
      return key && haystack.includes(key);
    })
    .sort((left, right) => normalizeLookup(right.nama_produk).length - normalizeLookup(left.nama_produk).length);

  return matches[0] || null;
}

function extractIgnoredRow(row, excelRow, columns) {
  const label = normalizeText(firstNonBlank([row[columns.tanggal], row[columns.nama], row[columns.keterangan], row[columns.sharingIncome]]));
  if (!label) return null;

  let totalCandidate = null;
  try {
    if (normalizeLookup(label).includes('total income')) {
      totalCandidate = parseMoneyCell(row[columns.debit]).value;
    } else if (normalizeLookup(label) === 'total') {
      totalCandidate = parseMoneyCell(row[columns.nominalOss]).value;
    }
  } catch {
    totalCandidate = null;
  }

  return {
    excel_row: excelRow,
    label,
    total_candidate: totalCandidate,
  };
}

function parseWorkbookRows(buffer, XLSX) {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error('Sheet Excel tidak ditemukan.');
  }

  const matrix = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    blankrows: false,
    raw: true,
  });

  const headerIndex = matrix.findIndex((row) => {
    const normalized = row.map(normalizeLookup);
    return normalized.some((cell) => cell === 'tanggal') && normalized.some((cell) => cell === 'nama') && normalized.some((cell) => cell === 'keterangan');
  });

  if (headerIndex < 0) {
    throw new Error("Header wajib minimal berisi kolom 'Tanggal', 'Nama', dan 'Keterangan'.");
  }

  const headerRow = matrix[headerIndex] || [];
  const subHeaderRow = matrix[headerIndex + 1] || [];
  const tanggalCol = findColumn(headerRow, ['tanggal']);
  const namaCol = findColumn(headerRow, ['nama']);
  const keteranganCol = findColumn(headerRow, ['keterangan']);
  const debitCol = findColumn(headerRow, ['debet', 'debit']);
  const kreditCol = findColumn(headerRow, ['kredit']);
  const totalIncomeCol = findColumn(headerRow, ['total income']);
  const sharingIncomeCol = findColumn(headerRow, ['sharing income']);
  const shareColBySubHeader = subHeaderRow.findIndex((cell, index) => index > sharingIncomeCol && normalizeLookup(cell).includes('income') && !normalizeLookup(cell).includes('oss'));
  const ossColBySubHeader = subHeaderRow.findIndex((cell, index) => index > sharingIncomeCol && normalizeLookup(cell).includes('oss'));

  const columns = {
    tanggal: tanggalCol,
    nama: namaCol,
    keterangan: keteranganCol,
    debit: debitCol,
    kredit: kreditCol,
    totalIncome: totalIncomeCol,
    sharingIncome: sharingIncomeCol,
    nominalShare: shareColBySubHeader >= 0 ? shareColBySubHeader : sharingIncomeCol + 1,
    nominalOss: ossColBySubHeader >= 0 ? ossColBySubHeader : sharingIncomeCol + 2,
  };

  const missingColumns = Object.entries(columns)
    .filter(([, value]) => value < 0)
    .map(([key]) => key);

  if (missingColumns.length) {
    throw new Error(`Kolom Excel belum lengkap: ${missingColumns.join(', ')}.`);
  }

  const rows = [];
  const ignoredRows = [];

  for (let index = headerIndex + 1; index < matrix.length; index += 1) {
    const row = matrix[index] || [];
    if (row.every(isBlank)) continue;

    const excelRow = index + 1;
    const parsedDate = parseDateCell(row[columns.tanggal], XLSX);

    if (!parsedDate) {
      const ignoredRow = extractIgnoredRow(row, excelRow, columns);
      if (ignoredRow) ignoredRows.push(ignoredRow);
      continue;
    }

    const errors = [];
    let nominalDebit = '0.00';
    let nominalKredit = '0.00';
    let totalIncome = '0.00';
    let nominalShare = '0.00';
    let nominalOss = '0.00';
    let totalIncomeBlank = false;

    try {
      nominalDebit = parseMoneyCell(row[columns.debit]).value;
      nominalKredit = parseMoneyCell(row[columns.kredit]).value;
      const parsedTotal = parseMoneyCell(row[columns.totalIncome]);
      totalIncome = parsedTotal.value;
      totalIncomeBlank = parsedTotal.blank;
      nominalShare = parseMoneyCell(row[columns.nominalShare]).value;
      nominalOss = parseMoneyCell(row[columns.nominalOss]).value;
    } catch (err) {
      errors.push(issue('NOMINAL_INVALID', err?.message || 'Nilai nominal tidak valid.'));
    }

    const computedTotal = subtractMoney(nominalDebit, nominalKredit);
    if (totalIncomeBlank) totalIncome = computedTotal;

    const namaKlien = normalizeText(row[columns.nama]);
    const deskripsi = normalizeText(row[columns.keterangan]);
    const sharingIncomeRaw = normalizeText(row[columns.sharingIncome]);

    if (!namaKlien) errors.push(issue('NAMA_EMPTY', 'Nama klien/student wajib diisi.'));
    if (!deskripsi) errors.push(issue('DESKRIPSI_EMPTY', 'Keterangan/deskripsi wajib diisi.'));
    if (computedTotal !== totalIncome) errors.push(issue('TOTAL_MISMATCH', 'Total Income harus sama dengan Debet - Kredit.'));
    if (sumMoney(nominalShare, nominalOss) !== totalIncome) errors.push(issue('SHARE_MISMATCH', 'Nominal share + nominal OSS harus sama dengan Total Income.'));

    rows.push({
      import_key: `${excelRow}-${rows.length + 1}`,
      excel_row: excelRow,
      tanggal_transaksi: parsedDate.ymd,
      nama_klien: namaKlien,
      deskripsi,
      nominal_debit: nominalDebit,
      nominal_kredit: nominalKredit,
      total_income: totalIncome,
      nominal_share: nominalShare,
      nominal_oss: nominalOss,
      sharing_income_raw: sharingIncomeRaw,
      errors,
      warnings: totalIncomeBlank ? [issue('TOTAL_AUTOFILL', 'Total Income kosong, sistem memakai hasil Debet - Kredit.')] : [],
    });
  }

  return {
    sheet_name: sheetName,
    sheet_names: workbook.SheetNames,
    rows,
    ignored_rows: ignoredRows,
  };
}

async function loadImportContext(idPeriodeKonsultan) {
  const id = normalizeText(idPeriodeKonsultan);
  if (!id) {
    throw new Error('Periode konsultan wajib dipilih.');
  }

  const [periode, users, produkList, existingTransaksi] = await Promise.all([
    db.periodeKonsultan.findUnique({
      where: { id_periode_konsultan: id },
      select: {
        id_periode_konsultan: true,
        tahun: true,
        bulan: true,
        tanggal_mulai: true,
        tanggal_selesai: true,
        status_periode: true,
        deleted_at: true,
      },
    }),
    db.user.findMany({
      where: { deleted_at: null },
      select: {
        id_user: true,
        nama_pengguna: true,
        email: true,
        role: true,
        status_kerja: true,
        deleted_at: true,
      },
    }),
    db.jenisProdukKonsultan.findMany({
      where: { deleted_at: null },
      select: {
        id_jenis_produk_konsultan: true,
        nama_produk: true,
        persen_share_default: true,
        aktif: true,
        deleted_at: true,
      },
    }),
    db.transaksiKonsultan.findMany({
      where: {
        id_periode_konsultan: id,
        deleted_at: null,
      },
      select: {
        tanggal_transaksi: true,
        nama_klien: true,
        deskripsi: true,
        nominal_debit: true,
        nominal_kredit: true,
        total_income: true,
      },
    }),
  ]);

  if (!periode) throw new Error('Periode konsultan tidak ditemukan.');
  if (periode.deleted_at) throw new Error('Periode konsultan yang dipilih sudah dihapus.');
  if (periode.status_periode === STATUS_PERIODE_TERKUNCI) throw new Error('Periode konsultan yang dipilih sudah terkunci.');

  return {
    periode,
    users,
    produkList,
    userMap: new Map(users.map((user) => [String(user.id_user), user])),
    produkMap: new Map(produkList.map((produk) => [String(produk.id_jenis_produk_konsultan), produk])),
    existingKeys: new Set(existingTransaksi.map(buildDbTransactionKey)),
  };
}

function summarizeRows(rows, ignoredRows) {
  const totalIncome = rows.reduce((sum, row) => sumMoney(sum, row.total_income), '0.00');
  const totalDebit = rows.reduce((sum, row) => sumMoney(sum, row.nominal_debit), '0.00');
  const totalKredit = rows.reduce((sum, row) => sumMoney(sum, row.nominal_kredit), '0.00');
  const totalShare = rows.reduce((sum, row) => sumMoney(sum, row.nominal_share), '0.00');
  const totalOss = rows.reduce((sum, row) => sumMoney(sum, row.nominal_oss), '0.00');
  const rekapTotal = ignoredRows.find((row) => row.total_candidate)?.total_candidate || null;

  return {
    total_rows: rows.length,
    valid_rows: rows.filter((row) => row.status === 'valid').length,
    warning_rows: rows.filter((row) => row.status === 'warning').length,
    error_rows: rows.filter((row) => row.status === 'error').length,
    ignored_rows: ignoredRows.length,
    total_debit: totalDebit,
    total_kredit: totalKredit,
    total_income: totalIncome,
    total_share: totalShare,
    total_oss: totalOss,
    rekap_total_income: rekapTotal,
    rekap_total_match: rekapTotal ? rekapTotal === totalIncome : null,
  };
}

export async function ensureImportAuth(req) {
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

export function guardImportRole(actor) {
  if (!IMPORT_ROLES.has(normRole(actor?.role))) {
    return NextResponse.json({ message: 'Forbidden: Anda tidak memiliki akses ke resource ini.' }, { status: 403 });
  }

  return null;
}

export async function buildImportPreview({ buffer, idPeriodeKonsultan, XLSX }) {
  const parsed = parseWorkbookRows(buffer, XLSX);
  const context = await loadImportContext(idPeriodeKonsultan);
  const seenKeys = new Set();

  const rows = parsed.rows.map((row) => {
    const errors = [...row.errors];
    const warnings = [...row.warnings];
    const parsedDate = parseYmdDate(row.tanggal_transaksi);

    if (!parsedDate) {
      errors.push(issue('DATE_INVALID', 'Tanggal transaksi tidak valid.'));
    } else if (!isDateWithinRange(parsedDate.date, context.periode.tanggal_mulai, context.periode.tanggal_selesai)) {
      warnings.push(issue('DATE_OUT_OF_RANGE', 'Tanggal transaksi berada di luar periode yang dipilih. Baris tetap bisa diimpor untuk kebutuhan penahanan payout.'));
    }

    const userResolution = resolveUser(row.sharing_income_raw, context.users);
    if (userResolution.error) errors.push(userResolution.error);

    const produk = resolveProduct(row, context.produkList);
    if (!produk) warnings.push(issue('PRODUK_NOT_FOUND', 'Kategori/produk belum terdeteksi. Boleh dikosongkan atau pilih manual.'));
    if (moneyToNumber(row.total_income) < 0) warnings.push(issue('NEGATIVE_INCOME', 'Total income bernilai negatif dan tetap akan diimpor sesuai data Excel.'));

    const transactionKey = buildTransactionKey(row);
    if (seenKeys.has(transactionKey)) {
      warnings.push(issue('DUPLICATE_IN_FILE', 'Ada baris transaksi serupa di file yang sama.'));
    }
    seenKeys.add(transactionKey);

    if (context.existingKeys.has(transactionKey)) {
      warnings.push(issue('DUPLICATE_EXISTING', 'Transaksi serupa sudah ada pada periode ini.'));
    }

    const status = errors.length ? 'error' : warnings.length ? 'warning' : 'valid';

    return {
      ...row,
      id_user_konsultan: userResolution.user?.id_user || null,
      konsultan_label: userResolution.isOss ? 'OSS' : userResolution.user?.nama_pengguna || '',
      konsultan_candidates: userResolution.candidates.map((candidate) => ({
        id_user: candidate.id_user,
        nama_pengguna: candidate.nama_pengguna,
        email: candidate.email,
      })),
      is_oss: userResolution.isOss,
      id_jenis_produk_konsultan: produk?.id_jenis_produk_konsultan || null,
      produk_label: produk?.nama_produk || '',
      status,
      errors,
      warnings,
    };
  });

  return {
    meta: {
      sheet_name: parsed.sheet_name,
      sheet_names: parsed.sheet_names,
      periode: context.periode,
    },
    rows,
    ignored_rows: parsed.ignored_rows,
    summary: summarizeRows(rows, parsed.ignored_rows),
  };
}

export async function commitImportRows({ idPeriodeKonsultan, rows }) {
  const context = await loadImportContext(idPeriodeKonsultan);
  const sourceRows = Array.isArray(rows) ? rows.filter((row) => row?.selected !== false) : [];
  const errors = [];
  const data = [];

  if (!sourceRows.length) {
    return {
      ok: false,
      errors: [{ row: null, message: 'Tidak ada baris yang dikirim untuk diimpor.' }],
    };
  }

  sourceRows.forEach((row, index) => {
    const rowErrors = [];
    const excelRow = row?.excel_row || index + 1;
    const parsedDate = parseYmdDate(row?.tanggal_transaksi);
    const sharingRaw = normalizeText(row?.sharing_income_raw);
    const isOss = Boolean(row?.is_oss) || isOssValue(sharingRaw);
    const idUser = isOss ? null : normalizeText(row?.id_user_konsultan);
    const idProduk = normalizeText(row?.id_jenis_produk_konsultan);
    const namaKlien = normalizeText(row?.nama_klien);
    const deskripsi = normalizeText(row?.deskripsi);

    let nominalDebit = '0.00';
    let nominalKredit = '0.00';
    let totalIncome = '0.00';
    let nominalShare = '0.00';
    let nominalOss = '0.00';

    try {
      nominalDebit = parseMoneyCell(row?.nominal_debit, { allowBlank: false }).value;
      nominalKredit = parseMoneyCell(row?.nominal_kredit, { allowBlank: true }).value;
      totalIncome = parseMoneyCell(row?.total_income, { allowBlank: false }).value;
      nominalShare = parseMoneyCell(row?.nominal_share, { allowBlank: true }).value;
      nominalOss = parseMoneyCell(row?.nominal_oss, { allowBlank: true }).value;
    } catch (err) {
      rowErrors.push(err?.message || 'Nilai nominal tidak valid.');
    }

    if (!parsedDate) rowErrors.push('Tanggal transaksi tidak valid.');
    if (!namaKlien) rowErrors.push('Nama klien/student wajib diisi.');
    if (!deskripsi) rowErrors.push('Keterangan/deskripsi wajib diisi.');
    if (!isOss && !idUser) rowErrors.push('Konsultan wajib dipilih, kecuali untuk OSS.');
    if (idUser && !context.userMap.has(idUser)) rowErrors.push('User konsultan tidak ditemukan.');
    if (idProduk && !context.produkMap.has(idProduk)) rowErrors.push('Produk konsultan tidak ditemukan.');
    if (idProduk && context.produkMap.get(idProduk)?.aktif === false) rowErrors.push('Produk konsultan yang dipilih sedang tidak aktif.');
    if (subtractMoney(nominalDebit, nominalKredit) !== totalIncome) rowErrors.push('Total Income harus sama dengan Debet - Kredit.');
    if (sumMoney(nominalShare, nominalOss) !== totalIncome) rowErrors.push('Nominal share + nominal OSS harus sama dengan Total Income.');

    if (rowErrors.length) {
      errors.push(...rowErrors.map((message) => ({ row: excelRow, message })));
      return;
    }

    const produk = idProduk ? context.produkMap.get(idProduk) : null;

    data.push({
      id_periode_konsultan: context.periode.id_periode_konsultan,
      id_user_konsultan: idUser || null,
      id_jenis_produk_konsultan: idProduk || null,
      tanggal_transaksi: parsedDate.date,
      nama_klien: namaKlien || null,
      deskripsi: deskripsi || null,
      nominal_debit: nominalDebit,
      nominal_kredit: nominalKredit,
      total_income: totalIncome,
      persen_share_default: produk?.persen_share_default != null ? String(produk.persen_share_default) : null,
      persen_share_override: null,
      nominal_share: nominalShare,
      nominal_oss: nominalOss,
      override_manual: true,
      sudah_posting_payroll: false,
      catatan: null,
      deleted_at: null,
    });
  });

  if (errors.length) {
    return {
      ok: false,
      errors,
    };
  }

  const result = await db.transaksiKonsultan.createMany({ data });

  return {
    ok: true,
    created: result.count,
  };
}
