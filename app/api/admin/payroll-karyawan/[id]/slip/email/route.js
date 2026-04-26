export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

import db from '@/lib/prisma';
import transporter from '@/app/utils/mailer/mailer';

import { buildSlipPayload, buildSlipSelect, ensureAuth, guardRole, VIEW_ROLES } from '../../../payrollKaryawan.shared';
import { buildSlipFilename, buildSlipPdf } from '../pdf/slipPdf.shared';

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeEmail(value) {
  const email = normalizeText(value).toLowerCase();
  if (!email) return '';

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return isValid ? email : '';
}

function splitEmailList(value) {
  if (Array.isArray(value)) return value;

  return normalizeText(value)
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCc(value) {
  const rawEmails = splitEmailList(value);
  const emails = [];
  const invalidEmails = [];
  const seen = new Set();

  rawEmails.forEach((item) => {
    const email = normalizeEmail(item);

    if (!email) {
      invalidEmails.push(item);
      return;
    }

    if (seen.has(email)) return;

    seen.add(email);
    emails.push(email);
  });

  if (invalidEmails.length) {
    const err = new Error(`Format email CC tidak valid: ${invalidEmails.join(', ')}`);
    err.status = 400;
    throw err;
  }

  return emails;
}

async function readJsonBody(req) {
  try {
    return await req.json();
  } catch (_) {
    return {};
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatBulan(value) {
  const map = {
    JANUARI: 'Januari',
    FEBRUARI: 'Februari',
    MARET: 'Maret',
    APRIL: 'April',
    MEI: 'Mei',
    JUNI: 'Juni',
    JULI: 'Juli',
    AGUSTUS: 'Agustus',
    SEPTEMBER: 'September',
    OKTOBER: 'Oktober',
    NOVEMBER: 'November',
    DESEMBER: 'Desember',
  };

  return map[normalizeText(value).toUpperCase()] || '-';
}

function formatPeriodeLabel(periode) {
  if (!periode) return '-';
  return `${formatBulan(periode.bulan)} ${periode.tahun || '-'}`;
}

function buildMailFrom() {
  const username = normalizeText(process.env.MAIL_USERNAME);
  const password = normalizeText(process.env.MAIL_PASSWORD);
  const fromAddress = normalizeText(process.env.MAIL_FROM || username);

  if (!username || !password) {
    const err = new Error('Konfigurasi SMTP belum lengkap. Pastikan MAIL_USERNAME dan MAIL_PASSWORD sudah diisi.');
    err.status = 500;
    throw err;
  }

  if (!fromAddress) {
    const err = new Error('Konfigurasi pengirim email belum lengkap. Pastikan MAIL_FROM atau MAIL_USERNAME sudah diisi.');
    err.status = 500;
    throw err;
  }

  const fromName = normalizeText(process.env.MAIL_FROM_NAME || 'E-HRM');
  return fromName ? `"${fromName.replaceAll('"', '\\"')}" <${fromAddress}>` : fromAddress;
}

function buildEmailHtml(message) {
  const normalizedMessage = normalizeText(message);
  if (!normalizedMessage) return '';

  return `
    <div style="font-family:Arial,Helvetica,sans-serif; line-height:1.6; color:#111827;">
      ${escapeHtml(normalizedMessage).replace(/\n/g, '<br />')}
    </div>
  `;
}

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
      return NextResponse.json({ message: 'Slip payroll karyawan tidak ditemukan.' }, { status: 404 });
    }

    const recipientEmail = normalizeEmail(payroll?.user?.email);

    if (!recipientEmail) {
      return NextResponse.json({ message: 'Email karyawan tidak tersedia atau formatnya tidak valid.' }, { status: 422 });
    }

    const slip = buildSlipPayload(payroll);
    const pdfBytes = await buildSlipPdf(slip);
    const filename = buildSlipFilename(slip, id);
    const periodeLabel = formatPeriodeLabel(slip?.period);
    const employeeName = slip?.employee?.nama_karyawan || payroll?.user?.nama_pengguna || payroll?.nama_karyawan || 'Karyawan';
    const subject = `Slip Gaji ${periodeLabel} - ${employeeName}`;
    const from = buildMailFrom();

    await transporter.verify();

    await transporter.sendMail({
      from,
      to: recipientEmail,
      cc,
      subject,
      text: additionalMessage,
      html: buildEmailHtml(additionalMessage),
      attachments: [
        {
          filename,
          content: Buffer.from(pdfBytes),
          contentType: 'application/pdf',
        },
      ],
    });

    return NextResponse.json({
      message: 'Payslip berhasil dikirim ke email karyawan.',
      data: {
        to: recipientEmail,
        cc,
        filename,
      },
    });
  } catch (err) {
    console.error('POST /api/admin/payroll-karyawan/[id]/slip/email error:', err);

    return NextResponse.json({ message: err?.message || 'Gagal mengirim payslip.' }, { status: err?.status || 500 });
  }
}
