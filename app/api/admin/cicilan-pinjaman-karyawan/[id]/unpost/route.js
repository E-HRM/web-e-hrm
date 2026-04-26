import { NextResponse } from 'next/server';

import { authenticateRequest } from '@/app/utils/auth/authUtils';
import { verifyAuthToken } from '@/lib/jwt';
import db from '@/lib/prisma';

import { unpostCicilanPayrollPosting } from '../../payrollPosting.shared';

const EDIT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const normRole = (role) =>
  String(role || '')
    .trim()
    .toUpperCase();

async function ensureAuth(req) {
  const auth = req.headers.get('authorization') || '';

  if (auth.startsWith('Bearer ')) {
    try {
      const payload = verifyAuthToken(auth.slice(7));
      return {
        actor: {
          id: payload?.sub || payload?.id_user || payload?.userId,
          role: normRole(payload?.role),
          source: 'bearer',
        },
      };
    } catch (_) {
      // fallback ke session
    }
  }

  const sessionOrRes = await authenticateRequest();
  if (sessionOrRes instanceof NextResponse) return sessionOrRes;

  return {
    actor: {
      id: sessionOrRes?.user?.id || sessionOrRes?.user?.id_user,
      role: normRole(sessionOrRes?.user?.role),
      source: 'session',
    },
  };
}

function guardRole(actor, allowedRoles) {
  if (!allowedRoles.has(normRole(actor?.role))) {
    return NextResponse.json({ message: 'Forbidden: Anda tidak memiliki akses ke resource ini.' }, { status: 403 });
  }

  return null;
}

function buildKnownErrorStatus(message) {
  if (message.includes('tidak ditemukan')) return 404;

  if (
    message.includes('dihapus') ||
    message.includes('dibayar') ||
    message.includes('belum diposting') ||
    message.includes('payroll') ||
    message.includes('terkunci') ||
    message.includes('pendapatan_bersih')
  ) {
    return 409;
  }

  return null;
}

export async function POST(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, EDIT_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;

    const result = await db.$transaction((tx) =>
      unpostCicilanPayrollPosting(tx, id, {
        requirePosted: true,
      }),
    );

    return NextResponse.json({
      message: 'Posting cicilan pinjaman berhasil dilepas dari payroll.',
      data: result.cicilan,
      unpost_summary: {
        item_komponen_payroll: result.item,
        loan_snapshot: result.loan_snapshot,
        payroll_snapshots: result.payrolls,
      },
    });
  } catch (err) {
    const message = String(err?.message || '');
    const knownStatus = buildKnownErrorStatus(message);

    if (knownStatus) {
      return NextResponse.json({ message }, { status: knownStatus });
    }

    console.error('POST /api/admin/cicilan-pinjaman-karyawan/[id]/unpost error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
