import transporter from '@/app/utils/mailer/mailer';

import { buildSlipPayload } from './payrollKaryawan.shared';
import { buildSlipFilename, buildSlipPdf } from './[id]/slip/pdf/slipPdf.shared';

export function normalizeText(value) {
  return String(value || '').trim();
}

export function normalizeEmail(value) {
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

export function parseCc(value) {
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

export async function readJsonBody(req) {
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

function formatBulanEmail(value) {
  const map = {
    JANUARI: 'January',
    FEBRUARI: 'February',
    MARET: 'March',
    APRIL: 'April',
    MEI: 'May',
    JUNI: 'June',
    JULI: 'July',
    AGUSTUS: 'August',
    SEPTEMBER: 'September',
    OKTOBER: 'October',
    NOVEMBER: 'November',
    DESEMBER: 'December',
  };

  return map[normalizeText(value).toUpperCase()] || formatBulan(value);
}

export function formatPeriodeLabel(periode) {
  if (!periode) return '-';
  return `${formatBulan(periode.bulan)} ${periode.tahun || '-'}`;
}

function formatPeriodeEmailLabel(periode) {
  if (!periode) return '-';
  return `${formatBulanEmail(periode.bulan)} ${periode.tahun || '-'}`;
}

export function buildMailFrom() {
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

export async function verifyPayslipMailer() {
  await transporter.verify();
}

export function buildEmailHtml(message) {
  const normalizedMessage = normalizeText(message);
  if (!normalizedMessage) return '';

  return `
    <div style="font-family:Arial,Helvetica,sans-serif; line-height:1.6; color:#111827;">
      ${escapeHtml(normalizedMessage).replace(/\n/g, '<br />')}
    </div>
  `;
}

export function getSlipEmployeeName(slip, payroll) {
  return slip?.employee?.nama_karyawan || payroll?.user?.nama_pengguna || payroll?.freelance?.nama || payroll?.nama_karyawan || 'Karyawan';
}

export function renderPayslipMessage(message, slip, payroll) {
  const normalizedMessage = normalizeText(message);
  if (!normalizedMessage) return '';

  const employeeName = getSlipEmployeeName(slip, payroll);
  const monthYear = formatPeriodeEmailLabel(slip?.period || payroll?.periode);

  return normalizedMessage
    .replaceAll('[Employee Name]', employeeName)
    .replaceAll('[Month Year]', monthYear)
    .replaceAll('{{Employee Name}}', employeeName)
    .replaceAll('{{Month Year}}', monthYear)
    .replaceAll('{Employee Name}', employeeName)
    .replaceAll('{Month Year}', monthYear);
}

export async function sendPayrollSlipEmail({ payroll, payrollId, cc = [], message = '', from }) {
  if (!payroll || payroll.deleted_at) {
    const err = new Error('Slip payroll tidak ditemukan.');
    err.status = 404;
    throw err;
  }

  const recipientEmail = normalizeEmail(payroll?.user?.email || payroll?.freelance?.email);

  if (!recipientEmail) {
    const err = new Error('Email penerima payroll tidak tersedia atau formatnya tidak valid.');
    err.status = 422;
    throw err;
  }

  const slip = buildSlipPayload(payroll);
  const pdfBytes = await buildSlipPdf(slip);
  const filename = buildSlipFilename(slip, payrollId);
  const periodeLabel = formatPeriodeLabel(slip?.period);
  const employeeName = getSlipEmployeeName(slip, payroll);
  const subject = `Slip Gaji ${periodeLabel} - ${employeeName}`;
  const renderedMessage = renderPayslipMessage(message, slip, payroll);

  await transporter.sendMail({
    from: from || buildMailFrom(),
    to: recipientEmail,
    cc,
    subject,
    text: renderedMessage,
    html: buildEmailHtml(renderedMessage),
    attachments: [
      {
        filename,
        content: Buffer.from(pdfBytes),
        contentType: 'application/pdf',
      },
    ],
  });

  return {
    to: recipientEmail,
    cc,
    filename,
    employeeName,
    periodeLabel,
  };
}
