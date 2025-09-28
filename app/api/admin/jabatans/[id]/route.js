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

export async function GET(_req, { params }) {
  try {
    const { id } = params;
    const data = await db.jabatan.findUnique({
      where: { id_jabatan: id },
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
    });

    if (!data) {
      return NextResponse.json({ message: 'Jabatan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /jabatans/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const ok = await ensureAuth(req);
  if (ok instanceof NextResponse) return ok;

  try {
    const { id } = params;
    const body = await req.json();

    if (body.nama_jabatan !== undefined && String(body.nama_jabatan).trim() === '') {
      return NextResponse.json({ message: 'nama_jabatan tidak boleh kosong.' }, { status: 400 });
    }

    const departementId = normalizeNullableString(body.id_departement);
    const parentId = normalizeNullableString(body.id_induk_jabatan);

    if (parentId.defined && parentId.value === id) {
      return NextResponse.json({ message: 'Induk jabatan tidak boleh sama dengan jabatan itu sendiri.' }, { status: 400 });
    }

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

    const updated = await db.jabatan.update({
      where: { id_jabatan: id },
      data: {
        ...(body.nama_jabatan !== undefined && { nama_jabatan: String(body.nama_jabatan).trim() }),
        ...(departementId.defined && { id_departement: departementId.value }),
        ...(parentId.defined && { id_induk_jabatan: parentId.value }),
      },
      select: {
        id_jabatan: true,
        nama_jabatan: true,
        id_departement: true,
        id_induk_jabatan: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ message: 'Jabatan diperbarui.', data: updated });
  } catch (err) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Jabatan tidak ditemukan' }, { status: 404 });
    }
    console.error('PUT /jabatans/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const ok = await ensureAuth(req);
  if (ok instanceof NextResponse) return ok;

  try {
    const { id } = params;

    const exists = await db.jabatan.findUnique({
      where: { id_jabatan: id },
      select: { id_jabatan: true },
    });
    if (!exists) {
      return NextResponse.json({ message: 'Jabatan tidak ditemukan' }, { status: 404 });
    }

    await db.jabatan.delete({ where: { id_jabatan: id } });

    return NextResponse.json({ message: 'Jabatan dihapus.' });
  } catch (err) {
    if (err?.code === 'P2003') {
      return NextResponse.json({ message: 'Gagal menghapus: jabatan masih direferensikan oleh entitas lain.' }, { status: 409 });
    }
    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Jabatan tidak ditemukan' }, { status: 404 });
    }
    console.error('DELETE /jabatans/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
