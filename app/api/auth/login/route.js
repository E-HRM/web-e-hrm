import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/prisma';
import { signAuthToken } from '@/lib/jwt';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    // Samakan pesan untuk cegah user-enumeration
    if (!user) {
      return NextResponse.json({ message: 'Email atau password salah.' }, { status: 401 });
    }

    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) {
      return NextResponse.json({ message: 'Email atau password salah.' }, { status: 401 });
    }

    // Payload token minimal
    const token = signAuthToken({
      sub: user.id_user,
      role: user.role,
      email: user.email,
    });

    return NextResponse.json({ message: 'Login berhasil.', token }, { status: 200 });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
