import { NextResponse } from 'next/server';
import { recalculatePayrollTotals } from '@/app/api/admin/payroll-karyawan/payrollRecalculation.shared';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

export const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
export const CREATE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
export const EDIT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
export const DELETE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

export const MONEY_SCALE = 2;

export const STATUS_PAYOUT_VALUES = new Set(['DRAFT', 'DISETUJUI', 'DIPOSTING_KE_PAYROLL', 'DITAHAN']);
export const STATUS_PERIODE_KONSULTAN_TERKUNCI = 'TERKUNCI';
export const STATUS_PERIODE_PAYROLL_IMMUTABLE = new Set(['FINAL', 'TERKUNCI']);
export const STATUS_PAYROLL_IMMUTABLE = new Set(['DISETUJUI', 'DIBAYAR']);

export const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'total_share', 'nominal_ditahan', 'nominal_penyesuaian', 'nominal_dibayarkan', 'status_payout', 'disetujui_pada', 'diposting_pada']);

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const normRole = (role) =>
  String(role || '')
    .trim()
    .toUpperCase();

export function createHttpError(statusCode, message, extras = {}) {
  const err = new Error(message);
  err.statusCode = statusCode;
  Object.assign(err, extras);
  return err;
}

export async function ensureAuth(req) {
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

export function guardRole(actor, allowedRoles) {
  if (!allowedRoles.has(normRole(actor?.role))) {
    return NextResponse.json({ message: 'Forbidden: Anda tidak memiliki akses ke resource ini.' }, { status: 403 });
  }

  return null;
}

export function normalizeRequiredString(value, fieldName, maxLength = null) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  if (maxLength && normalized.length > maxLength) {
    throw new Error(`Field '${fieldName}' maksimal ${maxLength} karakter.`);
  }

  return normalized;
}

export function normalizeNullableString(value, fieldName = 'string', maxLength = null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  if (maxLength && normalized.length > maxLength) {
    throw new Error(`Field '${fieldName}' maksimal ${maxLength} karakter.`);
  }

  return normalized;
}

export function normalizeOptionalId(value, fieldName = 'id') {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  if (normalized.length > 36) {
    throw new Error(`Field '${fieldName}' maksimal 36 karakter.`);
  }

  return normalized;
}

export function normalizeIdList(value, fieldName = 'ids') {
  if (value === undefined) return undefined;
  if (value === null) return [];

  if (!Array.isArray(value)) {
    throw new Error(`Field '${fieldName}' harus berupa array id.`);
  }

  const normalized = [];
  const seen = new Set();

  for (const item of value) {
    const candidate = String(item || '').trim();

    if (!candidate) continue;

    if (candidate.length > 36) {
      throw new Error(`Field '${fieldName}' hanya boleh berisi id maksimal 36 karakter.`);
    }

    if (seen.has(candidate)) continue;

    seen.add(candidate);
    normalized.push(candidate);
  }

  return normalized;
}

export function normalizeOptionalInt(value, fieldName, options = {}) {
  const { min = null, max = null } = options;

  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const normalized = Number(value);

  if (!Number.isInteger(normalized)) {
    throw new Error(`Field '${fieldName}' harus berupa bilangan bulat.`);
  }

  if (min !== null && normalized < min) {
    throw new Error(`Field '${fieldName}' tidak boleh lebih kecil dari ${min}.`);
  }

  if (max !== null && normalized > max) {
    throw new Error(`Field '${fieldName}' tidak boleh lebih besar dari ${max}.`);
  }

  return normalized;
}

export function normalizeBoolean(value, fieldName = 'boolean') {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'ya', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'tidak', 'no'].includes(normalized)) return false;
  }

  throw new Error(`Field '${fieldName}' harus bernilai boolean.`);
}

export function normalizeEnum(value, allowedValues, fieldName) {
  const normalized = String(value || '')
    .trim()
    .toUpperCase();

  if (!normalized) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  if (!allowedValues.has(normalized)) {
    throw new Error(`${fieldName} tidak valid. Nilai yang diizinkan: ${Array.from(allowedValues).join(', ')}`);
  }

  return normalized;
}

export function parseDateOnly(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Field '${fieldName}' harus berupa tanggal yang valid.`);
  }

  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

function stripLeadingZeros(numStr) {
  const stripped = numStr.replace(/^0+(?=\d)/, '');
  return stripped || '0';
}

export function decimalToScaledBigInt(value, scale) {
  const stringValue = String(value);
  const negative = stringValue.startsWith('-');
  const unsigned = negative ? stringValue.slice(1) : stringValue;
  const [intPartRaw, fracPartRaw = ''] = unsigned.split('.');
  const intPart = stripLeadingZeros(intPartRaw || '0');
  const fracPart = fracPartRaw.padEnd(scale, '0').slice(0, scale);
  const bigintValue = BigInt(`${intPart}${fracPart}`);
  return negative ? -bigintValue : bigintValue;
}

export function scaledBigIntToDecimalString(value, scale) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const padded = absolute.toString().padStart(scale + 1, '0');
  const integerPart = padded.slice(0, -scale) || '0';
  const fractionPart = padded.slice(-scale);

  return `${negative ? '-' : ''}${integerPart}.${fractionPart}`;
}

export function normalizeDecimalString(value, fieldName, scale, options = {}) {
  const { allowNull = false, min = null, max = null } = options;

  if (value === undefined) return undefined;
  if (value === null || value === '') {
    if (allowNull) return null;
    throw new Error(`Field '${fieldName}' tidak boleh kosong.`);
  }

  const raw = String(value).trim().replace(',', '.');

  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    throw new Error(`Field '${fieldName}' harus berupa angka desimal yang valid.`);
  }

  const [integerPartRaw, fractionPartRaw = ''] = raw.split('.');
  if (fractionPartRaw.length > scale) {
    throw new Error(`Field '${fieldName}' maksimal memiliki ${scale} angka desimal.`);
  }

  const negative = integerPartRaw.startsWith('-');
  const integerDigits = negative ? integerPartRaw.slice(1) : integerPartRaw;
  const normalizedInteger = stripLeadingZeros(integerDigits || '0');
  const normalizedFraction = fractionPartRaw.padEnd(scale, '0');

  const normalized = `${negative ? '-' : ''}${normalizedInteger}.${normalizedFraction}`;
  const scaledValue = decimalToScaledBigInt(normalized, scale);

  if (min !== null && scaledValue < decimalToScaledBigInt(min, scale)) {
    throw new Error(`Field '${fieldName}' tidak boleh lebih kecil dari ${min}.`);
  }

  if (max !== null && scaledValue > decimalToScaledBigInt(max, scale)) {
    throw new Error(`Field '${fieldName}' tidak boleh lebih besar dari ${max}.`);
  }

  return normalized;
}

export function sumDecimalStrings(a, b, scale = MONEY_SCALE) {
  const total = decimalToScaledBigInt(a, scale) + decimalToScaledBigInt(b, scale);
  return scaledBigIntToDecimalString(total, scale);
}

export function subtractDecimalStrings(a, b, scale = MONEY_SCALE) {
  const total = decimalToScaledBigInt(a, scale) - decimalToScaledBigInt(b, scale);
  return scaledBigIntToDecimalString(total, scale);
}

export function buildSelect({ includeDetails = false } = {}) {
  return {
    id_payout_konsultan: true,
    id_periode_konsultan: true,
    id_user: true,
    id_periode_payroll: true,
    total_share: true,
    nominal_ditahan: true,
    nominal_penyesuaian: true,
    nominal_dibayarkan: true,
    status_payout: true,
    disetujui_pada: true,
    diposting_pada: true,
    catatan: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    periode_konsultan: {
      select: {
        id_periode_konsultan: true,
        tahun: true,
        bulan: true,
        tanggal_mulai: true,
        tanggal_selesai: true,
        status_periode: true,
        deleted_at: true,
      },
    },
    periode_payroll: {
      select: {
        id_periode_payroll: true,
        tahun: true,
        bulan: true,
        tanggal_mulai: true,
        tanggal_selesai: true,
        status_periode: true,
      },
    },
    user: {
      select: {
        id_user: true,
        nama_pengguna: true,
        email: true,
        role: true,
        status_kerja: true,
        nomor_induk_karyawan: true,
        nomor_rekening: true,
        jenis_bank: true,
        deleted_at: true,
      },
    },
    ...(includeDetails
      ? {
          payout_detail: {
            where: {
              deleted_at: null,
            },
            orderBy: [
              {
                created_at: 'asc',
              },
            ],
            select: {
              id_payout_konsultan_detail: true,
              id_transaksi_konsultan: true,
              nominal_share: true,
              nominal_oss: true,
              ditahan: true,
              catatan: true,
              created_at: true,
              updated_at: true,
              deleted_at: true,
              transaksi: {
                select: {
                  id_transaksi_konsultan: true,
                  id_periode_konsultan: true,
                  id_user_konsultan: true,
                  id_jenis_produk_konsultan: true,
                  tanggal_transaksi: true,
                  nama_klien: true,
                  deskripsi: true,
                  nominal_debit: true,
                  nominal_kredit: true,
                  total_income: true,
                  persen_share_default: true,
                  persen_share_override: true,
                  nominal_share: true,
                  nominal_oss: true,
                  override_manual: true,
                  sudah_posting_payroll: true,
                  catatan: true,
                  deleted_at: true,
                  jenis_produk: {
                    select: {
                      id_jenis_produk_konsultan: true,
                      nama_produk: true,
                      deleted_at: true,
                    },
                  },
                },
              },
            },
          },
        }
      : {}),
  };
}

export function enrichPayout(data) {
  if (!data) return data;

  const detailRows = Array.isArray(data.payout_detail) ? data.payout_detail : [];
  const totalShareDetail = detailRows.reduce((acc, item) => acc + decimalToScaledBigInt(String(item.nominal_share || '0'), MONEY_SCALE), 0n);
  const totalOssDetail = detailRows.reduce((acc, item) => acc + decimalToScaledBigInt(String(item.nominal_oss || '0'), MONEY_SCALE), 0n);
  const totalShareDitahan = detailRows.reduce((acc, item) => (item?.ditahan ? acc + decimalToScaledBigInt(String(item.nominal_share || '0'), MONEY_SCALE) : acc), 0n);
  const detailDitahanCount = detailRows.filter((item) => item?.ditahan).length;

  const periodeTerkunci = data.periode_konsultan?.status_periode === STATUS_PERIODE_KONSULTAN_TERKUNCI;
  const posted = data.status_payout === 'DIPOSTING_KE_PAYROLL';
  const payrollImmutable = Boolean(data.periode_payroll?.status_periode && STATUS_PERIODE_PAYROLL_IMMUTABLE.has(data.periode_payroll.status_periode));
  const payrollAttached = Boolean(data.id_periode_payroll);
  const payrollDeleted = Boolean(data.id_periode_payroll && !data.periode_payroll);

  return {
    ...data,
    detail_summary: Array.isArray(data.payout_detail)
      ? {
          detail_count: detailRows.length,
          detail_ditahan_count: detailDitahanCount,
          total_share_detail: scaledBigIntToDecimalString(totalShareDetail, MONEY_SCALE),
          total_share_ditahan: scaledBigIntToDecimalString(totalShareDitahan, MONEY_SCALE),
          total_oss_detail: scaledBigIntToDecimalString(totalOssDetail, MONEY_SCALE),
        }
      : undefined,
    business_state: {
      periode_deleted: Boolean(data.periode_konsultan?.deleted_at),
      periode_terkunci: periodeTerkunci,
      payout_deleted: Boolean(data.deleted_at),
      payroll_attached: payrollAttached,
      payroll_deleted: payrollDeleted,
      payroll_immutable: payrollImmutable,
      payout_posted: posted,
      payout_disetujui: data.status_payout === 'DISETUJUI',
      payout_ditahan: data.status_payout === 'DITAHAN',
      bisa_lepas_posting: !Boolean(data.deleted_at) && !Boolean(data.periode_konsultan?.deleted_at) && !periodeTerkunci && posted && payrollAttached && !payrollDeleted && !payrollImmutable,
      bisa_diubah: !Boolean(data.deleted_at) && !Boolean(data.periode_konsultan?.deleted_at) && !periodeTerkunci && !posted,
      bisa_dihapus: !Boolean(data.periode_konsultan?.deleted_at) && !periodeTerkunci && !posted,
    },
  };
}

export async function getExistingPayout(id, { includeDetails = true, client = db } = {}) {
  return client.payoutKonsultan.findUnique({
    where: { id_payout_konsultan: id },
    select: buildSelect({ includeDetails }),
  });
}

export function ensurePayoutMutable(existing) {
  if (existing.status_payout === 'DIPOSTING_KE_PAYROLL' || existing.diposting_pada) {
    throw createHttpError(409, 'Payout konsultan sudah diposting ke payroll dan tidak boleh diubah.');
  }

  if (existing.periode_konsultan?.deleted_at) {
    throw createHttpError(409, 'Periode konsultan untuk payout ini sudah dihapus.');
  }

  if (existing.periode_konsultan?.status_periode === STATUS_PERIODE_KONSULTAN_TERKUNCI) {
    throw createHttpError(409, 'Periode konsultan untuk payout ini sudah terkunci.');
  }
}

export function ensurePayoutDeletable(existing) {
  if (existing.status_payout === 'DIPOSTING_KE_PAYROLL' || existing.diposting_pada) {
    throw createHttpError(409, 'Payout konsultan sudah diposting ke payroll dan tidak boleh dihapus.');
  }

  if (existing.periode_konsultan?.deleted_at) {
    throw createHttpError(409, 'Periode konsultan untuk payout ini sudah dihapus.');
  }

  if (existing.periode_konsultan?.status_periode === STATUS_PERIODE_KONSULTAN_TERKUNCI) {
    throw createHttpError(409, 'Periode konsultan untuk payout ini sudah terkunci.');
  }
}

export async function findConflictingPayout(tx, { id_periode_konsultan, id_user, excludeId = null }) {
  return tx.payoutKonsultan.findFirst({
    where: {
      id_periode_konsultan,
      id_user,
      ...(excludeId
        ? {
            NOT: {
              id_payout_konsultan: excludeId,
            },
          }
        : {}),
    },
    select: {
      id_payout_konsultan: true,
      status_payout: true,
      deleted_at: true,
    },
  });
}

function validatePeriodeKonsultan(periode) {
  if (!periode) {
    throw new Error('Periode konsultan tidak ditemukan.');
  }

  if (periode.deleted_at) {
    throw new Error('Periode konsultan yang dipilih sudah dihapus.');
  }

  if (periode.status_periode === STATUS_PERIODE_KONSULTAN_TERKUNCI) {
    throw new Error('Periode konsultan yang dipilih sudah terkunci.');
  }
}

function validateUser(user) {
  if (!user) {
    throw new Error('User payout konsultan tidak ditemukan.');
  }

  if (user.deleted_at) {
    throw new Error('User payout konsultan yang dipilih sudah dihapus.');
  }
}

function validatePeriodePayroll(periode) {
  if (!periode) {
    throw new Error('Periode payroll tidak ditemukan.');
  }
}

function sumTransactionFields(transactions, fieldName) {
  return transactions.reduce((acc, item) => acc + decimalToScaledBigInt(String(item[fieldName] || '0'), MONEY_SCALE), 0n);
}

function buildCarryForwardDitahanWhere(targetPeriode) {
  if (!targetPeriode?.tanggal_mulai) return null;

  return {
    tanggal_transaksi: {
      lt: targetPeriode.tanggal_mulai,
    },
    payout_detail: {
      some: {
        deleted_at: null,
        ditahan: true,
        payout: {
          is: {
            deleted_at: null,
            status_payout: {
              not: 'DRAFT',
            },
          },
        },
      },
    },
  };
}

async function collectEligibleTransactions(tx, { id_periode_konsultan, id_user, periode_konsultan = null, excludePayoutId = null }) {
  const carryForwardWhere = buildCarryForwardDitahanWhere(periode_konsultan);

  const transactions = await tx.transaksiKonsultan.findMany({
    where: {
      id_user_konsultan: id_user,
      deleted_at: null,
      sudah_posting_payroll: false,
      OR: [
        {
          id_periode_konsultan,
        },
        ...(carryForwardWhere ? [carryForwardWhere] : []),
      ],
    },
    orderBy: [{ tanggal_transaksi: 'asc' }, { created_at: 'asc' }],
    select: {
      id_transaksi_konsultan: true,
      id_periode_konsultan: true,
      tanggal_transaksi: true,
      nama_klien: true,
      deskripsi: true,
      nominal_debit: true,
      nominal_kredit: true,
      total_income: true,
      nominal_share: true,
      nominal_oss: true,
      sudah_posting_payroll: true,
    },
  });

  if (!transactions.length) {
    throw new Error('Belum ada transaksi konsultan aktif atau carry-forward yang siap dipayout untuk user dan periode tersebut.');
  }

  const transactionIds = transactions.map((item) => item.id_transaksi_konsultan);

  const duplicateLinks = await tx.payoutKonsultanDetail.findMany({
    where: {
      id_transaksi_konsultan: {
        in: transactionIds,
      },
      deleted_at: null,
      payout: {
        is: {
          deleted_at: null,
          ...(excludePayoutId
            ? {
                id_payout_konsultan: {
                  not: excludePayoutId,
                },
              }
            : {}),
        },
      },
    },
    select: {
      id_transaksi_konsultan: true,
      ditahan: true,
      payout: {
        select: {
          id_payout_konsultan: true,
          status_payout: true,
        },
      },
    },
    take: 5,
  });

  const blockingDuplicateLinks = duplicateLinks.filter((item) => !(item.ditahan && item.payout?.status_payout && item.payout?.status_payout !== 'DRAFT'));

  if (blockingDuplicateLinks.length) {
    throw new Error('Sebagian transaksi sudah terhubung ke payout lain.');
  }

  return transactions;
}

function resolveWithheldTransactionIds(input, existing = null) {
  if (hasOwn(input, 'id_transaksi_konsultan_ditahan')) {
    return input.id_transaksi_konsultan_ditahan || [];
  }

  if (!Array.isArray(existing?.payout_detail)) {
    return [];
  }

  return existing.payout_detail
    .filter((item) => item?.ditahan && item?.deleted_at === null)
    .map((item) => item.id_transaksi_konsultan)
    .filter(Boolean);
}

function buildStatusState(status_payout, existing = null) {
  const currentApprovedAt = existing?.disetujui_pada ?? null;
  const currentPostedAt = existing?.diposting_pada ?? null;

  if (status_payout === 'DIPOSTING_KE_PAYROLL') {
    return {
      disetujui_pada: currentApprovedAt || new Date(),
      diposting_pada: currentPostedAt || new Date(),
    };
  }

  if (status_payout === 'DISETUJUI') {
    return {
      disetujui_pada: currentApprovedAt || new Date(),
      diposting_pada: null,
    };
  }

  return {
    disetujui_pada: null,
    diposting_pada: null,
  };
}

export async function resolvePayoutPayload(tx, input, existing = null, actor = null) {
  const id_periode_konsultan = hasOwn(input, 'id_periode_konsultan') ? input.id_periode_konsultan : existing?.id_periode_konsultan;
  const id_user = hasOwn(input, 'id_user') ? input.id_user : existing?.id_user;
  const id_periode_payroll = hasOwn(input, 'id_periode_payroll') ? input.id_periode_payroll : (existing?.id_periode_payroll ?? null);

  if (!id_periode_konsultan) {
    throw new Error("Field 'id_periode_konsultan' wajib diisi.");
  }

  if (!id_user) {
    throw new Error("Field 'id_user' wajib diisi.");
  }

  const nominal_penyesuaian = hasOwn(input, 'nominal_penyesuaian') ? input.nominal_penyesuaian : existing?.nominal_penyesuaian !== undefined && existing?.nominal_penyesuaian !== null ? String(existing.nominal_penyesuaian) : '0.00';

  const status_payout = hasOwn(input, 'status_payout') ? input.status_payout : (existing?.status_payout ?? 'DRAFT');

  const catatan = hasOwn(input, 'catatan') ? input.catatan : (existing?.catatan ?? null);

  const [periodeKonsultan, user, periodePayroll] = await Promise.all([
    tx.periodeKonsultan.findUnique({
      where: { id_periode_konsultan },
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
    tx.user.findUnique({
      where: { id_user },
      select: {
        id_user: true,
        nama_pengguna: true,
        email: true,
        deleted_at: true,
      },
    }),
    id_periode_payroll
      ? tx.periodePayroll.findUnique({
          where: { id_periode_payroll },
          select: {
            id_periode_payroll: true,
            tahun: true,
            bulan: true,
            tanggal_mulai: true,
            tanggal_selesai: true,
            status_periode: true,
          },
        })
      : Promise.resolve(null),
  ]);

  validatePeriodeKonsultan(periodeKonsultan);
  validateUser(user);

  if (id_periode_payroll) {
    validatePeriodePayroll(periodePayroll);
  }

  const transactions = await collectEligibleTransactions(tx, {
    id_periode_konsultan,
    id_user,
    periode_konsultan: periodeKonsultan,
    excludePayoutId: existing?.id_payout_konsultan ?? null,
  });
  const withheldTransactionIds = resolveWithheldTransactionIds(input, existing);
  const transactionIdSet = new Set(transactions.map((item) => item.id_transaksi_konsultan));

  const invalidWithheldTransactionId = withheldTransactionIds.find((id) => !transactionIdSet.has(id));

  if (invalidWithheldTransactionId) {
    throw new Error(`Transaksi ditahan '${invalidWithheldTransactionId}' tidak tersedia pada kumpulan transaksi payout yang aktif.`);
  }

  const enrichedTransactions = transactions.map((item) => ({
    ...item,
    ditahan: withheldTransactionIds.includes(item.id_transaksi_konsultan),
  }));

  const totalShareBigInt = sumTransactionFields(enrichedTransactions, 'nominal_share');
  const totalOssBigInt = sumTransactionFields(enrichedTransactions, 'nominal_oss');
  const totalDitahanBigInt = enrichedTransactions.reduce((acc, item) => (item.ditahan ? acc + decimalToScaledBigInt(String(item.nominal_share || '0'), MONEY_SCALE) : acc), 0n);

  if (totalShareBigInt <= 0n) {
    throw new Error('Total share payout harus lebih besar dari 0.');
  }

  const total_share = scaledBigIntToDecimalString(totalShareBigInt, MONEY_SCALE);
  const nominal_ditahan = scaledBigIntToDecimalString(totalDitahanBigInt, MONEY_SCALE);
  const nominal_dibayarkan = nominal_penyesuaian;

  if (decimalToScaledBigInt(nominal_dibayarkan, MONEY_SCALE) < 0n) {
    throw new Error("Field 'nominal_penyesuaian' tidak boleh bernilai negatif.");
  }

  if (status_payout === 'DIPOSTING_KE_PAYROLL' && !id_periode_payroll) {
    throw new Error("Field 'id_periode_payroll' wajib diisi saat status_payout = 'DIPOSTING_KE_PAYROLL'.");
  }

  const statusState = buildStatusState(status_payout, existing);

  return {
    payload: {
      id_periode_konsultan,
      id_user,
      id_periode_payroll,
      total_share,
      nominal_ditahan,
      nominal_penyesuaian,
      nominal_dibayarkan,
      status_payout,
      disetujui_pada: statusState.disetujui_pada,
      diposting_pada: statusState.diposting_pada,
      catatan,
    },
    relationState: {
      periode_konsultan: periodeKonsultan,
      user,
      periode_payroll: periodePayroll,
      actor,
    },
    transactions: enrichedTransactions,
    summary: {
      total_share,
      total_oss: scaledBigIntToDecimalString(totalOssBigInt, MONEY_SCALE),
      nominal_ditahan,
      nominal_dibayarkan,
      detail_count: enrichedTransactions.length,
      detail_ditahan_count: enrichedTransactions.filter((item) => item.ditahan).length,
    },
  };
}

export async function replacePayoutDetails(tx, id_payout_konsultan, transactions) {
  await tx.payoutKonsultanDetail.deleteMany({
    where: {
      id_payout_konsultan,
    },
  });

  if (!transactions.length) return;

  await tx.payoutKonsultanDetail.createMany({
    data: transactions.map((item) => ({
      id_payout_konsultan,
      id_transaksi_konsultan: item.id_transaksi_konsultan,
      nominal_share: String(item.nominal_share),
      nominal_oss: String(item.nominal_oss),
      ditahan: Boolean(item.ditahan),
      catatan: null,
      deleted_at: null,
    })),
  });
}

export async function setTransaksiPostingStatusByPayout(tx, id_payout_konsultan, posted) {
  const detailRows = await tx.payoutKonsultanDetail.findMany({
    where: {
      id_payout_konsultan,
      deleted_at: null,
      ...(posted ? { ditahan: false } : {}),
    },
    select: {
      id_transaksi_konsultan: true,
    },
  });

  const transactionIds = detailRows.map((item) => item.id_transaksi_konsultan);

  if (!transactionIds.length) return 0;

  const updated = await tx.transaksiKonsultan.updateMany({
    where: {
      id_transaksi_konsultan: {
        in: transactionIds,
      },
    },
    data: {
      sudah_posting_payroll: posted,
    },
  });

  return updated.count;
}

async function ensurePayrollPostingTarget(tx, { id_periode_payroll, id_user }) {
  const payroll = await tx.payrollKaryawan.findFirst({
    where: {
      id_periode_payroll,
      id_user,
      deleted_at: null,
    },
    select: {
      id_payroll_karyawan: true,
      status_payroll: true,
      deleted_at: true,
      periode: {
        select: {
          id_periode_payroll: true,
          status_periode: true,
        },
      },
    },
  });

  if (!payroll) {
    throw new Error('Payroll karyawan untuk user dan periode payroll tersebut tidak ditemukan.');
  }

  if (payroll.deleted_at) {
    throw new Error('Payroll tujuan untuk posting payout sudah dihapus.');
  }

  if (payroll.status_payroll && STATUS_PAYROLL_IMMUTABLE.has(payroll.status_payroll)) {
    throw new Error('Payroll tujuan sudah tidak bisa diubah karena status payroll tidak mutable.');
  }

  if (payroll.periode?.status_periode && STATUS_PERIODE_PAYROLL_IMMUTABLE.has(payroll.periode.status_periode)) {
    throw new Error('Periode payroll tujuan sudah final atau terkunci.');
  }

  return payroll;
}

async function ensurePayrollMutableById(tx, id_payroll_karyawan) {
  const payroll = await tx.payrollKaryawan.findUnique({
    where: {
      id_payroll_karyawan,
    },
    select: {
      id_payroll_karyawan: true,
      status_payroll: true,
      deleted_at: true,
      periode: {
        select: {
          id_periode_payroll: true,
          status_periode: true,
        },
      },
    },
  });

  if (!payroll) {
    throw new Error('Payroll karyawan tujuan tidak ditemukan.');
  }

  if (payroll.deleted_at) {
    throw new Error('Payroll karyawan tujuan sudah dihapus.');
  }

  if (payroll.status_payroll && STATUS_PAYROLL_IMMUTABLE.has(payroll.status_payroll)) {
    throw new Error('Payroll tujuan sudah tidak bisa diubah karena status payroll tidak mutable.');
  }

  if (payroll.periode?.status_periode && STATUS_PERIODE_PAYROLL_IMMUTABLE.has(payroll.periode.status_periode)) {
    throw new Error('Periode payroll tujuan sudah final atau terkunci.');
  }

  return payroll;
}

async function getDefinitionForPayoutPosting(tx, id_definisi_komponen_payroll) {
  if (!id_definisi_komponen_payroll) {
    throw createHttpError(400, "Field 'id_definisi_komponen_payroll' wajib diisi saat posting payout ke payroll.");
  }

  const definisi = await tx.definisiKomponenPayroll.findUnique({
    where: {
      id_definisi_komponen_payroll,
    },
    select: {
      id_definisi_komponen_payroll: true,
      id_tipe_komponen_payroll: true,
      nama_komponen: true,
      arah_komponen: true,
      aktif: true,
      deleted_at: true,
      tipe_komponen: {
        select: {
          id_tipe_komponen_payroll: true,
          nama_tipe_komponen: true,
          deleted_at: true,
        },
      },
    },
  });

  if (!definisi) {
    throw new Error('Definisi komponen payroll tidak ditemukan.');
  }

  if (definisi.deleted_at) {
    throw new Error('Definisi komponen payroll yang dipilih sudah dihapus.');
  }

  if (!definisi.aktif) {
    throw new Error('Definisi komponen payroll yang dipilih sedang tidak aktif.');
  }

  if (definisi.tipe_komponen?.deleted_at) {
    throw new Error('Tipe komponen payroll dari definisi yang dipilih sudah dihapus.');
  }

  if (!definisi.tipe_komponen?.nama_tipe_komponen) {
    throw new Error('Definisi komponen payroll belum memiliki tipe komponen yang valid.');
  }

  return definisi;
}

function buildPayoutPayrollItemName(payout, definisi = null) {
  if (definisi?.nama_komponen) {
    return definisi.nama_komponen;
  }

  const tahun = payout.periode_konsultan?.tahun ?? '';
  const bulan = payout.periode_konsultan?.bulan ?? '';

  return `Insentif Konsultan ${bulan} ${tahun}`.trim();
}

function buildPayoutPayrollItemNote(payout) {
  const nomorInduk = payout.user?.nomor_induk_karyawan ? ` (${payout.user.nomor_induk_karyawan})` : '';
  return `Posting payout konsultan untuk ${payout.user?.nama_pengguna || 'user'}${nomorInduk}.`;
}

export function buildPayoutPayrollItemKey(id_payout_konsultan) {
  return `payout-konsultan:${id_payout_konsultan}`;
}

export function buildPayoutUnpostState() {
  return {
    id_periode_payroll: null,
    status_payout: 'DRAFT',
    disetujui_pada: null,
    diposting_pada: null,
  };
}

export async function upsertPayrollItemForPayout(tx, payout, actor = null, options = {}) {
  const payrollTarget = await ensurePayrollPostingTarget(tx, {
    id_periode_payroll: payout.id_periode_payroll,
    id_user: payout.id_user,
  });

  const definisi = await getDefinitionForPayoutPosting(tx, options?.id_definisi_komponen_payroll);

  const existingItem = await tx.itemKomponenPayroll.findFirst({
    where: {
      kunci_idempoten: buildPayoutPayrollItemKey(payout.id_payout_konsultan),
    },
    select: {
      id_item_komponen_payroll: true,
      urutan_tampil: true,
    },
  });

  const payload = {
    id_payroll_karyawan: payrollTarget.id_payroll_karyawan,
    id_definisi_komponen_payroll: definisi?.id_definisi_komponen_payroll ?? null,
    id_user_pembuat: actor?.id ?? null,
    kunci_idempoten: buildPayoutPayrollItemKey(payout.id_payout_konsultan),
    tipe_komponen: String(definisi?.tipe_komponen?.nama_tipe_komponen || '').trim(),
    arah_komponen: String(definisi?.arah_komponen || '')
      .trim()
      .toUpperCase(),
    nama_komponen: buildPayoutPayrollItemName(payout, definisi),
    nominal: String(payout.nominal_dibayarkan),
    urutan_tampil: options?.urutan_tampil ?? existingItem?.urutan_tampil ?? 900,
    catatan: payout.catatan || buildPayoutPayrollItemNote(payout),
    deleted_at: null,
  };

  let item;

  if (existingItem) {
    item = await tx.itemKomponenPayroll.update({
      where: {
        id_item_komponen_payroll: existingItem.id_item_komponen_payroll,
      },
      data: payload,
      select: {
        id_item_komponen_payroll: true,
        id_payroll_karyawan: true,
      },
    });
  } else {
    item = await tx.itemKomponenPayroll.create({
      data: payload,
      select: {
        id_item_komponen_payroll: true,
        id_payroll_karyawan: true,
      },
    });
  }

  const totals = await recalculatePayrollTotals(tx, payrollTarget.id_payroll_karyawan, {
    negativeNetMessage: 'Perubahan posting payout membuat pendapatan_bersih payroll bernilai negatif.',
  });

  return {
    item,
    payroll: {
      id_payroll_karyawan: payrollTarget.id_payroll_karyawan,
      totals,
    },
  };
}

export async function detachPayrollItemForPayout(tx, payout) {
  const canonicalPayroll = await ensurePayrollPostingTarget(tx, {
    id_periode_payroll: payout.id_periode_payroll,
    id_user: payout.id_user,
  });
  const payoutItemKey = buildPayoutPayrollItemKey(payout.id_payout_konsultan);
  const existingItem = await tx.itemKomponenPayroll.findFirst({
    where: {
      kunci_idempoten: payoutItemKey,
      deleted_at: null,
    },
    select: {
      id_item_komponen_payroll: true,
      id_payroll_karyawan: true,
    },
  });

  const payrollTargets = new Map([[canonicalPayroll.id_payroll_karyawan, canonicalPayroll]]);

  if (existingItem?.id_payroll_karyawan && !payrollTargets.has(existingItem.id_payroll_karyawan)) {
    const movedPayroll = await ensurePayrollMutableById(tx, existingItem.id_payroll_karyawan);
    payrollTargets.set(movedPayroll.id_payroll_karyawan, movedPayroll);
  }

  let detachedItem = null;

  if (existingItem) {
    detachedItem = await tx.itemKomponenPayroll.update({
      where: {
        id_item_komponen_payroll: existingItem.id_item_komponen_payroll,
      },
      data: {
        deleted_at: new Date(),
      },
      select: {
        id_item_komponen_payroll: true,
        id_payroll_karyawan: true,
      },
    });
  }

  const payrolls = [];

  for (const payrollTarget of payrollTargets.values()) {
    const totals = await recalculatePayrollTotals(tx, payrollTarget.id_payroll_karyawan, {
      negativeNetMessage: 'Lepas posting payout membuat pendapatan_bersih payroll bernilai negatif.',
    });

    payrolls.push({
      id_payroll_karyawan: payrollTarget.id_payroll_karyawan,
      totals,
    });
  }

  return {
    item: detachedItem,
    payrolls,
  };
}

export async function unpostPayoutPayrollPosting(tx, id_payout_konsultan) {
  const existing = await getExistingPayout(id_payout_konsultan, {
    includeDetails: true,
    client: tx,
  });

  if (!existing) {
    throw createHttpError(404, 'Payout konsultan tidak ditemukan.');
  }

  if (existing.deleted_at) {
    throw createHttpError(409, 'Payout konsultan ini sudah dihapus.');
  }

  if (existing.periode_konsultan?.deleted_at) {
    throw createHttpError(409, 'Periode konsultan payout ini sudah dihapus.');
  }

  if (existing.periode_konsultan?.status_periode === STATUS_PERIODE_KONSULTAN_TERKUNCI) {
    throw createHttpError(409, 'Periode konsultan payout ini sudah terkunci.');
  }

  const posted = existing.status_payout === 'DIPOSTING_KE_PAYROLL' || Boolean(existing.diposting_pada);
  if (!posted) {
    throw createHttpError(409, 'Payout konsultan ini belum diposting ke payroll.');
  }

  if (!existing.id_periode_payroll) {
    throw createHttpError(409, 'Payout konsultan ini tidak memiliki relasi periode payroll aktif untuk dilepas posting.');
  }

  const detachSummary = await detachPayrollItemForPayout(tx, existing);
  const transaksiReleased = await setTransaksiPostingStatusByPayout(tx, id_payout_konsultan, false);

  await tx.payoutKonsultan.update({
    where: {
      id_payout_konsultan,
    },
    data: buildPayoutUnpostState(),
  });

  const refreshed = await tx.payoutKonsultan.findUnique({
    where: {
      id_payout_konsultan,
    },
    select: buildSelect({ includeDetails: true }),
  });

  return {
    data: enrichPayout(refreshed),
    detachSummary,
    transaksiReleased,
  };
}
