export const runtime = 'nodejs';

import crypto from 'crypto';
import { NextResponse } from 'next/server';

import transporter from '@/app/utils/mailer/mailer';
import db from '@/lib/prisma';

import { ensureAuth, normRole } from '../../../payrollKaryawan.shared';

const SUPER_ROLES = new Set(['SUPERADMIN']);
const PENDING_DECISIONS = new Set(['pending']);
const OTP_TTL_MINUTES = 10;

function isSuperAdmin(role) {
  return SUPER_ROLES.has(normRole(role));
}

function hashOtp(value) {
  return crypto.createHash('sha256').update(String(value || '').trim()).digest('hex');
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function POST(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const actorId = String(auth.actor?.id || '').trim();
  const actorRole = normRole(auth.actor?.role);
  const approvalId = String(params?.id || '').trim();

  if (!actorId) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
  }

  if (!approvalId) {
    return NextResponse.json({ message: 'ID approval wajib diisi.' }, { status: 400 });
  }

  try {
    const approval = await db.approvalPayrollKaryawan.findUnique({
      where: { id_approval_payroll_karyawan: approvalId },
      select: {
        id_approval_payroll_karyawan: true,
        id_payroll_karyawan: true,
        level: true,
        approver_user_id: true,
        approver_role: true,
        approver_nama_snapshot: true,
        decision: true,
        deleted_at: true,
        approver: {
          select: {
            id_user: true,
            nama_pengguna: true,
            email: true,
          },
        },
        payroll_karyawan: {
          select: {
            id_payroll_karyawan: true,
            nama_karyawan: true,
            deleted_at: true,
            periode: {
              select: {
                bulan: true,
                tahun: true,
              },
            },
          },
        },
      },
    });

    if (!approval || approval.deleted_at) {
      return NextResponse.json({ message: 'Approval payroll tidak ditemukan.' }, { status: 404 });
    }

    if (!approval.payroll_karyawan || approval.payroll_karyawan.deleted_at) {
      return NextResponse.json({ message: 'Payroll karyawan tidak ditemukan.' }, { status: 404 });
    }

    const matchesUser = String(approval.approver_user_id || '').trim() === actorId;
    const matchesRole = !approval.approver_user_id && normRole(approval.approver_role) === actorRole;

    if (!matchesUser && !matchesRole && !isSuperAdmin(actorRole)) {
      return NextResponse.json({ message: 'Anda tidak memiliki akses untuk approval payroll ini.' }, { status: 403 });
    }

    if (!PENDING_DECISIONS.has(String(approval.decision || '').trim().toLowerCase())) {
      return NextResponse.json({ message: 'Approval payroll sudah memiliki keputusan.' }, { status: 409 });
    }

    const approverEmail = String(approval.approver?.email || '').trim().toLowerCase();
    if (!approverEmail) {
      return NextResponse.json({ message: 'Email approver tidak tersedia.' }, { status: 400 });
    }

    await transporter.verify();

    const rawOtp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await db.approvalPayrollKaryawan.update({
      where: { id_approval_payroll_karyawan: approvalId },
      data: {
        kode_otp_hash: hashOtp(rawOtp),
        otp_requested_at: new Date(),
        otp_expires_at: expiresAt,
        otp_verified_at: null,
        otp_attempts: 0,
      },
    });

    try {
      await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME || 'E-HRM'}" <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME}>`,
        to: approverEmail,
        subject: 'Kode OTP Approval Payroll E-HRM',
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
            <h2>Approval Payroll</h2>
            <p>Halo ${approval.approver?.nama_pengguna || approval.approver_nama_snapshot || ''},</p>
            <p>Berikut kode OTP untuk menyetujui payroll karyawan <b>${approval.payroll_karyawan.nama_karyawan || '-'}</b>.</p>
            <div style="font-size:28px;font-weight:700;letter-spacing:4px;padding:12px 16px;border:1px solid #e5e7eb;display:inline-block;border-radius:8px;">
              ${rawOtp}
            </div>
            <p style="margin-top:12px"><small>Kode berlaku selama <b>${OTP_TTL_MINUTES} menit</b>. Jangan berikan kode ini kepada siapa pun.</small></p>
          </div>
        `,
      });
    } catch (mailErr) {
      await db.approvalPayrollKaryawan.update({
        where: { id_approval_payroll_karyawan: approvalId },
        data: {
          kode_otp_hash: null,
          otp_requested_at: null,
          otp_expires_at: null,
          otp_attempts: 0,
        },
      });
      throw mailErr;
    }

    return NextResponse.json({
      message: 'Kode OTP approval telah dikirim ke email approver.',
      data: {
        otp_expires_at: expiresAt,
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json({ message: err.message }, { status: err.status || 500 });
    }

    console.error('POST /api/admin/payroll-karyawan/approvals/[id]/otp error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
