import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

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
    } catch (_) {}
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

function normalizeRole(role) {
  return String(role || '').trim().toUpperCase();
}

function canManage(actor) {
  return ['HR', 'OPERASIONAL', 'SUPERADMIN'].includes(normalizeRole(actor?.role));
}

function normalizeDecision(value) {
  const decision = String(value || '').trim().toLowerCase();
  if (decision === 'disetujui' || decision === 'ditolak' || decision === 'pending') {
    return decision;
  }
  return null;
}

export async function PATCH(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!canManage(auth.actor)) {
    return NextResponse.json({ message: 'Forbidden: tidak memiliki akses approval form freelance.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const decision = normalizeDecision(body?.decision);
    const noteRaw = body?.note;
    const note = noteRaw == null ? null : String(noteRaw).trim() || null;

    if (!decision) {
      return NextResponse.json({ message: 'Decision tidak valid.' }, { status: 400 });
    }

    const updated = await db.formFreelance.update({
      where: { id_form_freelance: params.formId },
      data: {
        decision,
        note,
        decided_at: decision === 'pending' ? null : new Date(),
        approver_user_id: decision === 'pending' ? null : auth.actor.id,
        approver_role: decision === 'pending' ? null : normalizeRole(auth.actor.role),
      },
      select: {
        id_form_freelance: true,
        id_freelance: true,
        decision: true,
        note: true,
        decided_at: true,
        approver_user_id: true,
        approver_role: true,
        approver: {
          select: {
            id_user: true,
            nama_pengguna: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: decision === 'disetujui' ? 'Form freelance disetujui.' : decision === 'ditolak' ? 'Form freelance ditolak.' : 'Status form freelance dikembalikan ke pending.',
      data: updated,
    });
  } catch (error) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ message: 'Form freelance tidak ditemukan.' }, { status: 404 });
    }
    console.error('PATCH /api/admin/freelance/forms/[formId] error:', error);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
