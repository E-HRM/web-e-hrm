export const runtime = 'nodejs';

import crypto from 'crypto';
import { NextResponse } from 'next/server';

import { isNullLike, parseRequestBody } from '@/app/api/_utils/requestBody';
import db from '@/lib/prisma';

import { buildSelect, deriveApprovalState, ensureAuth, enrichPayroll, normRole } from '../../payrollKaryawan.shared';

const APPROVE_DECISIONS = new Set(['disetujui']);
const PENDING_DECISIONS = new Set(['pending']);
const SUPER_ROLES = new Set(['SUPERADMIN']);
const MAX_OTP_ATTEMPTS = 5;

function createHttpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function isSuperAdmin(role) {
  return SUPER_ROLES.has(normRole(role));
}

function hashOtp(value) {
  return crypto.createHash('sha256').update(String(value || '').trim()).digest('hex');
}

function isOtpMatch(rawOtp, storedHash) {
  const rawHash = hashOtp(rawOtp);
  const left = Buffer.from(rawHash, 'hex');
  const right = Buffer.from(String(storedHash || ''), 'hex');

  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

async function syncPayrollApprovalState(id_payroll_karyawan) {
  const approvals = await db.approvalPayrollKaryawan.findMany({
    where: {
      id_payroll_karyawan,
      deleted_at: null,
    },
    orderBy: {
      level: 'asc',
    },
    select: {
      id_approval_payroll_karyawan: true,
      level: true,
      decision: true,
      deleted_at: true,
    },
  });

  const approvalState = deriveApprovalState(approvals);

  await db.payrollKaryawan.update({
    where: { id_payroll_karyawan },
    data: {
      status_approval: approvalState.status_approval,
      current_level_approval: approvalState.current_level_approval,
    },
  });

  return db.payrollKaryawan.findUnique({
    where: { id_payroll_karyawan },
    select: buildSelect(),
  });
}

export async function PATCH(req, { params }) {
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

  let body;
  try {
    const parsed = await parseRequestBody(req);
    body = parsed.body;
  } catch (err) {
    return NextResponse.json({ message: err?.message || 'Body tidak valid.' }, { status: err?.status || 400 });
  }

  const decision = String(body?.decision || 'disetujui')
    .trim()
    .toLowerCase();
  if (!APPROVE_DECISIONS.has(decision)) {
    return NextResponse.json({ message: "decision wajib 'disetujui'." }, { status: 400 });
  }

  const kodeOtp = !isNullLike(body?.kode_otp) ? String(body.kode_otp).trim() : !isNullLike(body?.otp) ? String(body.otp).trim() : '';
  if (!kodeOtp) {
    return NextResponse.json({ message: 'Kode OTP wajib diisi.' }, { status: 400 });
  }

  const note = !isNullLike(body?.note) ? String(body.note).trim() : null;

  try {
    const result = await db.$transaction(async (tx) => {
      const approvalRecord = await tx.approvalPayrollKaryawan.findUnique({
        where: { id_approval_payroll_karyawan: approvalId },
        select: {
          id_approval_payroll_karyawan: true,
          id_payroll_karyawan: true,
          level: true,
          approver_user_id: true,
          approver_role: true,
          decision: true,
          kode_otp_hash: true,
          otp_expires_at: true,
          otp_attempts: true,
          deleted_at: true,
          payroll_karyawan: {
            select: {
              id_payroll_karyawan: true,
              deleted_at: true,
            },
          },
        },
      });

      if (!approvalRecord || approvalRecord.deleted_at) {
        throw createHttpError('Approval payroll tidak ditemukan.', 404);
      }

      if (!approvalRecord.payroll_karyawan || approvalRecord.payroll_karyawan.deleted_at) {
        throw createHttpError('Payroll karyawan tidak ditemukan.', 404);
      }

      const matchesUser = String(approvalRecord.approver_user_id || '').trim() === actorId;
      const matchesRole = !approvalRecord.approver_user_id && normRole(approvalRecord.approver_role) === actorRole;

      if (!matchesUser && !matchesRole && !isSuperAdmin(actorRole)) {
        throw createHttpError('Anda tidak memiliki akses untuk approval payroll ini.', 403);
      }

      if (!PENDING_DECISIONS.has(String(approvalRecord.decision || '').trim().toLowerCase())) {
        throw createHttpError('Approval payroll sudah memiliki keputusan.', 409);
      }

      if (!approvalRecord.kode_otp_hash || !approvalRecord.otp_expires_at) {
        throw createHttpError('Kode OTP belum diminta atau sudah tidak tersedia.', 400);
      }

      if (Number(approvalRecord.otp_attempts || 0) >= MAX_OTP_ATTEMPTS) {
        throw createHttpError('Percobaan OTP sudah melebihi batas. Kirim ulang kode OTP.', 429);
      }

      if (new Date(approvalRecord.otp_expires_at).getTime() <= Date.now()) {
        throw createHttpError('Kode OTP sudah kedaluwarsa. Kirim ulang kode OTP.', 400);
      }

      if (!isOtpMatch(kodeOtp, approvalRecord.kode_otp_hash)) {
        await tx.approvalPayrollKaryawan.update({
          where: { id_approval_payroll_karyawan: approvalId },
          data: {
            otp_attempts: {
              increment: 1,
            },
          },
        });
        throw createHttpError('Kode OTP tidak valid.', 400);
      }

      await tx.approvalPayrollKaryawan.update({
        where: { id_approval_payroll_karyawan: approvalId },
        data: {
          decision,
          decided_at: new Date(),
          note,
          kode_otp_hash: null,
          otp_expires_at: null,
          otp_verified_at: new Date(),
          otp_attempts: 0,
        },
      });

      return {
        id_payroll_karyawan: approvalRecord.id_payroll_karyawan,
      };
    });

    let refreshedPayroll = null;
    try {
      refreshedPayroll = await syncPayrollApprovalState(result.id_payroll_karyawan);
    } catch (syncError) {
      console.error('Sync approval payroll state gagal, fallback ke data latest:', syncError);
      refreshedPayroll = await db.payrollKaryawan.findUnique({
        where: { id_payroll_karyawan: result.id_payroll_karyawan },
        select: buildSelect(),
      });
    }

    if (!refreshedPayroll) {
      throw createHttpError('Payroll karyawan tidak ditemukan setelah approval disimpan.', 404);
    }

    return NextResponse.json({
      message: 'Approval payroll karyawan berhasil disimpan.',
      data: enrichPayroll(refreshedPayroll),
    });
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json({ message: err.message }, { status: err.status || 500 });
    }

    console.error('PATCH /api/admin/payroll-karyawan/approvals/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
