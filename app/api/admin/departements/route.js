import { NextResponse } from 'next/server';
import db from '../../../../lib/prisma';
import { verifyAuthToken } from '../../../../lib/jwt';
import { authenticateRequest } from '../../../utils/auth/authUtils';

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
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where = {
      ...(includeDeleted ? {} : { deleted_at: null }),
      ...(search ? { nama_departement: { contains: search, mode: 'insensitive' } } : {}),
    };

    // Ambil total departement & page data dulu
    const [total, data] = await Promise.all([
      db.departement.count({ where }),
      db.departement.findMany({
        where,
        orderBy: { [orderBy]: sort },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id_departement: true,
          nama_departement: true,
          id_supervisor: true,
          created_at: true,
          updated_at: true,
          deleted_at: true,
          supervisor: {
            select: {
              id_user: true,
              nama_lengkap: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Kumpulkan id departement pada halaman ini
    const ids = data.map((d) => d.id_departement);
    let activeCountsMap = {};
    let totalCountsMap = {};

    if (ids.length > 0) {
      // Hitung user aktif (deleted_at = null)
      const activeCounts = await db.user.groupBy({
        by: ['id_departement'],
        where: {
          id_departement: { in: ids },
          deleted_at: null,
        },
        _count: { _all: true },
      });

      // Hitung total user (termasuk yang deleted)
      const totalCounts = await db.user.groupBy({
        by: ['id_departement'],
        where: {
          id_departement: { in: ids },
        },
        _count: { _all: true },
      });

      activeCountsMap = Object.fromEntries(activeCounts.map((r) => [r.id_departement, r._count._all]));
      totalCountsMap = Object.fromEntries(totalCounts.map((r) => [r.id_departement, r._count._all]));
    }

    // Tambahkan field count ke setiap item
    const enriched = data.map((d) => ({
      ...d,
      users_active_count: activeCountsMap[d.id_departement] ?? 0,
      users_total_count: totalCountsMap[d.id_departement] ?? 0,
    }));

    return NextResponse.json({
      data: enriched,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    console.error('GET /departements error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// POST tetap sama seperti punyamu
export async function POST(req) {
  const ok = await ensureAuth(req);
  if (ok instanceof NextResponse) return ok;

  try {
    const body = await req.json();
    if (!body.nama_departement || String(body.nama_departement).trim() === '') {
      return NextResponse.json({ message: "Field 'nama_departement' wajib diisi." }, { status: 400 });
    }

    let supervisorConnect = undefined;
    if (body.id_supervisor !== undefined) {
      const idSupervisor = String(body.id_supervisor).trim();
      if (idSupervisor === '') {
        supervisorConnect = null;
      } else {
        const supervisor = await db.user.findUnique({
          where: { id_user: idSupervisor },
          select: { id_user: true },
        });
        if (!supervisor) {
          return NextResponse.json({ message: 'Supervisor tidak ditemukan.' }, { status: 404 });
        }
        supervisorConnect = idSupervisor;
      }
    }

    const created = await db.departement.create({
      data: {
        nama_departement: String(body.nama_departement).trim(),
        ...(supervisorConnect !== undefined && { id_supervisor: supervisorConnect }),
      },
      select: {
        id_departement: true,
        nama_departement: true,
        id_supervisor: true,
        created_at: true,
      },
    });

    return NextResponse.json({ message: 'Departement dibuat.', data: created }, { status: 201 });
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Supervisor sudah terpasang pada departement lain.' }, { status: 409 });
    }
    console.error('POST /departements error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
