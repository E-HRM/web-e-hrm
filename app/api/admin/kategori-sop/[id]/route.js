// app/api/admin/kategori-sop/[id]/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const ADMIN_ROLES = new Set(['HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI']);

function getKategoriDelegate() {
  return db?.kategori_sop || db?.kategoriSop || null;
}

async function ensureAuth(req) {
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    try {
      const payload = verifyAuthToken(auth.slice(7));
      return {
        actor: {
          id: payload?.sub || payload?.id_user || payload?.userId,
          role: payload?.role,
          source: 'bearer',
        },
      };
    } catch (_) {
      /* fallback ke NextAuth */
    }
  }

  const sessionOrRes = await authenticateRequest();
  if (sessionOrRes instanceof NextResponse) return sessionOrRes;

  return {
    actor: {
      id: sessionOrRes.user.id,
      role: sessionOrRes.user.role,
      source: 'session',
    },
  };
}

function guardAdmin(actor) {
  const role = String(actor?.role || '')
    .trim()
    .toUpperCase();
  if (!ADMIN_ROLES.has(role)) {
    return NextResponse.json({ message: 'Forbidden: hanya admin yang dapat mengakses resource ini.' }, { status: 403 });
  }
  return null;
}

export async function GET(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;
  const forbidden = guardAdmin(auth.actor);
  if (forbidden) return forbidden;

  const kategori = getKategoriDelegate();
  if (!kategori) {
    return NextResponse.json({ message: 'Prisma model kategori_sop tidak ditemukan. Pastikan schema + prisma generate sudah benar.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());

    const data = await kategori.findFirst({
      where: {
        id_kategori_sop: params.id,
        ...(!includeDeleted ? { deleted_at: null } : {}),
      },
      select: {
        id_kategori_sop: true,
        nama_kategori: true,
        deskripsi: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    });

    if (!data) {
      return NextResponse.json({ message: 'Kategori SOP tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /admin/kategori-sop/[id] error:', err);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;
  const forbidden = guardAdmin(auth.actor);
  if (forbidden) return forbidden;

  const kategori = getKategoriDelegate();
  if (!kategori) {
    return NextResponse.json({ message: 'Prisma model kategori_sop tidak ditemukan. Pastikan schema + prisma generate sudah benar.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'nama_kategori')) {
      if (body.nama_kategori === null || String(body.nama_kategori).trim() === '') {
        return NextResponse.json({ message: "Field 'nama_kategori' tidak boleh kosong." }, { status: 400 });
      }
      payload.nama_kategori = String(body.nama_kategori).trim();
    }

    if (Object.prototype.hasOwnProperty.call(body, 'deskripsi')) {
      payload.deskripsi = body.deskripsi === null || body.deskripsi === undefined ? null : String(body.deskripsi).trim() || null;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ message: 'Tidak ada field yang diupdate.' }, { status: 400 });
    }

    const updated = await kategori.update({
      where: { id_kategori_sop: params.id },
      data: payload,
      select: {
        id_kategori_sop: true,
        nama_kategori: true,
        deskripsi: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    });

    return NextResponse.json({ message: 'Kategori SOP diupdate.', data: updated });
  } catch (err) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Kategori SOP tidak ditemukan.' }, { status: 404 });
    }
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Kategori SOP sudah terdaftar.' }, { status: 409 });
    }
    console.error('PUT /admin/kategori-sop/[id] error:', err);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;
  const forbidden = guardAdmin(auth.actor);
  if (forbidden) return forbidden;

  const kategori = getKategoriDelegate();
  if (!kategori) {
    return NextResponse.json({ message: 'Prisma model kategori_sop tidak ditemukan. Pastikan schema + prisma generate sudah benar.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const isHardDelete = (searchParams.get('hard') || '').toLowerCase() === 'true';

    if (isHardDelete) {
      await kategori.delete({
        where: { id_kategori_sop: params.id },
      });
      return NextResponse.json({ message: 'Kategori SOP dihapus secara permanen (hard delete).' });
    }

    await kategori.update({
      where: { id_kategori_sop: params.id },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ message: 'Kategori SOP dihapus (soft delete).' });
  } catch (err) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Kategori SOP tidak ditemukan.' }, { status: 404 });
    }
    console.error('DELETE /admin/kategori-sop/[id] error:', err);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
