import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const EDIT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const DELETE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const STATUS_PERIODE_TERKUNCI = 'TERKUNCI';

const MONEY_SCALE = 2;
const SHARE_SCALE = 4;

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

function toDateOnlyComparable(value) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())).getTime();
}

function isDateWithinRange(targetDate, startDate, endDate) {
  const target = toDateOnlyComparable(targetDate);
  return target >= toDateOnlyComparable(startDate) && target <= toDateOnlyComparable(endDate);
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

  if (decimalToScaledBigInt(computedTotal, MONEY_SCALE) < 0n) {
    throw new Error("Nilai 'nominal_kredit' tidak boleh lebih besar dari 'nominal_debit'.");
  }

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

  if (!isDateWithinRange(tanggal_transaksi, periode.tanggal_mulai, periode.tanggal_selesai)) {
    throw new Error("Field 'tanggal_transaksi' harus berada di dalam rentang tanggal periode konsultan.");
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
    if (Object.prototype.hasOwnProperty.call(input, 'nominal_share') || Object.prototype.hasOwnProperty.call(input, 'nominal_oss')) {
      throw new Error("Field 'nominal_share' dan 'nominal_oss' hanya boleh dikirim saat 'override_manual' bernilai true.");
    }

    nominal_share = computeAmountByPercentage(total_income, effectivePersenShare);
    nominal_oss = subtractDecimalStrings(total_income, nominal_share, MONEY_SCALE);
  }

  if (decimalToScaledBigInt(nominal_share, MONEY_SCALE) < 0n) {
    throw new Error("Field 'nominal_share' tidak boleh bernilai negatif.");
  }

  if (decimalToScaledBigInt(nominal_oss, MONEY_SCALE) < 0n) {
    throw new Error("Field 'nominal_oss' tidak boleh bernilai negatif.");
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

async function getExistingTransaksi(id) {
  return db.transaksiKonsultan.findUnique({
    where: { id_transaksi_konsultan: id },
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
    },
  });
}

function ensureMutable(existing) {
  if (existing.sudah_posting_payroll) {
    throw new Error('Transaksi konsultan sudah diposting ke payroll dan tidak boleh diubah atau dihapus.');
  }

  if (existing.periode_konsultan?.deleted_at) {
    throw new Error('Periode konsultan untuk transaksi ini sudah dihapus.');
  }

  if (existing.periode_konsultan?.status_periode === STATUS_PERIODE_TERKUNCI) {
    throw new Error('Periode konsultan untuk transaksi ini sudah terkunci.');
  }
}

export async function GET(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;

    const data = await db.transaksiKonsultan.findUnique({
      where: { id_transaksi_konsultan: id },
      select: buildSelect(),
    });

    if (!data) {
      return NextResponse.json({ message: 'Transaksi konsultan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data: enrichTransaksi(data) });
  } catch (err) {
    console.error('GET /api/admin/transaksi-konsultan/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, EDIT_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;
    const body = await req.json();

    const existing = await getExistingTransaksi(id);

    if (!existing) {
      return NextResponse.json({ message: 'Transaksi konsultan tidak ditemukan.' }, { status: 404 });
    }

    ensureMutable(existing);

    const payload = {};

    if (body?.id_periode_konsultan !== undefined) {
      payload.id_periode_konsultan = normalizeRequiredString(body?.id_periode_konsultan, 'id_periode_konsultan');
    }

    if (body?.id_user_konsultan !== undefined) {
      payload.id_user_konsultan = normalizeOptionalId(body?.id_user_konsultan, 'id_user_konsultan');
    }

    if (body?.id_jenis_produk_konsultan !== undefined) {
      payload.id_jenis_produk_konsultan = normalizeOptionalId(body?.id_jenis_produk_konsultan, 'id_jenis_produk_konsultan');
    }

    if (body?.tanggal_transaksi !== undefined) {
      payload.tanggal_transaksi = parseDateOnly(body?.tanggal_transaksi, 'tanggal_transaksi');
      if (!payload.tanggal_transaksi) {
        return NextResponse.json({ message: "Field 'tanggal_transaksi' tidak boleh kosong." }, { status: 400 });
      }
    }

    if (body?.nama_klien !== undefined) {
      payload.nama_klien = normalizeNullableString(body?.nama_klien, 'nama_klien', 255);
    }

    if (body?.deskripsi !== undefined) {
      payload.deskripsi = normalizeNullableString(body?.deskripsi, 'deskripsi');
    }

    if (body?.nominal_debit !== undefined) {
      payload.nominal_debit = normalizeDecimalString(body?.nominal_debit, 'nominal_debit', MONEY_SCALE, { min: '0' });
    }

    if (body?.nominal_kredit !== undefined) {
      payload.nominal_kredit = normalizeDecimalString(body?.nominal_kredit, 'nominal_kredit', MONEY_SCALE, { min: '0' });
    }

    if (body?.persen_share_default !== undefined) {
      payload.persen_share_default = normalizeDecimalString(body?.persen_share_default, 'persen_share_default', SHARE_SCALE, { allowNull: true, min: '0', max: '100' });
    }

    if (body?.persen_share_override !== undefined) {
      payload.persen_share_override = normalizeDecimalString(body?.persen_share_override, 'persen_share_override', SHARE_SCALE, { allowNull: true, min: '0', max: '100' });
    }

    if (body?.override_manual !== undefined) {
      payload.override_manual = normalizeBoolean(body?.override_manual, 'override_manual');
    }

    if (body?.nominal_share !== undefined) {
      payload.nominal_share = normalizeDecimalString(body?.nominal_share, 'nominal_share', MONEY_SCALE, { min: '0' });
    }

    if (body?.nominal_oss !== undefined) {
      payload.nominal_oss = normalizeDecimalString(body?.nominal_oss, 'nominal_oss', MONEY_SCALE, { min: '0' });
    }

    if (body?.sudah_posting_payroll !== undefined) {
      const nextPostingState = normalizeBoolean(body?.sudah_posting_payroll, 'sudah_posting_payroll');
      if (nextPostingState !== existing.sudah_posting_payroll) {
        return NextResponse.json(
          {
            message: "Field 'sudah_posting_payroll' tidak boleh diubah dari endpoint CRUD ini. Gunakan proses bisnis posting payroll.",
          },
          { status: 400 },
        );
      }
    }

    if (body?.catatan !== undefined) {
      payload.catatan = normalizeNullableString(body?.catatan, 'catatan');
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ message: 'Tidak ada field yang dikirim untuk diperbarui.' }, { status: 400 });
    }

    const updated = await db.$transaction(async (tx) => {
      const resolved = await resolveBusinessState(tx, payload, existing);

      const record = await tx.transaksiKonsultan.update({
        where: { id_transaksi_konsultan: id },
        data: {
          ...resolved.payload,
          ...(Object.prototype.hasOwnProperty.call(payload, 'nama_klien') ? { nama_klien: payload.nama_klien } : {}),
          ...(Object.prototype.hasOwnProperty.call(payload, 'deskripsi') ? { deskripsi: payload.deskripsi } : {}),
          ...(Object.prototype.hasOwnProperty.call(payload, 'catatan') ? { catatan: payload.catatan } : {}),
        },
        select: buildSelect(),
      });

      return enrichTransaksi(record);
    });

    return NextResponse.json({
      message: 'Transaksi konsultan berhasil diperbarui.',
      data: updated,
    });
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
        err.message.includes('manual') ||
        err.message.includes('diposting')
      ) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('PUT /api/admin/transaksi-konsultan/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, DELETE_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);

    const isHardDelete = ['1', 'true'].includes((searchParams.get('hard') || '').toLowerCase());
    const isForceDelete = ['1', 'true'].includes((searchParams.get('force') || '').toLowerCase());
    const hardDelete = isHardDelete || isForceDelete;

    const existing = await getExistingTransaksi(id);

    if (!existing) {
      return NextResponse.json({ message: 'Transaksi konsultan tidak ditemukan.' }, { status: 404 });
    }

    ensureMutable(existing);

    if (!hardDelete) {
      if (existing.deleted_at) {
        return NextResponse.json(
          {
            message: 'Transaksi konsultan sudah dihapus sebelumnya.',
            mode: 'soft',
          },
          { status: 409 },
        );
      }

      const deleted = await db.transaksiKonsultan.update({
        where: { id_transaksi_konsultan: id },
        data: { deleted_at: new Date() },
        select: buildSelect(),
      });

      return NextResponse.json({
        message: 'Transaksi konsultan berhasil dihapus (soft delete).',
        mode: 'soft',
        data: enrichTransaksi(deleted),
      });
    }

    await db.transaksiKonsultan.delete({
      where: { id_transaksi_konsultan: id },
    });

    return NextResponse.json({
      message: 'Transaksi konsultan berhasil dihapus permanen.',
      mode: 'hard',
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('diposting') || err.message.includes('terkunci') || err.message.includes('dihapus')) {
        return NextResponse.json({ message: err.message }, { status: 409 });
      }
    }

    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Transaksi konsultan tidak ditemukan.' }, { status: 404 });
    }

    console.error('DELETE /api/admin/transaksi-konsultan/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
