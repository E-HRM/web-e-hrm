import { NextResponse } from 'next/server';
import db from '../../../../../lib/prisma';
import { verifyAuthToken } from '../../../../../lib/jwt';
import { authenticateRequest } from '../../../../utils/auth/authUtils';

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

export async function GET(req, { params }) {
  const ok = await ensureAuth(req);
  if (ok instanceof NextResponse) return ok;

  try {
    const { id } = params;
    const data = await db.departement.findUnique({
      where: { id_departement: id },
      select: {
        id_departement: true,
        nama_departement: true,
        id_supervisor: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        supervisor: {
          select: { id_user: true, nama_lengkap: true, email: true },
        },
      },
    });
    if (!data) return NextResponse.json({ message: 'Departement tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /departements/[id] error:', err?.code || err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const ok = await ensureAuth(req);
  if (ok instanceof NextResponse) return ok;

  try {
    const { id } = params;
    const body = await req.json();

    if (body.nama_departement !== undefined && String(body.nama_departement).trim() === '') {
      return NextResponse.json({ message: 'Nama departement tidak boleh kosong.' }, { status: 400 });
    }

    let supervisorConnect;
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

    const updated = await db.departement.update({
      where: { id_departement: id },
      data: {
        ...(body.nama_departement !== undefined && { nama_departement: String(body.nama_departement).trim() }),
        ...(body.id_supervisor !== undefined && { id_supervisor: supervisorConnect ?? null }),
      },
      select: {
        id_departement: true,
        nama_departement: true,
        id_supervisor: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ message: 'Departement diperbarui.', data: updated });
  } catch (err) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Departement tidak ditemukan' }, { status: 404 });
    }
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Supervisor sudah terpasang pada departement lain.' }, { status: 409 });
    }
    console.error('PUT /departements/[id] error:', err?.code || err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const ok = await ensureAuth(req);
  if (ok instanceof NextResponse) return ok;

  try {
    const { id } = params;

    const exists = await db.departement.findUnique({
      where: { id_departement: id },
      select: { id_departement: true },
    });
    if (!exists) {
      return NextResponse.json({ message: 'Departement tidak ditemukan' }, { status: 404 });
    }

    await db.departement.delete({ where: { id_departement: id } });

    return NextResponse.json({ message: 'Departement dihapus.' });
  } catch (err) {
    if (err?.code === 'P2003') {
      return NextResponse.json({ message: 'Gagal menghapus: masih direferensikan oleh entitas lain. Ubah relasi (onDelete: SetNull) atau re-assign terlebih dulu.' }, { status: 409 });
    }
    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Departement tidak ditemukan' }, { status: 404 });
    }
    console.error('DELETE /departements/[id] error:', err?.code || err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
