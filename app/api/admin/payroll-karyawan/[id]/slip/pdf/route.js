export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

import db from '@/lib/prisma';

import { buildSlipPayload, buildSlipSelect, ensureAuth, guardRole, VIEW_ROLES } from '../../../payrollKaryawan.shared';
import { buildSlipFilename, buildSlipPdf } from './slipPdf.shared'

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
      return NextResponse.json({ message: 'Slip payroll karyawan tidak ditemukan.' }, { status: 404 });
    }

    const slip = buildSlipPayload(payroll);
    const pdfBytes = await buildSlipPdf(slip);
    const filename = buildSlipFilename(slip, id);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `inline; filename="${filename}"`,
        'cache-control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('GET /api/admin/payroll-karyawan/[id]/slip/pdf error:', err);
    return NextResponse.json({ message: err?.message || 'Server error' }, { status: 500 });
  }
}
