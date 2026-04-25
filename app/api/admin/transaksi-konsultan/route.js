import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const CREATE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const STATUS_PERIODE_TERKUNCI = 'TERKUNCI';

const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'tanggal_transaksi', 'nama_klien', 'nominal_debit', 'nominal_kredit', 'total_income', 'nominal_share', 'nominal_oss', 'override_manual', 'sudah_posting_payroll']);

const MONEY_SCALE = 2;
const SHARE_SCALE = 4;
const STATUS_PAYOUT_DRAFT = 'DRAFT';

const normRole = (role) =>
  String(role || '')
    .trim()
    .toUpperCase();

function normalizeRequiredString(value, fieldName, maxLength = null) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  if (maxLength && normalized.length > maxLength) {
    throw new Error(`Field '${fieldName}' maksimal ${maxLength} karakter.`);
  }

  return normalized;
}

function normalizeNullableString(value, fieldName = 'string', maxLength = null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  if (maxLength && normalized.length > maxLength) {
    throw new Error(`Field '${fieldName}' maksimal ${maxLength} karakter.`);
  }

  return normalized;
}

function normalizeOptionalId(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  return normalized;
}

function normalizeBoolean(value, fieldName = 'boolean') {
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

function stripLeadingZeros(numStr) {
  const stripped = numStr.replace(/^0+(?=\d)/, '');
  return stripped || '0';
}

function decimalToScaledBigInt(value, scale) {
  const stringValue = String(value);
  const negative = stringValue.startsWith('-');
  const unsigned = negative ? stringValue.slice(1) : stringValue;
  const [intPartRaw, fracPartRaw = ''] = unsigned.split('.');
  const intPart = stripLeadingZeros(intPartRaw || '0');
  const fracPart = fracPartRaw.padEnd(scale, '0').slice(0, scale);
  const bigintValue = BigInt(`${intPart}${fracPart}`);
  return negative ? -bigintValue : bigintValue;
}

function scaledBigIntToDecimalString(value, scale) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const padded = absolute.toString().padStart(scale + 1, '0');
  const integerPart = padded.slice(0, -scale) || '0';
  const fractionPart = padded.slice(-scale);
  return `${negative ? '-' : ''}${integerPart}.${fractionPart}`;
}

function divideAndRoundHalfUp(numerator, denominator) {
  if (denominator === 0n) {
    throw new Error('Pembagi tidak boleh nol.');
  }

  if (numerator === 0n) return 0n;

  const negative = numerator < 0n !== denominator < 0n;
  const absNumerator = numerator < 0n ? -numerator : numerator;
  const absDenominator = denominator < 0n ? -denominator : denominator;

  const quotient = absNumerator / absDenominator;
  const remainder = absNumerator % absDenominator;

  const rounded = remainder * 2n >= absDenominator ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
}

function normalizeDecimalString(value, fieldName, scale, options = {}) {
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

function computeAmountByPercentage(amountString, percentageString) {
  const amountBig = decimalToScaledBigInt(amountString, MONEY_SCALE);
  const percentageBig = decimalToScaledBigInt(percentageString, SHARE_SCALE);
  const denominator = 10n ** BigInt(SHARE_SCALE) * 100n;
  const result = divideAndRoundHalfUp(amountBig * percentageBig, denominator);
  return scaledBigIntToDecimalString(result, MONEY_SCALE);
}

function sumDecimalStrings(left, right, scale) {
  return scaledBigIntToDecimalString(decimalToScaledBigInt(left, scale) + decimalToScaledBigInt(right, scale), scale);
}

function subtractDecimalStrings(left, right, scale) {
  return scaledBigIntToDecimalString(decimalToScaledBigInt(left, scale) - decimalToScaledBigInt(right, scale), scale);
}

function parseDateOnly(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Field '${fieldName}' harus berupa tanggal yang valid.`);
  }

  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

function parseRequiredDateOnly(value, fieldName) {
  const parsed = parseDateOnly(value, fieldName);
  if (!parsed) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  return parsed;
}

async function ensureAuth(req) {
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

function guardRole(actor, allowedRoles) {
  if (!allowedRoles.has(normRole(actor?.role))) {
    return NextResponse.json({ message: 'Forbidden: Anda tidak memiliki akses ke resource ini.' }, { status: 403 });
  }

  return null;
}

function buildSelect() {
  return {
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
    konsultan: {
      select: {
        id_user: true,
        nama_pengguna: true,
        email: true,
        role: true,
        status_kerja: true,
        deleted_at: true,
      },
    },
    jenis_produk: {
      select: {
        id_jenis_produk_konsultan: true,
        nama_produk: true,
        persen_share_default: true,
        aktif: true,
        deleted_at: true,
      },
    },
  };
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
              not: STATUS_PAYOUT_DRAFT,
            },
          },
        },
      },
    },
  };
}

function enrichTransaksi(data) {
  if (!data) return data;

  const effectivePersenShare = data.persen_share_override ?? data.persen_share_default ?? null;

  return {
    ...data,
    effective_persen_share: effectivePersenShare,
    business_state: {
      periode_terkunci: data.periode_konsultan?.status_periode === STATUS_PERIODE_TERKUNCI,
      periode_deleted: Boolean(data.periode_konsultan?.deleted_at),
      sudah_posting_payroll: Boolean(data.sudah_posting_payroll),
      bisa_diubah: data.periode_konsultan?.status_periode !== STATUS_PERIODE_TERKUNCI && !data.sudah_posting_payroll,
      bisa_dihapus: data.periode_konsultan?.status_periode !== STATUS_PERIODE_TERKUNCI && !data.sudah_posting_payroll,
    },
  };
}

function validateComputedTotals({ nominal_debit, nominal_kredit, total_income, nominal_share, nominal_oss }) {
  const computedTotal = subtractDecimalStrings(nominal_debit, nominal_kredit, MONEY_SCALE);

  if (computedTotal !== total_income) {
    throw new Error("Field 'total_income' harus sama dengan nominal_debit - nominal_kredit.");
  }

  const recomposedTotal = sumDecimalStrings(nominal_share, nominal_oss, MONEY_SCALE);
  if (recomposedTotal !== total_income) {
    throw new Error("Penjumlahan 'nominal_share' dan 'nominal_oss' harus sama dengan 'total_income'.");
  }
}

async function resolveBusinessState(tx, input, existing = null) {
  const id_periode_konsultan = Object.prototype.hasOwnProperty.call(input, 'id_periode_konsultan') ? input.id_periode_konsultan : existing?.id_periode_konsultan;

  if (!id_periode_konsultan) {
    throw new Error("Field 'id_periode_konsultan' wajib diisi.");
  }

  const tanggal_transaksi = Object.prototype.hasOwnProperty.call(input, 'tanggal_transaksi') ? input.tanggal_transaksi : existing?.tanggal_transaksi;

  if (!tanggal_transaksi) {
    throw new Error("Field 'tanggal_transaksi' wajib diisi.");
  }

  const id_user_konsultan = Object.prototype.hasOwnProperty.call(input, 'id_user_konsultan') ? input.id_user_konsultan : (existing?.id_user_konsultan ?? null);

  const id_jenis_produk_konsultan = Object.prototype.hasOwnProperty.call(input, 'id_jenis_produk_konsultan') ? input.id_jenis_produk_konsultan : (existing?.id_jenis_produk_konsultan ?? null);

  const [periode, konsultan, jenisProduk] = await Promise.all([
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
    id_user_konsultan
      ? tx.user.findUnique({
          where: { id_user: id_user_konsultan },
          select: {
            id_user: true,
            nama_pengguna: true,
            email: true,
            role: true,
            status_kerja: true,
            deleted_at: true,
          },
        })
      : Promise.resolve(null),
    id_jenis_produk_konsultan
      ? tx.jenisProdukKonsultan.findUnique({
          where: { id_jenis_produk_konsultan },
          select: {
            id_jenis_produk_konsultan: true,
            nama_produk: true,
            persen_share_default: true,
            aktif: true,
            deleted_at: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (!periode) {
    throw new Error('Periode konsultan tidak ditemukan.');
  }

  if (periode.deleted_at) {
    throw new Error('Periode konsultan yang dipilih sudah dihapus.');
  }

  if (periode.status_periode === STATUS_PERIODE_TERKUNCI) {
    throw new Error('Periode konsultan yang dipilih sudah terkunci.');
  }

  if (id_user_konsultan && !konsultan) {
    throw new Error('User konsultan tidak ditemukan.');
  }

  if (konsultan?.deleted_at) {
    throw new Error('User konsultan yang dipilih sudah dihapus.');
  }

  if (id_jenis_produk_konsultan && !jenisProduk) {
    throw new Error('Jenis produk konsultan tidak ditemukan.');
  }

  if (jenisProduk?.deleted_at) {
    throw new Error('Jenis produk konsultan yang dipilih sudah dihapus.');
  }

  if (jenisProduk && !jenisProduk.aktif) {
    throw new Error('Jenis produk konsultan yang dipilih sedang tidak aktif.');
  }

  const nominal_debit = Object.prototype.hasOwnProperty.call(input, 'nominal_debit') ? input.nominal_debit : existing?.nominal_debit ? String(existing.nominal_debit) : '0.00';

  const nominal_kredit = Object.prototype.hasOwnProperty.call(input, 'nominal_kredit') ? input.nominal_kredit : existing?.nominal_kredit ? String(existing.nominal_kredit) : '0.00';

  const override_manual = Object.prototype.hasOwnProperty.call(input, 'override_manual') ? input.override_manual : (existing?.override_manual ?? false);

  const didJenisProdukChange = existing && Object.prototype.hasOwnProperty.call(input, 'id_jenis_produk_konsultan') && input.id_jenis_produk_konsultan !== (existing.id_jenis_produk_konsultan ?? null);

  const persenShareDefaultFromJenisProduk = didJenisProdukChange || !existing ? (jenisProduk?.persen_share_default !== undefined && jenisProduk?.persen_share_default !== null ? String(jenisProduk.persen_share_default) : null) : undefined;

  const persen_share_default = Object.prototype.hasOwnProperty.call(input, 'persen_share_default')
    ? input.persen_share_default
    : persenShareDefaultFromJenisProduk !== undefined
      ? persenShareDefaultFromJenisProduk
      : existing?.persen_share_default !== undefined && existing?.persen_share_default !== null
        ? String(existing.persen_share_default)
        : jenisProduk?.persen_share_default !== undefined && jenisProduk?.persen_share_default !== null
          ? String(jenisProduk.persen_share_default)
          : null;

  const persen_share_override = Object.prototype.hasOwnProperty.call(input, 'persen_share_override')
    ? input.persen_share_override
    : existing?.persen_share_override !== undefined && existing?.persen_share_override !== null
      ? String(existing.persen_share_override)
      : null;

  const total_income = subtractDecimalStrings(nominal_debit, nominal_kredit, MONEY_SCALE);
  const effectivePersenShare = persen_share_override ?? persen_share_default ?? '0.0000';

  let nominal_share;
  let nominal_oss;

  if (override_manual) {
    const manualNominalShare = Object.prototype.hasOwnProperty.call(input, 'nominal_share') ? input.nominal_share : existing?.nominal_share !== undefined && existing?.nominal_share !== null ? String(existing.nominal_share) : undefined;

    const manualNominalOss = Object.prototype.hasOwnProperty.call(input, 'nominal_oss') ? input.nominal_oss : existing?.nominal_oss !== undefined && existing?.nominal_oss !== null ? String(existing.nominal_oss) : undefined;

    if (manualNominalShare !== undefined && manualNominalOss !== undefined) {
      nominal_share = manualNominalShare;
      nominal_oss = manualNominalOss;
    } else if (manualNominalShare !== undefined) {
      nominal_share = manualNominalShare;
      nominal_oss = subtractDecimalStrings(total_income, nominal_share, MONEY_SCALE);
    } else if (manualNominalOss !== undefined) {
      nominal_oss = manualNominalOss;
      nominal_share = subtractDecimalStrings(total_income, nominal_oss, MONEY_SCALE);
    } else {
      nominal_share = computeAmountByPercentage(total_income, effectivePersenShare);
      nominal_oss = subtractDecimalStrings(total_income, nominal_share, MONEY_SCALE);
    }
  } else {
    nominal_share = computeAmountByPercentage(total_income, effectivePersenShare);
    nominal_oss = subtractDecimalStrings(total_income, nominal_share, MONEY_SCALE);
  }

  validateComputedTotals({
    nominal_debit,
    nominal_kredit,
    total_income,
    nominal_share,
    nominal_oss,
  });

  return {
    relationState: {
      periode,
      konsultan,
      jenisProduk,
    },
    payload: {
      id_periode_konsultan,
      id_user_konsultan,
      id_jenis_produk_konsultan,
      tanggal_transaksi,
      nominal_debit,
      nominal_kredit,
      total_income,
      persen_share_default,
      persen_share_override,
      nominal_share,
      nominal_oss,
      override_manual,
    },
    computed: {
      effectivePersenShare,
    },
  };
}

export async function GET(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1), 100);

    const search = (searchParams.get('search') || '').trim();
    const id_periode_konsultan = (searchParams.get('id_periode_konsultan') || '').trim();
    const id_user_konsultan = (searchParams.get('id_user_konsultan') || '').trim();
    const id_jenis_produk_konsultan = (searchParams.get('id_jenis_produk_konsultan') || '').trim();

    const tanggalFrom = parseDateOnly(searchParams.get('tanggalFrom'), 'tanggalFrom');
    const tanggalTo = parseDateOnly(searchParams.get('tanggalTo'), 'tanggalTo');

    if (tanggalFrom && tanggalTo && tanggalTo < tanggalFrom) {
      return NextResponse.json({ message: "Parameter 'tanggalTo' tidak boleh lebih kecil dari 'tanggalFrom'." }, { status: 400 });
    }

    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());
    const deletedOnly = ['1', 'true'].includes((searchParams.get('deletedOnly') || '').toLowerCase());
    const includeCarryForwardDitahan = ['1', 'true'].includes((searchParams.get('include_carry_forward_ditahan') || '').toLowerCase());

    const orderByParam = (searchParams.get('orderBy') || 'tanggal_transaksi').trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam) ? orderByParam : 'tanggal_transaksi';
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let override_manual;
    if (searchParams.get('override_manual') !== null && searchParams.get('override_manual') !== '') {
      override_manual = normalizeBoolean(searchParams.get('override_manual'), 'override_manual');
    }

    let sudah_posting_payroll;
    if (searchParams.get('sudah_posting_payroll') !== null && searchParams.get('sudah_posting_payroll') !== '') {
      sudah_posting_payroll = normalizeBoolean(searchParams.get('sudah_posting_payroll'), 'sudah_posting_payroll');
    }

    const andFilters = [];

    if (deletedOnly) {
      andFilters.push({ deleted_at: { not: null } });
    } else if (!includeDeleted) {
      andFilters.push({ deleted_at: null });
    }

    let targetPeriode = null;
    if (includeCarryForwardDitahan && id_periode_konsultan) {
      targetPeriode = await db.periodeKonsultan.findUnique({
        where: { id_periode_konsultan },
        select: {
          id_periode_konsultan: true,
          tanggal_mulai: true,
        },
      });
    }

    if (id_periode_konsultan) {
      const carryForwardWhere = includeCarryForwardDitahan
        ? buildCarryForwardDitahanWhere(targetPeriode)
        : null;

      andFilters.push(
        carryForwardWhere
          ? {
              OR: [
                { id_periode_konsultan },
                carryForwardWhere,
              ],
            }
          : { id_periode_konsultan },
      );
    }

    if (id_user_konsultan) {
      andFilters.push({ id_user_konsultan });
    }

    if (id_jenis_produk_konsultan) {
      andFilters.push({ id_jenis_produk_konsultan });
    }

    if (tanggalFrom || tanggalTo) {
      andFilters.push({
        tanggal_transaksi: {
          ...(tanggalFrom ? { gte: tanggalFrom } : {}),
          ...(tanggalTo ? { lte: tanggalTo } : {}),
        },
      });
    }

    if (typeof override_manual === 'boolean') {
      andFilters.push({ override_manual });
    }

    if (typeof sudah_posting_payroll === 'boolean') {
      andFilters.push({ sudah_posting_payroll });
    }

    if (search) {
      andFilters.push({
        OR: [
          { nama_klien: { contains: search } },
          { deskripsi: { contains: search } },
          { catatan: { contains: search } },
          { konsultan: { is: { nama_pengguna: { contains: search } } } },
          { jenis_produk: { is: { nama_produk: { contains: search } } } },
        ],
      });
    }

    const where = andFilters.length ? { AND: andFilters } : {};

    const [total, data] = await Promise.all([
      db.transaksiKonsultan.count({ where }),
      db.transaksiKonsultan.findMany({
        where,
        orderBy: { [orderBy]: sort },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: buildSelect(),
      }),
    ]);

    return NextResponse.json({
      data: data.map(enrichTransaksi),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('boolean') || err.message.includes('desimal') || err.message.includes('tanggal')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('GET /api/admin/transaksi-konsultan error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, CREATE_ROLES);
  if (forbidden) return forbidden;

  try {
    const body = await req.json();

    const sanitizedInput = {
      id_periode_konsultan: normalizeRequiredString(body?.id_periode_konsultan, 'id_periode_konsultan'),
      id_user_konsultan: normalizeOptionalId(body?.id_user_konsultan, 'id_user_konsultan'),
      id_jenis_produk_konsultan: normalizeOptionalId(body?.id_jenis_produk_konsultan, 'id_jenis_produk_konsultan'),
      tanggal_transaksi: parseRequiredDateOnly(body?.tanggal_transaksi, 'tanggal_transaksi'),
      nama_klien: normalizeNullableString(body?.nama_klien, 'nama_klien', 255),
      deskripsi: normalizeNullableString(body?.deskripsi, 'deskripsi'),
      nominal_debit: body?.nominal_debit === undefined ? '0.00' : normalizeDecimalString(body?.nominal_debit, 'nominal_debit', MONEY_SCALE, { min: '0' }),
      nominal_kredit: body?.nominal_kredit === undefined ? '0.00' : normalizeDecimalString(body?.nominal_kredit, 'nominal_kredit', MONEY_SCALE, { min: '0' }),
      persen_share_default: body?.persen_share_default === undefined ? undefined : normalizeDecimalString(body?.persen_share_default, 'persen_share_default', SHARE_SCALE, { allowNull: true, min: '0', max: '100' }),
      persen_share_override: body?.persen_share_override === undefined ? undefined : normalizeDecimalString(body?.persen_share_override, 'persen_share_override', SHARE_SCALE, { allowNull: true, min: '0', max: '100' }),
      override_manual: body?.override_manual === undefined ? false : normalizeBoolean(body?.override_manual, 'override_manual'),
      nominal_share: body?.nominal_share === undefined ? undefined : normalizeDecimalString(body?.nominal_share, 'nominal_share', MONEY_SCALE),
      nominal_oss: body?.nominal_oss === undefined ? undefined : normalizeDecimalString(body?.nominal_oss, 'nominal_oss', MONEY_SCALE),
      sudah_posting_payroll: body?.sudah_posting_payroll === undefined ? false : normalizeBoolean(body?.sudah_posting_payroll, 'sudah_posting_payroll'),
      catatan: normalizeNullableString(body?.catatan, 'catatan'),
    };

    if (sanitizedInput.sudah_posting_payroll) {
      return NextResponse.json(
        {
          message: "Field 'sudah_posting_payroll' tidak boleh di-set true saat create. Status ini hanya berubah lewat proses posting payroll.",
        },
        { status: 400 },
      );
    }

    const created = await db.$transaction(async (tx) => {
      const resolved = await resolveBusinessState(tx, sanitizedInput);

      const record = await tx.transaksiKonsultan.create({
        data: {
          ...resolved.payload,
          nama_klien: sanitizedInput.nama_klien,
          deskripsi: sanitizedInput.deskripsi,
          sudah_posting_payroll: false,
          catatan: sanitizedInput.catatan,
          deleted_at: null,
        },
        select: buildSelect(),
      });

      return enrichTransaksi(record);
    });

    return NextResponse.json(
      {
        message: 'Transaksi konsultan berhasil dibuat.',
        data: created,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ message: 'Payload JSON tidak valid.' }, { status: 400 });
    }

    if (err instanceof Error) {
      if (
        err.message.startsWith('Field ') ||
        err.message.includes('tidak ditemukan') ||
        err.message.includes('dihapus') ||
        err.message.includes('terkunci') ||
        err.message.includes('aktif') ||
        err.message.includes('desimal') ||
        err.message.includes('boolean') ||
        err.message.includes('tanggal') ||
        err.message.includes('manual')
      ) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('POST /api/admin/transaksi-konsultan error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
