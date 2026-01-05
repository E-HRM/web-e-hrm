import { NextResponse } from 'next/server';
import db from '../../../../lib/prisma';
import { verifyAuthToken } from '../../../../lib/jwt';
import { authenticateRequest } from '../../../utils/auth/authUtils';

const ALLOWED_ROLES = new Set(['HR', 'DIREKTUR', 'OPERASIONAL', 'SUPERADMIN']);

async function getActor(req) {
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    try {
      const payload = verifyAuthToken(auth.slice(7));
      return {
        id: payload?.sub || payload?.id_user || payload?.userId,
        role: payload?.role,
        source: 'bearer',
      };
    } catch (_) {
      // fallback ke session
    }
  }

  const sessionOrRes = await authenticateRequest();
  if (sessionOrRes instanceof NextResponse) return sessionOrRes;

  return {
    id: sessionOrRes?.user?.id,
    role: sessionOrRes?.user?.role,
    source: 'session',
  };
}

function requireAdminRole(actor) {
  if (!actor?.role || !ALLOWED_ROLES.has(actor.role)) {
    return NextResponse.json({ ok: false, message: 'Forbidden: tidak memiliki akses.' }, { status: 403 });
  }
  return null;
}

const BULAN_VALUES = new Set(['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']);

const BULAN_BY_NUMBER = {
  1: 'JANUARI',
  2: 'FEBRUARI',
  3: 'MARET',
  4: 'APRIL',
  5: 'MEI',
  6: 'JUNI',
  7: 'JULI',
  8: 'AGUSTUS',
  9: 'SEPTEMBER',
  10: 'OKTOBER',
  11: 'NOVEMBER',
  12: 'DESEMBER',
};

function parseIntStrict(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) throw new Error(`Field '${field}' harus berupa angka integer.`);
  return n;
}

function parseBool(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  const v = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(v)) return false;
  throw new Error(`Field '${field}' harus boolean (true/false).`);
}

function parseBulan(value) {
  if (value === undefined || value === null || value === '') return undefined;

  // numeric month
  if (typeof value === 'number' || /^\d+$/.test(String(value).trim())) {
    const n = Number.parseInt(String(value).trim(), 10);
    if (n >= 1 && n <= 12) return BULAN_BY_NUMBER[n];
    throw new Error("Field 'bulan' harus 1-12 atau salah satu enum Bulan.");
  }

  const s = String(value).trim().toUpperCase();
  if (BULAN_VALUES.has(s)) return s;

  throw new Error("Field 'bulan' harus salah satu dari: " + Array.from(BULAN_VALUES).join(', ') + ' (atau 1-12).');
}

function parseIdUser(value) {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  if (!s) return undefined;
  // validasi ringan uuid char(36)
  if (s.length !== 36) throw new Error("Field 'id_user' tidak valid.");
  return s;
}

const ORDERABLE_FIELDS = new Set(['created_at', 'updated_at', 'tahun', 'bulan', 'is_scheduled']);

export async function GET(request) {
  const actor = await getActor(request);
  if (actor instanceof NextResponse) return actor;

  const forbidden = requireAdminRole(actor);
  if (forbidden) return forbidden;

  try {
    const { searchParams } = new URL(request.url);

    const q = (searchParams.get('q') || '').trim();
    const page = Math.max(1, parseIntStrict(searchParams.get('page') || '1', 'page'));
    const perPage = Math.min(100, Math.max(1, parseIntStrict(searchParams.get('perPage') || '20', 'perPage')));

    const id_user = parseIdUser(searchParams.get('id_user'));
    const tahun = parseIntStrict(searchParams.get('tahun'), 'tahun');
    const bulan = parseBulan(searchParams.get('bulan'));
    const is_scheduled = parseBool(searchParams.get('is_scheduled'), 'is_scheduled');

    const includeDeleted = (searchParams.get('includeDeleted') || '').trim().toLowerCase();
    const withDeleted = includeDeleted === '1' || includeDeleted === 'true';

    const orderBy = (searchParams.get('orderBy') || 'created_at').trim();
    const orderDirRaw = (searchParams.get('orderDir') || 'desc').trim().toLowerCase();
    const orderDir = orderDirRaw === 'asc' ? 'asc' : 'desc';

    const orderField = ORDERABLE_FIELDS.has(orderBy) ? orderBy : 'created_at';

    const where = {};
    if (!withDeleted) where.deleted_at = null;
    if (id_user) where.id_user = id_user;
    if (tahun !== undefined) where.tahun = tahun;
    if (bulan) where.bulan = bulan;
    if (is_scheduled !== undefined) where.is_scheduled = is_scheduled;

    if (q) {
      // cari via user (nama/email)
      where.user = {
        OR: [{ nama_pengguna: { contains: q } }, { email: { contains: q } }],
      };
    }

    const [total, items] = await Promise.all([
      db.schedulePlanner.count({ where }),
      db.schedulePlanner.findMany({
        where,
        orderBy: [{ [orderField]: orderDir }],
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id_schedule_planner: true,
          id_user: true,
          tahun: true,
          bulan: true,
          is_scheduled: true,
          created_at: true,
          updated_at: true,
          deleted_at: true,
          user: {
            select: {
              id_user: true,
              email: true,
              nama_pengguna: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const data = items.map((it) => ({
      ...it,
      user: it.user
        ? {
            ...it.user,
            nama_lengkap: it.user.nama_pengguna, // alias kompatibilitas FE yang sering dipakai di repo ini
          }
        : null,
    }));

    return NextResponse.json({
      ok: true,
      data,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    });
  } catch (err) {
    console.error('GET /admin/story-planner error:', err);
    return NextResponse.json({ ok: false, message: err?.message || 'Failed to fetch schedule planner' }, { status: 500 });
  }
}

export async function POST(request) {
  const actor = await getActor(request);
  if (actor instanceof NextResponse) return actor;

  const forbidden = requireAdminRole(actor);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();

    const id_user = parseIdUser(body?.id_user);
    const tahun = parseIntStrict(body?.tahun, 'tahun');
    const bulan = parseBulan(body?.bulan);
    const is_scheduled = parseBool(body?.is_scheduled, 'is_scheduled');

    if (!id_user) return NextResponse.json({ ok: false, message: 'id_user wajib diisi' }, { status: 400 });
    if (tahun === undefined) return NextResponse.json({ ok: false, message: 'tahun wajib diisi' }, { status: 400 });
    if (!bulan) return NextResponse.json({ ok: false, message: 'bulan wajib diisi' }, { status: 400 });

    const created = await db.schedulePlanner.create({
      data: {
        id_user,
        tahun,
        bulan,
        ...(is_scheduled !== undefined ? { is_scheduled } : {}),
      },
      select: {
        id_schedule_planner: true,
        id_user: true,
        tahun: true,
        bulan: true,
        is_scheduled: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    });

    return NextResponse.json({ ok: true, message: 'Schedule planner dibuat.', data: created }, { status: 201 });
  } catch (err) {
    console.error('POST /admin/story-planner error:', err && err.code ? err.code : err);

    // Prisma unique constraint
    if (err?.code === 'P2002') {
      return NextResponse.json({ ok: false, message: 'Schedule planner untuk user/bulan/tahun tersebut sudah ada.' }, { status: 409 });
    }

    return NextResponse.json({ ok: false, message: err?.message || 'Server error' }, { status: 500 });
  }
}
