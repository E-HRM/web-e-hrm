import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const CREATE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const ARAH_KOMPONEN_VALUES = new Set(['PEMASUKAN', 'POTONGAN']);

const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'nama_tipe_komponen', 'nama_komponen', 'arah_komponen', 'berulang_default', 'aktif']);

const normRole = (role) =>
  String(role || '')
    .trim()
    .toUpperCase();

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

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

function normalizeEnum(value, allowedValues, fieldName) {
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

async function ensureTipeKomponenPayrollExists(id_tipe_komponen_payroll) {
  const tipeKomponen = await db.tipeKomponenPayroll.findUnique({
    where: { id_tipe_komponen_payroll },
    select: {
      id_tipe_komponen_payroll: true,
      nama_tipe_komponen: true,
      deleted_at: true,
    },
  });

  if (!tipeKomponen) {
    throw createHttpError(404, 'Tipe komponen payroll tidak ditemukan.');
  }

  if (tipeKomponen.deleted_at) {
    throw createHttpError(400, 'Tipe komponen payroll yang dipilih sudah dihapus.');
  }

  return tipeKomponen;
}

function buildSelect() {
  return {
    id_definisi_komponen_payroll: true,
    id_tipe_komponen_payroll: true,
    nama_komponen: true,
    arah_komponen: true,
    berulang_default: true,
    aktif: true,
    catatan: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    tipe_komponen: {
      select: {
        id_tipe_komponen_payroll: true,
        nama_tipe_komponen: true,
        deleted_at: true,
      },
    },
    _count: {
      select: {
        item_payroll: true,
      },
    },
  };
}

function buildOrderBy(orderBy, sort) {
  if (orderBy === 'nama_tipe_komponen') {
    return {
      tipe_komponen: {
        nama_tipe_komponen: sort,
      },
    };
  }

  return { [orderBy]: sort };
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
    const id_tipe_komponen_payroll = (searchParams.get('id_tipe_komponen_payroll') || '').trim();
    const nama_tipe_komponen = (searchParams.get('nama_tipe_komponen') || '').trim();

    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());
    const deletedOnly = ['1', 'true'].includes((searchParams.get('deletedOnly') || '').toLowerCase());

    const arah_komponen = searchParams.get('arah_komponen') ? normalizeEnum(searchParams.get('arah_komponen'), ARAH_KOMPONEN_VALUES, 'arah_komponen') : undefined;

    const orderByParam = (searchParams.get('orderBy') || 'created_at').trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam) ? orderByParam : 'created_at';
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let aktif;
    if (searchParams.get('aktif') !== null && searchParams.get('aktif') !== '') {
      aktif = normalizeBoolean(searchParams.get('aktif'), 'aktif');
    }

    let berulang_default;
    if (searchParams.get('berulang_default') !== null && searchParams.get('berulang_default') !== '') {
      berulang_default = normalizeBoolean(searchParams.get('berulang_default'), 'berulang_default');
    }

    const where = {
      ...(deletedOnly ? { deleted_at: { not: null } } : {}),
      ...(!includeDeleted && !deletedOnly ? { deleted_at: null } : {}),
      ...(id_tipe_komponen_payroll ? { id_tipe_komponen_payroll } : {}),
      ...(nama_tipe_komponen
        ? {
            tipe_komponen: {
              is: {
                nama_tipe_komponen: { contains: nama_tipe_komponen },
              },
            },
          }
        : {}),
      ...(arah_komponen ? { arah_komponen } : {}),
      ...(typeof aktif === 'boolean' ? { aktif } : {}),
      ...(typeof berulang_default === 'boolean' ? { berulang_default } : {}),
      ...(search
        ? {
            OR: [
              { nama_komponen: { contains: search } },
              { catatan: { contains: search } },
              {
                tipe_komponen: {
                  is: {
                    nama_tipe_komponen: { contains: search },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      db.definisiKomponenPayroll.count({ where }),
      db.definisiKomponenPayroll.findMany({
        where,
        orderBy: buildOrderBy(orderBy, sort),
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
    if (err?.statusCode) {
      return NextResponse.json({ message: err.message }, { status: err.statusCode });
    }

    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('tidak valid') || err.message.includes('boolean')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('GET /api/admin/definisi-komponen-payroll error:', err);
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

    const id_tipe_komponen_payroll = normalizeRequiredString(body?.id_tipe_komponen_payroll, 'id_tipe_komponen_payroll', 36);
    await ensureTipeKomponenPayrollExists(id_tipe_komponen_payroll);

    const nama_komponen = normalizeRequiredString(body?.nama_komponen, 'nama_komponen', 255);
    const arah_komponen = normalizeEnum(body?.arah_komponen, ARAH_KOMPONEN_VALUES, 'arah_komponen');
    const berulang_default = body?.berulang_default === undefined ? false : normalizeBoolean(body?.berulang_default, 'berulang_default');
    const aktif = body?.aktif === undefined ? true : normalizeBoolean(body?.aktif, 'aktif');
    const catatan = normalizeNullableString(body?.catatan, 'catatan');

    const existing = await db.definisiKomponenPayroll.findFirst({
      where: {
        id_tipe_komponen_payroll,
        nama_komponen,
        arah_komponen,
      },
      select: {
        id_definisi_komponen_payroll: true,
        deleted_at: true,
      },
    });

    const payload = {
      id_tipe_komponen_payroll,
      nama_komponen,
      arah_komponen,
      berulang_default,
      aktif,
      catatan,
      deleted_at: null,
    };

    if (existing && existing.deleted_at === null) {
      return NextResponse.json({ message: 'Definisi komponen payroll dengan tipe, nama komponen, dan arah komponen tersebut sudah ada.' }, { status: 409 });
    }

    if (existing && existing.deleted_at !== null) {
      const restored = await db.definisiKomponenPayroll.update({
        where: { id_definisi_komponen_payroll: existing.id_definisi_komponen_payroll },
        data: payload,
        select: buildSelect(),
      });

      return NextResponse.json(
        {
          message: 'Definisi komponen payroll berhasil dipulihkan dan diperbarui.',
          data: restored,
        },
        { status: 200 },
      );
    }

    const created = await db.definisiKomponenPayroll.create({
      data: payload,
      select: buildSelect(),
    });

    return NextResponse.json(
      {
        message: 'Definisi komponen payroll berhasil dibuat.',
        data: created,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Definisi komponen payroll dengan tipe, nama komponen, dan arah komponen tersebut sudah ada.' }, { status: 409 });
    }

    if (err?.statusCode) {
      return NextResponse.json({ message: err.message }, { status: err.statusCode });
    }

    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('tidak valid') || err.message.includes('boolean')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('POST /api/admin/definisi-komponen-payroll error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
