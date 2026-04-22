export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { findFileInBody, isNullLike, parseRequestBody } from '@/app/api/_utils/requestBody';
import db from '@/lib/prisma';

import { buildSelect, deriveApprovalState, ensureAuth, enrichPayroll, normRole } from '../../payrollKaryawan.shared';

const APPROVE_DECISIONS = new Set(['disetujui']);
const PENDING_DECISIONS = new Set(['pending']);
const SUPER_ROLES = new Set(['SUPERADMIN']);
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'e-hrm';

function createHttpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw createHttpError('Supabase env tidak lengkap.', 500);
  }

  return createClient(url, key);
}

function extractBucketPath(publicUrl) {
  if (!publicUrl) return null;

  try {
    const url = new URL(publicUrl);
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (match) {
      return {
        bucket: match[1],
        path: decodeURIComponent(match[2]),
      };
    }
  } catch (_) {
    const fallback = String(publicUrl).match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (fallback) {
      return {
        bucket: fallback[1],
        path: decodeURIComponent(fallback[2]),
      };
    }
  }

  return null;
}

function sanitizePathPart(part) {
  const safe = String(part || '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);

  return safe || 'unknown';
}

async function uploadTtdToSupabase(actorId, approvalId, file) {
  if (!file) return null;

  const supabase = getSupabase();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extCandidate = (file.name?.split('.').pop() || '').toLowerCase();
  const ext = extCandidate && /^[a-z0-9]+$/.test(extCandidate) ? extCandidate : 'bin';
  const timestamp = Date.now();
  const safeActorId = sanitizePathPart(actorId);
  const safeApprovalId = sanitizePathPart(approvalId);
  const path = `payroll/approval_ttd/${safeActorId}/${safeApprovalId}-${timestamp}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, buffer, {
    upsert: true,
    contentType: file.type || 'application/octet-stream',
  });

  if (uploadError) {
    throw createHttpError(`Gagal upload TTD approval: ${uploadError.message}`, 502);
  }

  const { data: publicData, error: publicError } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  if (publicError) {
    throw createHttpError(`Gagal membuat URL TTD approval: ${publicError.message}`, 502);
  }

  return publicData?.publicUrl || null;
}

async function deleteTtdFromSupabase(publicUrl) {
  const info = extractBucketPath(publicUrl);
  if (!info) return;

  try {
    const supabase = getSupabase();
    const { error } = await supabase.storage.from(info.bucket).remove([info.path]);
    if (error) {
      console.warn('Gagal hapus TTD approval lama:', error.message);
    }
  } catch (err) {
    console.warn('Gagal hapus TTD approval lama:', err?.message || err);
  }
}

function isSuperAdmin(role) {
  return SUPER_ROLES.has(normRole(role));
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

  const note = !isNullLike(body?.note) ? String(body.note).trim() : null;
  const ttdFile = findFileInBody(body, ['ttd_approval', 'ttd', 'file']);
  const directUrl = Object.prototype.hasOwnProperty.call(body || {}, 'ttd_approval_url') && !isNullLike(body?.ttd_approval_url) ? String(body.ttd_approval_url).trim() : null;

  if (!ttdFile && !directUrl) {
    return NextResponse.json({ message: 'TTD approval wajib diisi.' }, { status: 400 });
  }

  let uploadedUrl = null;

  try {
    const initialApproval = await db.approvalPayrollKaryawan.findUnique({
      where: { id_approval_payroll_karyawan: approvalId },
      select: {
        id_approval_payroll_karyawan: true,
        id_payroll_karyawan: true,
        approver_user_id: true,
        approver_role: true,
        ttd_approval_url: true,
        deleted_at: true,
      },
    });

    if (!initialApproval || initialApproval.deleted_at) {
      return NextResponse.json({ message: 'Approval payroll tidak ditemukan.' }, { status: 404 });
    }

    const matchesAssignedUser = String(initialApproval.approver_user_id || '').trim() === actorId;
    const matchesRoleFallback = !initialApproval.approver_user_id && normRole(initialApproval.approver_role) === actorRole;

    if (!matchesAssignedUser && !matchesRoleFallback && !isSuperAdmin(actorRole)) {
      return NextResponse.json({ message: 'Anda tidak memiliki akses untuk approval payroll ini.' }, { status: 403 });
    }

    if (ttdFile) {
      uploadedUrl = await uploadTtdToSupabase(actorId, approvalId, ttdFile);
    }

    const nextTtdUrl = uploadedUrl || directUrl;
    const oldTtdUrl = initialApproval.ttd_approval_url;

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

      const siblingApprovals = await tx.approvalPayrollKaryawan.findMany({
        where: {
          id_payroll_karyawan: approvalRecord.id_payroll_karyawan,
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

      const approvalStateBefore = deriveApprovalState(siblingApprovals);
      if (approvalStateBefore.current_step?.id_approval_payroll_karyawan !== approvalId) {
        throw createHttpError('Approval ini bukan level aktif saat ini.', 409);
      }

      await tx.approvalPayrollKaryawan.update({
        where: { id_approval_payroll_karyawan: approvalId },
        data: {
          decision,
          decided_at: new Date(),
          note,
          ttd_approval_url: nextTtdUrl,
        },
      });

      const updatedApprovals = await tx.approvalPayrollKaryawan.findMany({
        where: {
          id_payroll_karyawan: approvalRecord.id_payroll_karyawan,
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

      const approvalState = deriveApprovalState(updatedApprovals);

      await tx.payrollKaryawan.update({
        where: { id_payroll_karyawan: approvalRecord.id_payroll_karyawan },
        data: {
          status_approval: approvalState.status_approval,
          current_level_approval: approvalState.current_level_approval,
        },
      });

      const refreshedPayroll = await tx.payrollKaryawan.findUnique({
        where: { id_payroll_karyawan: approvalRecord.id_payroll_karyawan },
        select: buildSelect(),
      });

      return {
        payroll: refreshedPayroll,
        oldTtdUrl,
        nextTtdUrl,
      };
    });

    if (result.oldTtdUrl && result.oldTtdUrl !== result.nextTtdUrl) {
      await deleteTtdFromSupabase(result.oldTtdUrl);
    }

    return NextResponse.json({
      message: 'Approval payroll karyawan berhasil disimpan.',
      data: enrichPayroll(result.payroll),
    });
  } catch (err) {
    if (uploadedUrl) {
      await deleteTtdFromSupabase(uploadedUrl);
    }

    if (err instanceof Error) {
      return NextResponse.json({ message: err.message }, { status: err.status || 500 });
    }

    console.error('PATCH /api/admin/payroll-karyawan/approvals/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
