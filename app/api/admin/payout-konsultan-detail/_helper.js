import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

export const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
export const CREATE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
export const EDIT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
export const DELETE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

export const MONEY_SCALE = 2;
export const STATUS_PAYOUT_MUTATION_BLOCKED = 'DIPOSTING_KE_PAYROLL';
export const STATUS_PERIODE_KONSULTAN_TERKUNCI = 'TERKUNCI';

export const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'nominal_share', 'nominal_oss']);

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

  const negative = raw.startsWith('-');
  const unsigned = negative ? raw.slice(1) : raw;
  const [intPartRaw, fracPartRaw = ''] = unsigned.split('.');

  if (fracPartRaw.length > scale) {
    throw new Error(`Field '${fieldName}' maksimal memiliki ${scale} digit desimal.`);
  }

  const normalized = `${negative ? '-' : ''}${stripLeadingZeros(intPartRaw || '0')}.${fracPartRaw.padEnd(scale, '0')}`;

  if (min !== null && decimalToScaledBigInt(normalized, scale) < decimalToScaledBigInt(String(min), scale)) {
    throw new Error(`Field '${fieldName}' tidak boleh kurang dari ${min}.`);
  }

  if (max !== null && decimalToScaledBigInt(normalized, scale) > decimalToScaledBigInt(String(max), scale)) {
    throw new Error(`Field '${fieldName}' tidak boleh lebih besar dari ${max}.`);
  }

  return normalized;
}

export function sumDecimalStrings(a, b, scale = MONEY_SCALE) {
  return scaledBigIntToDecimalString(decimalToScaledBigInt(String(a || '0'), scale) + decimalToScaledBigInt(String(b || '0'), scale), scale);
}

export function subtractDecimalStrings(a, b, scale = MONEY_SCALE) {
  return scaledBigIntToDecimalString(decimalToScaledBigInt(String(a || '0'), scale) - decimalToScaledBigInt(String(b || '0'), scale), scale);
}

function getDecimalString(value, scale = MONEY_SCALE) {
  if (value === null || value === undefined) {
    return scaledBigIntToDecimalString(0n, scale);
  }

  return normalizeDecimalString(String(value), 'decimal', scale);
}

function sumDetailField(details, fieldName, scale = MONEY_SCALE) {
  return details.reduce((acc, item) => acc + decimalToScaledBigInt(String(item?.[fieldName] || '0'), scale), 0n);
}

export function buildSelect() {
  return {
    id_payout_konsultan_detail: true,
    id_payout_konsultan: true,
    id_transaksi_konsultan: true,
    nominal_share: true,
    nominal_oss: true,
    ditahan: true,
    catatan: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    payout: {
      select: {
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
      },
    },
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
        konsultan: {
          select: {
            id_user: true,
            nama_pengguna: true,
            email: true,
            role: true,
            deleted_at: true,
          },
        },
        jenis_produk: {
          select: {
            id_jenis_produk_konsultan: true,
            nama_produk: true,
            deleted_at: true,
          },
        },
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
      },
    },
  };
}

export function enrichPayoutDetail(data) {
  if (!data) return data;

  const payoutPosted = data.payout?.status_payout === STATUS_PAYOUT_MUTATION_BLOCKED || Boolean(data.payout?.diposting_pada);
  const periodeTerkunci = data.payout?.periode_konsultan?.status_periode === STATUS_PERIODE_KONSULTAN_TERKUNCI;
  const payoutDeleted = Boolean(data.payout?.deleted_at);
  const transaksiDeleted = Boolean(data.transaksi?.deleted_at);
  const transaksiPosted = Boolean(data.transaksi?.sudah_posting_payroll);

  return {
    ...data,
    business_state: {
      detail_deleted: Boolean(data.deleted_at),
      detail_ditahan: Boolean(data.ditahan),
      payout_deleted: payoutDeleted,
      payout_posted: payoutPosted,
      payout_status: data.payout?.status_payout ?? null,
      periode_terkunci: periodeTerkunci,
      transaksi_deleted: transaksiDeleted,
      transaksi_posted_payroll: transaksiPosted,
      transaksi_match_payout:
        data.payout?.id_periode_konsultan === data.transaksi?.id_periode_konsultan && data.payout?.id_user === data.transaksi?.id_user_konsultan,
      bisa_diubah: !Boolean(data.deleted_at) && !payoutDeleted && !periodeTerkunci && !payoutPosted,
      bisa_dihapus: !Boolean(data.deleted_at) && !payoutDeleted && !periodeTerkunci && !payoutPosted,
    },
  };
}

export async function getExistingPayout(id_payout_konsultan, { client = db } = {}) {
  if (!id_payout_konsultan) return null;

  return client.payoutKonsultan.findUnique({
    where: { id_payout_konsultan },
    select: {
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
          status_periode: true,
        },
      },
      user: {
        select: {
          id_user: true,
          nama_pengguna: true,
          email: true,
          nomor_induk_karyawan: true,
          deleted_at: true,
        },
      },
    },
  });
}

export async function getExistingTransaksi(id_transaksi_konsultan, { client = db } = {}) {
  if (!id_transaksi_konsultan) return null;

  return client.transaksiKonsultan.findUnique({
    where: { id_transaksi_konsultan },
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
      periode_konsultan: {
        select: {
          id_periode_konsultan: true,
          status_periode: true,
          deleted_at: true,
        },
      },
      konsultan: {
        select: {
          id_user: true,
          nama_pengguna: true,
          email: true,
          deleted_at: true,
        },
      },
      jenis_produk: {
        select: {
          id_jenis_produk_konsultan: true,
          nama_produk: true,
          deleted_at: true,
        },
      },
    },
  });
}

export async function getExistingPayoutDetail(id_payout_konsultan_detail, { client = db } = {}) {
  if (!id_payout_konsultan_detail) return null;

  return client.payoutKonsultanDetail.findUnique({
    where: { id_payout_konsultan_detail },
    select: buildSelect(),
  });
}

export function ensurePayoutMutable(payout) {
  if (!payout) {
    throw createHttpError(404, 'Payout konsultan tidak ditemukan.');
  }

  if (payout.deleted_at) {
    throw createHttpError(409, 'Payout konsultan yang dipilih sudah dihapus.');
  }

  if (payout.periode_konsultan?.deleted_at) {
    throw createHttpError(409, 'Periode konsultan untuk payout ini sudah dihapus.');
  }

  if (payout.periode_konsultan?.status_periode === STATUS_PERIODE_KONSULTAN_TERKUNCI) {
    throw createHttpError(409, 'Periode konsultan untuk payout ini sudah terkunci.');
  }

  if (payout.status_payout === STATUS_PAYOUT_MUTATION_BLOCKED || payout.diposting_pada) {
    throw createHttpError(409, 'Payout konsultan sudah diposting ke payroll dan tidak boleh diubah.');
  }
}

export async function resolvePayoutAndTransaksi(tx, { id_payout_konsultan, id_transaksi_konsultan, excludeDetailId = null }) {
  const [payout, transaksi] = await Promise.all([getExistingPayout(id_payout_konsultan, { client: tx }), getExistingTransaksi(id_transaksi_konsultan, { client: tx })]);

  ensurePayoutMutable(payout);

  if (!transaksi) {
    throw createHttpError(404, 'Transaksi konsultan tidak ditemukan.');
  }

  if (transaksi.deleted_at) {
    throw createHttpError(409, 'Transaksi konsultan yang dipilih sudah dihapus.');
  }

  if (transaksi.sudah_posting_payroll) {
    throw createHttpError(409, 'Transaksi konsultan yang dipilih sudah diposting ke payroll.');
  }

  if (transaksi.id_periode_konsultan !== payout.id_periode_konsultan) {
    throw createHttpError(409, 'Transaksi konsultan tidak berada pada periode konsultan yang sama dengan payout.');
  }

  if (!transaksi.id_user_konsultan || transaksi.id_user_konsultan !== payout.id_user) {
    throw createHttpError(409, 'Transaksi konsultan tidak dimiliki oleh user payout yang dipilih.');
  }

  const conflictingLinkedDetails = await tx.payoutKonsultanDetail.findMany({
    where: {
      id_transaksi_konsultan,
      deleted_at: null,
      ...(excludeDetailId
        ? {
            id_payout_konsultan_detail: {
              not: excludeDetailId,
            },
          }
        : {}),
      payout: {
        is: {
          deleted_at: null,
          id_payout_konsultan: {
            not: id_payout_konsultan,
          },
        },
      },
    },
    select: {
      id_payout_konsultan_detail: true,
      id_payout_konsultan: true,
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

  const conflictingLinkedDetail =
    conflictingLinkedDetails.find(
      (item) =>
        !(
          item.ditahan &&
          item.payout?.status_payout === STATUS_PAYOUT_MUTATION_BLOCKED
        ),
    ) || null;

  if (conflictingLinkedDetail) {
    throw createHttpError(
      409,
      "Transaksi konsultan sudah terhubung ke payout lain. Lepaskan dari payout sebelumnya terlebih dahulu.",
    );
  }

  return {
    payout,
    transaksi,
  };
}

export async function findDetailByComposite(tx, { id_payout_konsultan, id_transaksi_konsultan, excludeId = null }) {
  return tx.payoutKonsultanDetail.findFirst({
    where: {
      id_payout_konsultan,
      id_transaksi_konsultan,
      ...(excludeId
        ? {
            id_payout_konsultan_detail: {
              not: excludeId,
            },
          }
        : {}),
    },
    select: {
      id_payout_konsultan_detail: true,
      deleted_at: true,
      id_payout_konsultan: true,
      id_transaksi_konsultan: true,
    },
  });
}

export async function recalculatePayoutSummary(tx, id_payout_konsultan) {
  const payout = await tx.payoutKonsultan.findUnique({
    where: { id_payout_konsultan },
    select: {
      id_payout_konsultan: true,
      nominal_penyesuaian: true,
    },
  });

  if (!payout) {
    throw createHttpError(404, 'Payout konsultan tidak ditemukan saat menghitung ulang ringkasan.');
  }

  const details = await tx.payoutKonsultanDetail.findMany({
    where: {
      id_payout_konsultan,
      deleted_at: null,
    },
    select: {
      nominal_share: true,
      nominal_oss: true,
      ditahan: true,
    },
  });

  const totalShare = scaledBigIntToDecimalString(sumDetailField(details, 'nominal_share', MONEY_SCALE), MONEY_SCALE);
  const nominalDitahan = scaledBigIntToDecimalString(
    details.reduce(
      (acc, item) => acc + (item?.ditahan ? decimalToScaledBigInt(String(item?.nominal_share || '0'), MONEY_SCALE) : 0n),
      0n,
    ),
    MONEY_SCALE,
  );

  const nominalDibayarkan = getDecimalString(payout.nominal_penyesuaian, MONEY_SCALE);

  if (decimalToScaledBigInt(nominalDibayarkan, MONEY_SCALE) < 0n) {
    throw createHttpError(409, "Field 'nominal_penyesuaian' pada payout tidak boleh bernilai negatif.");
  }

  return tx.payoutKonsultan.update({
    where: { id_payout_konsultan },
    data: {
      total_share: totalShare,
      nominal_ditahan: nominalDitahan,
      nominal_dibayarkan: nominalDibayarkan,
    },
    select: {
      id_payout_konsultan: true,
      total_share: true,
      nominal_dibayarkan: true,
      nominal_ditahan: true,
      nominal_penyesuaian: true,
      status_payout: true,
      updated_at: true,
    },
  });
}

export function buildCreateOrUpdatePayload(input, transaksi, options = {}) {
  const { existing = null, useTransaksiDefault = false } = options;

  const nominalShare = hasOwn(input, 'nominal_share')
    ? input.nominal_share
    : existing && !useTransaksiDefault
      ? normalizeDecimalString(String(existing.nominal_share || '0'), 'nominal_share', MONEY_SCALE, { min: '0' })
      : normalizeDecimalString(String(transaksi.nominal_share || '0'), 'nominal_share', MONEY_SCALE, { min: '0' });

  const nominalOss = hasOwn(input, 'nominal_oss')
    ? input.nominal_oss
    : existing && !useTransaksiDefault
      ? normalizeDecimalString(String(existing.nominal_oss || '0'), 'nominal_oss', MONEY_SCALE, { min: '0' })
      : normalizeDecimalString(String(transaksi.nominal_oss || '0'), 'nominal_oss', MONEY_SCALE, { min: '0' });

  return {
    nominal_share: nominalShare,
    nominal_oss: nominalOss,
    ditahan: hasOwn(input, 'ditahan') ? Boolean(input.ditahan) : Boolean(existing?.ditahan),
    catatan: hasOwn(input, 'catatan') ? input.catatan : existing?.catatan ?? null,
  };
}
