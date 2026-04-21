import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const CREATE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'nama_tipe_komponen']);

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
    id_tipe_komponen_payroll: true,
    nama_tipe_komponen: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    _count: {
      select: {
        definisi_komponen: true,
      },
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
    const nama_tipe_komponen = (searchParams.get('nama_tipe_komponen') || '').trim();

    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());
    const deletedOnly = ['1', 'true'].includes((searchParams.get('deletedOnly') || '').toLowerCase());

    const orderByParam = (searchParams.get('orderBy') || 'created_at').trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam) ? orderByParam : 'created_at';
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where = {
      ...(deletedOnly ? { deleted_at: { not: null } } : {}),
      ...(!includeDeleted && !deletedOnly ? { deleted_at: null } : {}),
      ...(nama_tipe_komponen ? { nama_tipe_komponen: { contains: nama_tipe_komponen } } : {}),
      ...(search
        ? {
            OR: [{ nama_tipe_komponen: { contains: search } }],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      db.tipeKomponenPayroll.count({ where }),
      db.tipeKomponenPayroll.findMany({
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
    if (err instanceof Error && err.message.startsWith('Field ')) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }

    console.error('GET /api/admin/tipe-komponen-payroll error:', err);
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

    const nama_tipe_komponen = normalizeRequiredString(body?.nama_tipe_komponen, 'nama_tipe_komponen', 100);

    const existing = await db.tipeKomponenPayroll.findFirst({
      where: {
        nama_tipe_komponen,
      },
      select: {
        id_tipe_komponen_payroll: true,
        deleted_at: true,
      },
    });

    if (existing && existing.deleted_at === null) {
      return NextResponse.json({ message: 'Tipe komponen payroll dengan nama tersebut sudah ada.' }, { status: 409 });
    }

    if (existing && existing.deleted_at !== null) {
      const restored = await db.tipeKomponenPayroll.update({
        where: { id_tipe_komponen_payroll: existing.id_tipe_komponen_payroll },
        data: {
          nama_tipe_komponen,
          deleted_at: null,
        },
        select: buildSelect(),
      });

      return NextResponse.json(
        {
          message: 'Tipe komponen payroll berhasil dipulihkan dan diperbarui.',
          data: restored,
        },
        { status: 200 },
      );
    }

    const created = await db.tipeKomponenPayroll.create({
      data: {
        nama_tipe_komponen,
      },
      select: buildSelect(),
    });

    return NextResponse.json(
      {
        message: 'Tipe komponen payroll berhasil dibuat.',
        data: created,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Tipe komponen payroll dengan nama tersebut sudah ada.' }, { status: 409 });
    }

    if (err instanceof Error && (err.message.startsWith('Field ') || err.message.includes('karakter'))) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }

    console.error('POST /api/admin/tipe-komponen-payroll error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
