import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const CREATE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'nama_produk', 'persen_share_default', 'aktif']);

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
    id_jenis_produk_konsultan: true,
    nama_produk: true,
    persen_share_default: true,
    aktif: true,
    catatan: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    _count: {
      select: {
        transaksi_konsultan: true,
      },
    },
  };
}

function getCreateConflictMessage(conflict) {
  if (conflict.nama_produk) {
    return 'Jenis produk konsultan dengan nama tersebut sudah ada.';
  }

  return 'Jenis produk konsultan sudah ada.';
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
    const nama_produk = (searchParams.get('nama_produk') || '').trim();
    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());
    const deletedOnly = ['1', 'true'].includes((searchParams.get('deletedOnly') || '').toLowerCase());

    const orderByParam = (searchParams.get('orderBy') || 'created_at').trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam) ? orderByParam : 'created_at';
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let aktif;
    if (searchParams.get('aktif') !== null && searchParams.get('aktif') !== '') {
      aktif = normalizeBoolean(searchParams.get('aktif'), 'aktif');
    }

    const where = {
      ...(deletedOnly ? { deleted_at: { not: null } } : {}),
      ...(!includeDeleted && !deletedOnly ? { deleted_at: null } : {}),
      ...(nama_produk ? { nama_produk: { contains: nama_produk } } : {}),
      ...(typeof aktif === 'boolean' ? { aktif } : {}),
      ...(search
        ? {
            OR: [{ nama_produk: { contains: search } }, { catatan: { contains: search } }],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      db.jenisProdukKonsultan.count({ where }),
      db.jenisProdukKonsultan.findMany({
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
      if (err.message.startsWith('Field ') || err.message.includes('boolean')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('GET /api/admin/produk-konsultan error:', err);
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

    const nama_produk = normalizeRequiredString(body?.nama_produk, 'nama_produk', 255);
    const persen_share_default = normalizeDecimalString(body?.persen_share_default, 'persen_share_default', SHARE_SCALE, { allowNull: true, min: '0', max: '100' });
    const aktif = body?.aktif === undefined ? true : normalizeBoolean(body?.aktif, 'aktif');
    const catatan = normalizeNullableString(body?.catatan, 'catatan');

    const conflicts = await db.jenisProdukKonsultan.findMany({
      where: {
        nama_produk,
      },
      select: {
        id_jenis_produk_konsultan: true,
        nama_produk: true,
        deleted_at: true,
      },
    });

    const activeConflict = conflicts.find((item) => item.deleted_at === null);
    if (activeConflict) {
      return NextResponse.json({ message: getCreateConflictMessage(activeConflict) }, { status: 409 });
    }

    const softConflictIds = [...new Set(conflicts.map((item) => item.id_jenis_produk_konsultan))];

    const payload = {
      nama_produk,
      persen_share_default,
      aktif,
      catatan,
      deleted_at: null,
    };

    if (softConflictIds.length > 1) {
      return NextResponse.json(
        {
          message: 'Tidak bisa auto-restore karena ditemukan lebih dari satu data soft delete dengan nama produk yang sama. Hapus permanen atau perbarui salah satu data lama terlebih dahulu.',
        },
        { status: 409 },
      );
    }

    if (softConflictIds.length === 1) {
      const restored = await db.jenisProdukKonsultan.update({
        where: { id_jenis_produk_konsultan: softConflictIds[0] },
        data: payload,
        select: buildSelect(),
      });

      return NextResponse.json(
        {
          message: 'Jenis produk konsultan berhasil dipulihkan dan diperbarui.',
          data: restored,
        },
        { status: 200 },
      );
    }

    const created = await db.jenisProdukKonsultan.create({
      data: payload,
      select: buildSelect(),
    });

    return NextResponse.json({ message: 'Jenis produk konsultan berhasil dibuat.', data: created }, { status: 201 });
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Nama produk sudah digunakan oleh data lain.' }, { status: 409 });
    }

    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('desimal') || err.message.includes('karakter') || err.message.includes('boolean')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('POST /api/admin/produk-konsultan error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
