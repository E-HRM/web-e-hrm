// app/api/mobile/auth/register/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '../../../../../lib/prisma';

const ROLES = ['KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR'];

export async function POST(req) {
  try {
    const body = await req.json();

    const required = ['nama_pengguna', 'email', 'password'];
    for (const key of required) {
      if (!body[key] || String(body[key]).trim() === '') {
        return NextResponse.json({ message: `Field '${key}' wajib diisi.` }, { status: 400 });
      }
    }

    const email = String(body.email).trim().toLowerCase();

    // Cek unik email
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: 'Email sudah terdaftar.' }, { status: 409 });
    }

    // Validasi opsional: departement & location hanya jika dikirim
    let deptId = body.id_departement ?? null;
    let locId = body.id_location ?? null;

    if (deptId) {
      const dept = await db.departement.findUnique({ where: { id_departement: deptId } });
      if (!dept) {
        return NextResponse.json({ message: 'Departement tidak ditemukan.' }, { status: 400 });
      }
    } else {
      deptId = null;
    }

    if (locId) {
      const loc = await db.location.findUnique({ where: { id_location: locId } });
      if (!loc) {
        return NextResponse.json({ message: 'Location/kantor tidak ditemukan.' }, { status: 400 });
      }
    } else {
      locId = null;
    }

    const password_hash = await bcrypt.hash(String(body.password), 12);
    const role = body.role && ROLES.includes(body.role) ? body.role : 'KARYAWAN';
    const tanggal_lahir = body.tanggal_lahir ? new Date(body.tanggal_lahir) : null;
    const agama = body.agama ?? null;

    const created = await db.user.create({
      data: {
        nama_pengguna: String(body.nama_pengguna).trim(),
        email,
        password_hash,
        kontak: body.kontak ?? null,
        foto_profil_user: body.foto_profil_user ?? null,
        tanggal_lahir,
        agama,
        role,
        id_departement: deptId,
        id_location: locId,
        password_updated_at: new Date(),
      },
      select: {
        id_user: true,
        nama_pengguna: true,
        email: true,
        role: true,
        id_departement: true,
        id_location: true,
        created_at: true,
      },
    });

    return NextResponse.json({ message: 'Registrasi berhasil.', user: created }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    const msg = err?.message?.includes('Unique constraint') ? 'Email sudah digunakan.' : err?.message || 'Terjadi kesalahan pada server.';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

// export async function GET() {
//   return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
// }
