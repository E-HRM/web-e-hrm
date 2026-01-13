import transporter from '@/app/utils/mailer/mailer';

const dateIsoFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'UTC',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const dateDisplayFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'long',
  day: '2-digit',
});

function formatDateISO(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return dateIsoFormatter.format(d);
}

function formatDateDisplay(value) {
  if (!value) return '-';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return dateDisplayFormatter.format(d);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getBaseUrlFromRequest(req) {
  const origin = req?.headers?.get?.('origin');
  if (origin) return origin;

  const host = req?.headers?.get?.('host');
  if (!host) return process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || null;

  const proto = req.headers.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

function normalizeEmail(email) {
  const v = String(email || '')
    .trim()
    .toLowerCase();
  if (!v || !v.includes('@')) return null;
  return v;
}

function uniqueEmails(emails) {
  const out = [];
  const seen = new Set();
  for (const e of emails || []) {
    const n = normalizeEmail(e);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function makeFieldRow(label, value) {
  const safeLabel = escapeHtml(label);
  const safeValue = escapeHtml(value);
  return `<tr><td style="padding:4px 10px 4px 0;color:#6b7280;vertical-align:top">${safeLabel}</td><td style="padding:4px 0;vertical-align:top">${safeValue}</td></tr>`;
}

function makeEmailHtml({ title, introLines, fields, buttonUrl, buttonText }) {
  const safeTitle = escapeHtml(title);
  const intro = (introLines || []).map((l) => `<p style="margin:0 0 10px 0">${escapeHtml(l)}</p>`).join('');

  const rows = (fields || []).map((f) => makeFieldRow(f.label, f.value)).join('');
  const table = rows ? `<table style="border-collapse:collapse;margin:0 0 16px 0">${rows}</table>` : '';

  const btn = buttonUrl
    ? `<p style="margin:0 0 18px 0"><a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px">${escapeHtml(buttonText || 'Buka')}</a></p>`
    : '';

  return `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;line-height:1.5;color:#111827">
      <h2 style="margin:0 0 12px 0;font-size:18px">${safeTitle}</h2>
      ${intro}
      ${table}
      ${btn}
      <p style="margin:0;color:#6b7280;font-size:12px">Email ini dikirim otomatis oleh sistem E-HRM.</p>
    </div>
  `;
}

async function sendBatch({ from, to, subject, html }) {
  const recipients = uniqueEmails(to);
  if (!recipients.length) return { sent: 0, failed: 0 };

  const tasks = recipients.map((email) =>
    transporter.sendMail({
      from,
      to: email,
      subject,
      html,
    })
  );

  const results = await Promise.allSettled(tasks);
  let sent = 0;
  let failed = 0;

  for (const r of results) {
    if (r.status === 'fulfilled') sent += 1;
    else failed += 1;
  }

  if (failed) {
    console.warn(
      'sendBatch: some emails failed:',
      results.filter((r) => r.status === 'rejected').map((r) => r.reason?.message || String(r.reason))
    );
  }

  return { sent, failed };
}

function collectTanggalInfo(pengajuan) {
  const rawDates = (pengajuan?.tanggal_list || [])
    .map((d) => (d?.tanggal_cuti instanceof Date ? d.tanggal_cuti : new Date(d?.tanggal_cuti)))
    .filter((d) => d instanceof Date && !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const first = rawDates[0] || null;
  const last = rawDates[rawDates.length - 1] || null;

  const firstDisplay = formatDateDisplay(first);
  const lastDisplay = formatDateDisplay(last);

  const label = first && last && formatDateISO(first) !== formatDateISO(last) ? `${firstDisplay} s/d ${lastDisplay}` : firstDisplay;

  return {
    first,
    last,
    label,
    count: rawDates.length,
  };
}

export async function sendPengajuanCutiEmailNotifications(req, pengajuan) {
  const username = process.env.MAIL_USERNAME;
  const password = process.env.MAIL_PASSWORD;
  const from = process.env.MAIL_FROM || username;

  if (!from || !username || !password) return;
  if (!pengajuan) return;

  const baseUrl = getBaseUrlFromRequest(req);
  const deeplink = `/pengajuan-cuti/${pengajuan.id_pengajuan_cuti}`;
  const url = baseUrl ? `${baseUrl}${deeplink}` : deeplink;

  const pemohonName = pengajuan.user?.nama_pengguna || 'Karyawan';
  const pemohonEmail = pengajuan.user?.email || null;

  const departement = pengajuan.user?.departement?.nama_departement || '-';
  const jabatan = pengajuan.user?.jabatan?.nama_jabatan || '-';
  const kategori = pengajuan.kategori_cuti?.nama_kategori || '-';

  const tanggalInfo = collectTanggalInfo(pengajuan);
  const tanggalMasukDisplay = formatDateDisplay(pengajuan.tanggal_masuk_kerja);

  const keperluan = pengajuan.keperluan || '-';
  const handoverText = pengajuan.handover || '-';

  const fields = [
    { label: 'Pemohon', value: pemohonName },
    { label: 'Departemen', value: departement },
    { label: 'Jabatan', value: jabatan },
    { label: 'Kategori', value: kategori },
    { label: 'Tanggal cuti', value: tanggalInfo.label },
    { label: 'Tanggal masuk', value: tanggalMasukDisplay },
    { label: 'Keperluan', value: keperluan },
    { label: 'Handover', value: handoverText },
  ];

  const approverEmails = (pengajuan.approvals || []).map((a) => a?.approver?.email).filter(Boolean);
  const handoverEmails = (pengajuan.handover_users || []).map((h) => h?.user?.email).filter(Boolean);

  const ops = [];

  if (approverEmails.length) {
    const subject = `[E-HRM] Persetujuan Cuti: ${pemohonName} (${tanggalInfo.label})`;
    const html = makeEmailHtml({
      title: 'Permintaan Persetujuan Cuti',
      introLines: ['Anda dipilih sebagai approver untuk pengajuan cuti berikut.'],
      fields,
      buttonUrl: url,
      buttonText: 'Buka Pengajuan Cuti',
    });
    ops.push(sendBatch({ from, to: approverEmails, subject, html }));
  }

  if (handoverEmails.length) {
    const subject = `[E-HRM] Anda ditunjuk sebagai handover cuti (${pemohonName})`;
    const html = makeEmailHtml({
      title: 'Penunjukan Handover Cuti',
      introLines: [`Anda ditunjuk sebagai handover untuk pengajuan cuti dari ${pemohonName}.`],
      fields,
      buttonUrl: url,
      buttonText: 'Buka Pengajuan Cuti',
    });
    ops.push(sendBatch({ from, to: handoverEmails, subject, html }));
  }

  if (pemohonEmail) {
    const subject = `[E-HRM] Pengajuan Cuti Terkirim (${tanggalInfo.label})`;
    const html = makeEmailHtml({
      title: 'Pengajuan Cuti Berhasil Dikirim',
      introLines: ['Pengajuan cuti Anda telah berhasil dibuat dan dikirim untuk diproses.'],
      fields,
      buttonUrl: url,
      buttonText: 'Lihat Pengajuan Cuti',
    });
    ops.push(sendBatch({ from, to: [pemohonEmail], subject, html }));
  }

  if (!ops.length) return;

  await Promise.allSettled(ops);
}
