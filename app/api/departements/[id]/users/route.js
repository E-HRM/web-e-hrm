export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

// Izinkan akses jika pakai Bearer JWT valid atau user login via NextAuth
async function ensureAuth(req) {
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    try {
      verifyAuthToken(auth.slice(7));
      return true;
    } catch (_) {
      /* fallback ke session */
    }
  }
  const sessionOrRes = await authenticateRequest();
  if (sessionOrRes instanceof NextResponse) return sessionOrRes; // unauthorized
  return true;
}

export async function GET(req, { params }) {
  // Auth check
  const ok = await ensureAuth(req);
  if (ok instanceof NextResponse) return ok;

  try {
    const { searchParams } = new URL(req.url);

    const id_departement = (params?.id_departement || '').trim();
    if (!id_departement) {
      return NextResponse.json({ message: 'Parameter id_departement wajib diisi.' }, { status: 400 });
    }

    // Opsional: pencarian & pagination
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1), 100);
    const search = (searchParams.get('search') || '').trim();
    const includeDeleted = (searchParams.get('includeDeleted') || '').toLowerCase() === 'true';
    const orderBy = (searchParams.get('orderBy') || 'created_at').trim();
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    // WHERE clause
    const where = {
      id_departement,
      ...(includeDeleted ? {} : { deleted_at: null }),
      ...(search
        ? {
            OR: [{ nama_pengguna: { contains: search } }, { email: { contains: search } }, { kontak: { contains: search } }],
          }
        : {}),
    };

    // Kolom aman (hindari password_hash & token reset)
    const select = {
      id_user: true,
      nama_pengguna: true,
      email: true,
      kontak: true,
      agama: true,
      foto_profil_user: true,
      tanggal_lahir: true,
      role: true,
      id_departement: true,
      id_location: true,
      created_at: true,
      updated_at: true,
      departement: { select: { id_departement: true, nama_departement: true } },
      kantor: { select: { id_location: true, nama_kantor: true } },
    };

    const [items, total] = await Promise.all([
      db.user.findMany({
        where,
        select,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [orderBy]: sort },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error('GET /api/departements/[id_departement]/users error:', err);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
