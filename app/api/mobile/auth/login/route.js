// app/api/mobile/auth/login/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '@/lib/prisma';
import { signAccessToken } from '../../../../utils/auth/authUtilsMobile';

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

    // 1) Buat session_id (tanpa ketergantungan tabel device)
    const sessionId = crypto.randomUUID();

    // 2) Access token pendek (audience mobile, TTL dari MOBILE_ACCESS_TTL)
    const accessToken = signAccessToken({
      sub: user.id_user,
      role: user.role,
      email: user.email,
    });

    // 3) Refresh token panjang (opaque) + simpan HASH di DB
    const plainRefresh = crypto.randomBytes(48).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(plainRefresh).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180); // ~180 hari

    await db.refreshToken.create({
      data: {
        id_user: user.id_user,
        session_id: sessionId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        // opsional audit:
        user_agent: typeof req.headers.get === 'function' ? req.headers.get('user-agent') ?? null : null,
        ip_address: typeof req.headers.get === 'function' ? (req.headers.get('x-forwarded-for') ?? '').split(',')[0] || null : null,
      },
    });

    return NextResponse.json(
      {
        message: 'Login berhasil.',
        accessToken, // pakai di header Authorization
        refreshToken: plainRefresh, // simpan aman di secure storage (mobile)
        sessionId, // identitas sesi untuk refresh/logout
        // user: {
        //   id_user: user.id_user,
        //   email: user.email,
        //   role: user.role,
        //   nama_pengguna: user.nama_pengguna ?? null,
        // },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
