export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

import db from '@/lib/prisma';

import { buildSlipSelect, ensureAuth, guardRole, VIEW_ROLES } from '../payrollKaryawan.shared';
import { buildMailFrom, normalizeText, parseCc, readJsonBody, sendPayrollSlipEmail, verifyPayslipMailer } from '../slipEmail.shared';

function parsePayrollIds(value) {
  const rawIds = Array.isArray(value) ? value : [];
  const ids = [];
  const seen = new Set();

  rawIds.forEach((item) => {
    const id = normalizeText(item);
    if (!id || seen.has(id)) return;

    seen.add(id);
    ids.push(id);
  });

  return ids;
}

export async function POST(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const body = await readJsonBody(req);
    const payrollIds = parsePayrollIds(body?.payroll_ids || body?.ids || body?.id_payroll_karyawan_list);
    const cc = parseCc(body?.cc);
    const message = normalizeText(body?.message || body?.pesan_tambahan || body?.template);

    if (!payrollIds.length) {
      return NextResponse.json({ message: 'Pilih minimal satu payslip untuk dikirim.' }, { status: 400 });
    }

    if (payrollIds.length > 100) {
      return NextResponse.json({ message: 'Maksimal 100 payslip dapat dikirim dalam satu kali proses.' }, { status: 400 });
    }

    const payrolls = await db.payrollKaryawan.findMany({
      where: {
        id_payroll_karyawan: {
          in: payrollIds,
        },
      },
      select: buildSlipSelect(),
    });

    const payrollById = new Map(payrolls.map((payroll) => [payroll.id_payroll_karyawan, payroll]));
    const from = buildMailFrom();

    await verifyPayslipMailer();

    const results = [];

    for (const payrollId of payrollIds) {
      const payroll = payrollById.get(payrollId);

      try {
        const sent = await sendPayrollSlipEmail({
          payroll,
          payrollId,
          cc,
          message,
          from,
        });

        results.push({
          id_payroll_karyawan: payrollId,
          status: 'SENT',
          to: sent.to,
          filename: sent.filename,
          employee_name: sent.employeeName,
          periode_label: sent.periodeLabel,
        });
      } catch (error) {
        results.push({
          id_payroll_karyawan: payrollId,
          status: 'FAILED',
          message: error?.message || 'Gagal mengirim payslip.',
        });
      }
    }

    const sentCount = results.filter((item) => item.status === 'SENT').length;
    const failedCount = results.length - sentCount;

    return NextResponse.json({
      message: failedCount
        ? `Payslip massal selesai. Berhasil: ${sentCount}, gagal: ${failedCount}.`
        : `Payslip massal berhasil dikirim ke ${sentCount} penerima.`,
      data: {
        total: results.length,
        sent: sentCount,
        failed: failedCount,
        results,
      },
    });
  } catch (err) {
    console.error('POST /api/admin/payroll-karyawan/slip-email-bulk error:', err);

    return NextResponse.json({ message: err?.message || 'Gagal mengirim payslip massal.' }, { status: err?.status || 500 });
  }
}
