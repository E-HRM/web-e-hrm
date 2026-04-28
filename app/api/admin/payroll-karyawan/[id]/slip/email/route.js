export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

import db from '@/lib/prisma';

import { buildSlipSelect, ensureAuth, guardRole, VIEW_ROLES } from '../../../payrollKaryawan.shared';
import { buildMailFrom, normalizeText, parseCc, readJsonBody, sendPayrollSlipEmail, verifyPayslipMailer } from '../../../slipEmail.shared';

export async function POST(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;
    const body = await readJsonBody(req);
    const cc = parseCc(body?.cc);
    const additionalMessage = normalizeText(body?.message || body?.pesan_tambahan);

    const payroll = await db.payrollKaryawan.findUnique({
      where: {
        id_payroll_karyawan: id,
      },
      select: buildSlipSelect(),
    });

    if (!payroll || payroll.deleted_at) {
      return NextResponse.json({ message: 'Slip payroll tidak ditemukan.' }, { status: 404 });
    }

    const from = buildMailFrom();

    await verifyPayslipMailer();

    const result = await sendPayrollSlipEmail({
      payroll,
      payrollId: id,
      cc,
      message: additionalMessage,
      from,
    });

    return NextResponse.json({
      message: 'Payslip berhasil dikirim ke email penerima payroll.',
      data: {
        to: result.to,
        cc: result.cc,
        filename: result.filename,
      },
    });
  } catch (err) {
    console.error('POST /api/admin/payroll-karyawan/[id]/slip/email error:', err);

    return NextResponse.json({ message: err?.message || 'Gagal mengirim payslip.' }, { status: err?.status || 500 });
  }
}
