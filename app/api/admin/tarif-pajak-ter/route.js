import { NextResponse } from 'next/server';

import { authenticateRequest } from '../../../../app/utils/auth/authUtils';
import { normalizeKodeKategoriPajak } from '../../../../helpers/kodeKategoriPajak';
import { verifyAuthToken } from '../../../../lib/jwt';
import db from '../../../../lib/prisma';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const CREATE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'kode_kategori_pajak', 'penghasilan_dari', 'penghasilan_sampai', 'persen_tarif', 'berlaku_mulai', 'berlaku_sampai']);

const INCOME_SCALE = 2;
const PERCENT_SCALE = 4;

const normRole = (role) =>
  String(role || '')
    .trim()
    .toUpperCase();

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

function buildSelect() {
  return {
    id_tarif_pajak_ter: true,
    kode_kategori_pajak: true,
    penghasilan_dari: true,
    penghasilan_sampai: true,
    persen_tarif: true,
    berlaku_mulai: true,
    berlaku_sampai: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  };
}

function periodsOverlap(startA, endA, startB, endB) {
  const aStart = startA.getTime();
  const bStart = startB.getTime();
  const aEnd = endA ? endA.getTime() : Number.POSITIVE_INFINITY;
  const bEnd = endB ? endB.getTime() : Number.POSITIVE_INFINITY;

  return aStart <= bEnd && bStart <= aEnd;
}

function incomeRangesOverlap(fromA, untilA, fromB, untilB) {
  const leftOk = untilA === null ? true : fromB <= untilA;
  const rightOk = untilB === null ? true : fromA <= untilB;
  return leftOk && rightOk;
}

function buildPeriodOverlapWhere(berlaku_mulai, berlaku_sampai, excludeId) {
  return {
    deleted_at: null,
    ...(excludeId
      ? {
          NOT: {
            id_tarif_pajak_ter: excludeId,
          },
        }
      : {}),
    ...(berlaku_sampai === null
      ? {
          OR: [{ berlaku_sampai: null }, { berlaku_sampai: { gte: berlaku_mulai } }],
        }
      : {
          AND: [
            { berlaku_mulai: { lte: berlaku_sampai } },
            {
              OR: [{ berlaku_sampai: null }, { berlaku_sampai: { gte: berlaku_mulai } }],
            },
          ],
        }),
  };
}

async function ensureNoConflict({ kode_kategori_pajak, penghasilan_dari, penghasilan_sampai, berlaku_mulai, berlaku_sampai, excludeId = null }) {
  const candidates = await db.tarifPajakTER.findMany({
    where: {
      kode_kategori_pajak,
      ...buildPeriodOverlapWhere(berlaku_mulai, berlaku_sampai, excludeId),
    },
    select: {
      id_tarif_pajak_ter: true,
      kode_kategori_pajak: true,
      penghasilan_dari: true,
      penghasilan_sampai: true,
      berlaku_mulai: true,
      berlaku_sampai: true,
    },
  });

  const nextFrom = decimalToScaledBigInt(penghasilan_dari, INCOME_SCALE);
  const nextUntil = penghasilan_sampai === null ? null : decimalToScaledBigInt(penghasilan_sampai, INCOME_SCALE);

  const conflict = candidates.find((item) => {
    const currentFrom = decimalToScaledBigInt(item.penghasilan_dari, INCOME_SCALE);
    const currentUntil = item.penghasilan_sampai === null ? null : decimalToScaledBigInt(item.penghasilan_sampai, INCOME_SCALE);

    return periodsOverlap(berlaku_mulai, berlaku_sampai, item.berlaku_mulai, item.berlaku_sampai) && incomeRangesOverlap(nextFrom, nextUntil, currentFrom, currentUntil);
  });

  if (conflict) {
    throw new Error('Tarif pajak TER bentrok dengan data lain pada kode kategori pajak, periode berlaku, dan rentang penghasilan yang saling overlap.');
  }
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

export async function GET(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1), 100);

    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());
    const deletedOnly = ['1', 'true'].includes((searchParams.get('deletedOnly') || '').toLowerCase());

    const kodeKategoriPajakRaw = searchParams.get('kode_kategori_pajak') ?? searchParams.get('kategori_ter');
    const kode_kategori_pajak = kodeKategoriPajakRaw ? normalizeKodeKategoriPajak(kodeKategoriPajakRaw) : undefined;

    const orderByParam = (searchParams.get('orderBy') || 'created_at').trim();
    const normalizedOrderBy = orderByParam === 'kategori_ter' ? 'kode_kategori_pajak' : orderByParam;
    const orderBy = ALLOWED_ORDER_BY.has(normalizedOrderBy) ? normalizedOrderBy : 'created_at';
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const berlakuMulaiFrom = parseDateOnly(searchParams.get('berlakuMulaiFrom'), 'berlakuMulaiFrom');
    const berlakuMulaiTo = parseDateOnly(searchParams.get('berlakuMulaiTo'), 'berlakuMulaiTo');
    const berlakuSampaiFrom = parseDateOnly(searchParams.get('berlakuSampaiFrom'), 'berlakuSampaiFrom');
    const berlakuSampaiTo = parseDateOnly(searchParams.get('berlakuSampaiTo'), 'berlakuSampaiTo');
    const aktifPada = parseDateOnly(searchParams.get('aktifPada'), 'aktifPada');
    const penghasilan = searchParams.get('penghasilan') ? normalizeDecimalString(searchParams.get('penghasilan'), 'penghasilan', INCOME_SCALE, { min: '0' }) : undefined;

    if (berlakuMulaiFrom && berlakuMulaiTo && berlakuMulaiFrom > berlakuMulaiTo) {
      return NextResponse.json({ message: 'Parameter berlakuMulaiFrom tidak boleh lebih besar dari berlakuMulaiTo.' }, { status: 400 });
    }

    if (berlakuSampaiFrom && berlakuSampaiTo && berlakuSampaiFrom > berlakuSampaiTo) {
      return NextResponse.json({ message: 'Parameter berlakuSampaiFrom tidak boleh lebih besar dari berlakuSampaiTo.' }, { status: 400 });
    }

    const andConditions = [];

    if (aktifPada) {
      andConditions.push(
        { berlaku_mulai: { lte: aktifPada } },
        {
          OR: [{ berlaku_sampai: null }, { berlaku_sampai: { gte: aktifPada } }],
        },
      );
    }

    if (penghasilan) {
      andConditions.push(
        { penghasilan_dari: { lte: penghasilan } },
        {
          OR: [{ penghasilan_sampai: null }, { penghasilan_sampai: { gte: penghasilan } }],
        },
      );
    }

    const where = {
      ...(deletedOnly ? { deleted_at: { not: null } } : {}),
      ...(!includeDeleted && !deletedOnly ? { deleted_at: null } : {}),
      ...(kode_kategori_pajak ? { kode_kategori_pajak } : {}),
      ...(berlakuMulaiFrom || berlakuMulaiTo
        ? {
            berlaku_mulai: {
              ...(berlakuMulaiFrom ? { gte: berlakuMulaiFrom } : {}),
              ...(berlakuMulaiTo ? { lte: berlakuMulaiTo } : {}),
            },
          }
        : {}),
      ...(berlakuSampaiFrom || berlakuSampaiTo
        ? {
            berlaku_sampai: {
              ...(berlakuSampaiFrom ? { gte: berlakuSampaiFrom } : {}),
              ...(berlakuSampaiTo ? { lte: berlakuSampaiTo } : {}),
            },
          }
        : {}),
      ...(andConditions.length ? { AND: andConditions } : {}),
    };

    const [total, data] = await Promise.all([
      db.tarifPajakTER.count({ where }),
      db.tarifPajakTER.findMany({
        where,
        orderBy: { [orderBy]: sort },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: buildSelect(),
      }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('kode_kategori_pajak')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('GET /api/admin/tarif-pajak-ter error:', err);
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

    const kode_kategori_pajak = normalizeKodeKategoriPajak(body?.kode_kategori_pajak ?? body?.kategori_ter);
    const penghasilan_dari = normalizeDecimalString(body?.penghasilan_dari, 'penghasilan_dari', INCOME_SCALE, { min: '0' });
    const penghasilan_sampai = normalizeDecimalString(body?.penghasilan_sampai, 'penghasilan_sampai', INCOME_SCALE, { allowNull: true, min: '0' });
    const persen_tarif = normalizeDecimalString(body?.persen_tarif, 'persen_tarif', PERCENT_SCALE, { min: '0', max: '100' });
    const berlaku_mulai = parseRequiredDateOnly(body?.berlaku_mulai, 'berlaku_mulai');
    const berlaku_sampai = parseDateOnly(body?.berlaku_sampai, 'berlaku_sampai');

    const fromIncome = decimalToScaledBigInt(penghasilan_dari, INCOME_SCALE);
    const untilIncome = penghasilan_sampai === null ? null : decimalToScaledBigInt(penghasilan_sampai, INCOME_SCALE);

    if (untilIncome !== null && untilIncome < fromIncome) {
      return NextResponse.json({ message: "Field 'penghasilan_sampai' tidak boleh lebih kecil dari 'penghasilan_dari'." }, { status: 400 });
    }

    if (berlaku_sampai && berlaku_sampai < berlaku_mulai) {
      return NextResponse.json({ message: "Field 'berlaku_sampai' tidak boleh lebih kecil dari 'berlaku_mulai'." }, { status: 400 });
    }

    await ensureNoConflict({
      kode_kategori_pajak,
      penghasilan_dari,
      penghasilan_sampai,
      berlaku_mulai,
      berlaku_sampai,
      excludeId: null,
    });

    const created = await db.tarifPajakTER.create({
      data: {
        kode_kategori_pajak,
        penghasilan_dari,
        penghasilan_sampai,
        persen_tarif,
        berlaku_mulai,
        berlaku_sampai,
      },
      select: buildSelect(),
    });

    return NextResponse.json({ message: 'Tarif pajak TER berhasil dibuat.', data: created }, { status: 201 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('kode_kategori_pajak') || err.message.includes('bentrok')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('POST /api/admin/tarif-pajak-ter error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
