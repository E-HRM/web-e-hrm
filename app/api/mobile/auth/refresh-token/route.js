// app/api/mobile/auth/refresh-token/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/prisma';
import { signAccessToken } from '@/lib/jwt_utils_mobile'; // pastikan pathnya benar

export async function POST(req) {
  try {
    const { refreshToken, sessionId } = await req.json();
    if (!refreshToken || !sessionId) {
      return NextResponse.json({ message: 'Bad request' }, { status: 400 });
    }

    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // cek token aktif
    const rec = await db.refreshToken.findFirst({
      where: {
        session_id: sessionId,
        token_hash: hash,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!rec) {
      // reuse/invalid → revoke semua token sesi ini
      await db.refreshToken.updateMany({
        where: { session_id: sessionId, revoked_at: null },
        data: { revoked_at: new Date() },
      });
      return NextResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
    }

    // rotasi: revoke lama, buat baru
    await db.refreshToken.update({
      where: { id_refresh_token: rec.id_refresh_token },
      data: { revoked_at: new Date() },
    });

    const accessToken = signAccessToken({ sub: rec.user.id_user, role: rec.user.role, email: rec.user.email });

    const newPlain = crypto.randomBytes(48).toString('base64url');
    const newHash = crypto.createHash('sha256').update(newPlain).digest('hex');
    const newExp = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180);

    await db.refreshToken.create({
      data: {
        id_user: rec.user.id_user,
        session_id: sessionId,
        token_hash: newHash,
        expires_at: newExp,
      },
    });

    return NextResponse.json({ accessToken, refreshToken: newPlain }, { status: 200 });
  } catch (e) {
    console.error('refresh error:', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
