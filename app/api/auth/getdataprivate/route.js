import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';      

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Token tidak ditemukan' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    let decoded;

    try {
      decoded = verifyAuthToken(token); // <- akan throw jika invalid/expired
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return NextResponse.json({ message: 'Token sudah kedaluwarsa' }, { status: 401 });
      }
      if (err instanceof jwt.JsonWebTokenError) {
        return NextResponse.json({ message: 'Token tidak valid' }, { status: 401 });
      }
      return NextResponse.json({ message: 'Gagal memverifikasi token', error: err?.message || String(err) }, { status: 500 });
    }

    // token dari /api/login berisi { sub: id_user, role, email }
    const userId = decoded?.sub || decoded?.id_user || decoded?.userId;
    if (!userId) {
      return NextResponse.json({ message: 'Payload token tidak sesuai' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id_user: userId },
      select: {
        id_user: true,
        nama_pengguna: true,
        email: true,
        role: true,
        tanggal_lahir: true,
        kontak: true,
        foto_profil_user: true,
        id_departement: true,
        id_location: true,
        password_updated_at: true,
        created_at: true,
        updated_at: true,
        // relasi opsional
        departement: { select: { id_departement: true, nama_departement: true } },
        kantor: { select: { id_location: true, nama_kantor: true, latitude: true, longitude: true, radius: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Data user berhasil diambil', user }, { status: 200 });
  } catch (error) {
    console.error('getdataprivate error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan tak terduga', error: error?.message || String(error) }, { status: 500 });
  }
}
