import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

function normalizeNullableString(value) {
  if (value === undefined) return { defined: false };
  const trimmed = String(value).trim();
  if (trimmed === '') return { defined: true, value: null };
  return { defined: true, value: trimmed };
}

async function ensureAuth(req) {
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    try {
      verifyAuthToken(auth.slice(7));
      return true;
    } catch (_) {}
  }
  const sessionOrRes = await authenticateRequest();
  if (sessionOrRes instanceof NextResponse) return sessionOrRes;
  return true;
}

export async function GET(req) {
  const ok = await ensureAuth(req);
  if (ok instanceof NextResponse) return ok;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1), 100);
    const search = (searchParams.get('search') || '').trim();
    const includeDeleted = searchParams.get('includeDeleted') === '1';
    const departementIdParam = (searchParams.get('departementId') || '').trim();
    const parentIdParam = (searchParams.get('parentId') || '').trim();
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where = {
      ...(includeDeleted ? {} : { deleted_at: null }),
      ...(search ? { nama_jabatan: { contains: search, mode: 'insensitive' } } : {}),
      ...(departementIdParam ? { id_departement: departementIdParam } : {}),
      ...(parentIdParam ? { id_induk_jabatan: parentIdParam } : {}),
    };

    const [total, data] = await Promise.all([
      db.jabatan.count({ where }),
      db.jabatan.findMany({
        where,
        orderBy: { [orderBy]: sort },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id_jabatan: true,
          nama_jabatan: true,
          id_departement: true,
          id_induk_jabatan: true,
          created_at: true,
          updated_at: true,
          deleted_at: true,
          departement: {
            select: {
              id_departement: true,
              nama_departement: true,
            },
          },
          induk: {
            select: {
              id_jabatan: true,
              nama_jabatan: true,
            },
          },
        },
      }),
    ]);

    const ids = data.map((item) => item.id_jabatan);
    let userCounts = {};
    if (ids.length > 0) {
      const counts = await db.user.groupBy({
        by: ['id_jabatan'],
        where: {
          id_jabatan: { in: ids },
          deleted_at: null,
        },
        _count: { _all: true },
      });
      userCounts = Object.fromEntries(counts.map((c) => [c.id_jabatan, c._count._all]));
    }

    const enriched = data.map((item) => ({
      ...item,
      users_active_count: userCounts[item.id_jabatan] ?? 0,
    }));

    return NextResponse.json({
      data: enriched,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    console.error('GET /jabatans error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  const ok = await ensureAuth(req);
  if (ok instanceof NextResponse) return ok;

  try {
    const body = await req.json();
    if (!body.nama_jabatan || String(body.nama_jabatan).trim() === '') {
      return NextResponse.json({ message: "Field 'nama_jabatan' wajib diisi." }, { status: 400 });
    }

    const departementId = normalizeNullableString(body.id_departement);
    const parentId = normalizeNullableString(body.id_induk_jabatan);

    if (departementId.defined && departementId.value) {
      const departement = await db.departement.findUnique({
        where: { id_departement: departementId.value },
        select: { id_departement: true },
      });
      if (!departement) {
        return NextResponse.json({ message: 'Departement tidak ditemukan.' }, { status: 404 });
      }
    }

    if (parentId.defined && parentId.value) {
      const parent = await db.jabatan.findUnique({
        where: { id_jabatan: parentId.value },
        select: { id_jabatan: true },
      });
      if (!parent) {
        return NextResponse.json({ message: 'Induk jabatan tidak ditemukan.' }, { status: 404 });
      }
    }

    const created = await db.jabatan.create({
      data: {
        nama_jabatan: String(body.nama_jabatan).trim(),
        ...(departementId.defined && { id_departement: departementId.value }),
        ...(parentId.defined && { id_induk_jabatan: parentId.value }),
      },
      select: {
        id_jabatan: true,
        nama_jabatan: true,
        id_departement: true,
        id_induk_jabatan: true,
        created_at: true,
      },
    });

    return NextResponse.json({ message: 'Jabatan dibuat.', data: created }, { status: 201 });
  } catch (err) {
    console.error('POST /jabatans error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
