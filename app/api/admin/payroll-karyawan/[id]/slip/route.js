import { NextResponse } from 'next/server';

import db from '@/lib/prisma';

import { buildSlipPayload, buildSlipSelect, ensureAuth, guardRole, VIEW_ROLES } from '../../payrollKaryawan.shared';

export async function GET(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;

    const payroll = await db.payrollKaryawan.findUnique({
      where: {
        id_payroll_karyawan: id,
      },
      select: buildSlipSelect(),
    });

    if (!payroll || payroll.deleted_at) {
      return NextResponse.json({ message: 'Slip payroll tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      data: buildSlipPayload(payroll),
    });
  } catch (err) {
    console.error('GET /api/admin/payroll-karyawan/[id]/slip error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
