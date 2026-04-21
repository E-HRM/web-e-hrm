import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const EDIT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const DELETE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const APPROVE_STATUS_VALUES = new Set(['pending', 'disetujui', 'ditolak']);
const ROLE_VALUES = new Set(['KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI']);

const normRole = (role) =>
  String(role || '')
    .trim()
    .toUpperCase();

function normalizeRequiredInt(value, fieldName, options = {}) {
  const { min = null, max = null } = options;

  if (value === undefined || value === null || value === '') {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  const normalized = Number(value);
  if (!Number.isInteger(normalized)) {
    throw new Error(`Field '${fieldName}' harus berupa bilangan bulat.`);
  }

  if (min !== null && normalized < min) {
    throw new Error(`Field '${fieldName}' tidak boleh lebih kecil dari ${min}.`);
  }

  if (max !== null && normalized > max) {
    throw new Error(`Field '${fieldName}' tidak boleh lebih besar dari ${max}.`);
  }

  return normalized;
}

function normalizeNullableString(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  return normalized;
}

function normalizeApproveStatus(value, fieldName = 'keputusan') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (!normalized) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  if (!APPROVE_STATUS_VALUES.has(normalized)) {
    throw new Error(`${fieldName} tidak valid. Nilai yang diizinkan: ${Array.from(APPROVE_STATUS_VALUES).join(', ')}`);
  }

  return normalized;
}

function normalizeOptionalApproveStatus(value, fieldName = 'keputusan') {
  if (value === undefined || value === null || value === '') return undefined;
  return normalizeApproveStatus(value, fieldName);
}

function normalizeRoleEnum(value, fieldName = 'role_penyetuju') {
  const normalized = normRole(value);

  if (!normalized) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  if (!ROLE_VALUES.has(normalized)) {
    throw new Error(`${fieldName} tidak valid. Nilai yang diizinkan: ${Array.from(ROLE_VALUES).join(', ')}`);
  }

  return normalized;
}

function normalizeOptionalRoleEnum(value, fieldName = 'role_penyetuju') {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  return normalizeRoleEnum(value, fieldName);
}

function parseDateTime(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Field '${fieldName}' harus berupa tanggal/waktu yang valid.`);
  }

  return parsed;
}

async function ensureAuth(req) {
  const auth = req.headers.get('authorization') || '';

  if (auth.startsWith('Bearer ')) {
    try {
      const payload = verifyAuthToken(auth.slice(7));
      return {
        actor: {
          id: payload?.sub || payload?.id_user || payload?.userId,
          role: normRole(payload?.role),
          source: 'bearer',
        },
      };
    } catch (_) {
      // fallback ke session
    }
  }

  const sessionOrRes = await authenticateRequest();
  if (sessionOrRes instanceof NextResponse) return sessionOrRes;

  return {
    actor: {
      id: sessionOrRes?.user?.id || sessionOrRes?.user?.id_user,
      role: normRole(sessionOrRes?.user?.role),
      source: 'session',
    },
  };
}

function guardRole(actor, allowedRoles) {
  if (!allowedRoles.has(normRole(actor?.role))) {
    return NextResponse.json({ message: 'Forbidden: Anda tidak memiliki akses ke resource ini.' }, { status: 403 });
  }

  return null;
}

function buildSelect() {
  return {
    id_persetujuan_periode_payroll: true,
    id_periode_payroll: true,
    level: true,
    id_user_penyetuju: true,
    role_penyetuju: true,
    keputusan: true,
    diputuskan_pada: true,
    catatan: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    periode_payroll: {
      select: {
        id_periode_payroll: true,
        tahun: true,
        bulan: true,
        tanggal_mulai: true,
        tanggal_selesai: true,
        status_periode: true,
        diproses_pada: true,
        difinalkan_pada: true,
        deleted_at: true,
      },
    },
    penyetuju: {
      select: {
        id_user: true,
        nama_pengguna: true,
        email: true,
        role: true,
        foto_profil_user: true,
        deleted_at: true,
      },
    },
  };
}

async function ensurePeriodeExists(id_periode_payroll) {
  const periode = await db.periodePayroll.findUnique({
    where: { id_periode_payroll },
    select: {
      id_periode_payroll: true,
      deleted_at: true,
    },
  });

  if (!periode) {
    throw new Error("Periode payroll dengan field 'id_periode_payroll' tidak ditemukan.");
  }

  if (periode.deleted_at) {
    throw new Error('Periode payroll yang dipilih sudah dihapus.');
  }

  return periode;
}

async function ensureApproverConsistency({ id_user_penyetuju, role_penyetuju }) {
  if (!id_user_penyetuju && !role_penyetuju) {
    throw new Error("Minimal salah satu dari 'id_user_penyetuju' atau 'role_penyetuju' wajib diisi.");
  }

  if (!id_user_penyetuju) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id_user: id_user_penyetuju },
    select: {
      id_user: true,
      role: true,
      deleted_at: true,
    },
  });

  if (!user) {
    throw new Error("User penyetuju dengan field 'id_user_penyetuju' tidak ditemukan.");
  }

  if (user.deleted_at) {
    throw new Error('User penyetuju sudah dihapus.');
  }

  if (role_penyetuju && normRole(user.role) !== normRole(role_penyetuju)) {
    throw new Error("Role user penyetuju tidak cocok dengan field 'role_penyetuju'.");
  }

  return user;
}

function deriveDecisionState({ keputusan, diputuskan_pada, touchedKeputusan, touchedDiputuskanPada }) {
  if (!keputusan) {
    return { keputusan, diputuskan_pada };
  }

  if (keputusan === 'pending') {
    if (diputuskan_pada) {
      throw new Error("Field 'diputuskan_pada' harus kosong jika 'keputusan' masih 'pending'.");
    }

    return {
      keputusan,
      diputuskan_pada: null,
    };
  }

  if (touchedDiputuskanPada) {
    if (!diputuskan_pada) {
      return {
        keputusan,
        diputuskan_pada: new Date(),
      };
    }

    return { keputusan, diputuskan_pada };
  }

  if (touchedKeputusan) {
    return {
      keputusan,
      diputuskan_pada: diputuskan_pada || new Date(),
    };
  }

  return { keputusan, diputuskan_pada };
}

export async function GET(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;

    const data = await db.persetujuanPeriodePayroll.findUnique({
      where: { id_persetujuan_periode_payroll: id },
      select: buildSelect(),
    });

    if (!data) {
      return NextResponse.json({ message: 'Persetujuan periode payroll tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/admin/persetujuan-periode-payroll/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, EDIT_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;
    const body = await req.json();

    const existing = await db.persetujuanPeriodePayroll.findUnique({
      where: { id_persetujuan_periode_payroll: id },
      select: {
        id_persetujuan_periode_payroll: true,
        id_periode_payroll: true,
        level: true,
        id_user_penyetuju: true,
        role_penyetuju: true,
        keputusan: true,
        diputuskan_pada: true,
        catatan: true,
        deleted_at: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Persetujuan periode payroll tidak ditemukan.' }, { status: 404 });
    }

    const payload = {};

    if (body?.id_periode_payroll !== undefined) {
      payload.id_periode_payroll = normalizeNullableString(body?.id_periode_payroll);
      if (!payload.id_periode_payroll) {
        return NextResponse.json({ message: "Field 'id_periode_payroll' tidak boleh kosong." }, { status: 400 });
      }
    }

    if (body?.level !== undefined) {
      payload.level = normalizeRequiredInt(body?.level, 'level', { min: 1 });
    }

    if (body?.id_user_penyetuju !== undefined) {
      payload.id_user_penyetuju = normalizeNullableString(body?.id_user_penyetuju);
    }

    if (body?.role_penyetuju !== undefined) {
      payload.role_penyetuju = normalizeOptionalRoleEnum(body?.role_penyetuju, 'role_penyetuju');
    }

    if (body?.keputusan !== undefined) {
      payload.keputusan = normalizeApproveStatus(body?.keputusan, 'keputusan');
    }

    if (body?.diputuskan_pada !== undefined) {
      payload.diputuskan_pada = parseDateTime(body?.diputuskan_pada, 'diputuskan_pada');
    }

    if (body?.catatan !== undefined) {
      payload.catatan = normalizeNullableString(body?.catatan);
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ message: 'Tidak ada field yang dikirim untuk diperbarui.' }, { status: 400 });
    }

    const nextPeriodeId = payload.id_periode_payroll ?? existing.id_periode_payroll;
    const nextLevel = payload.level ?? existing.level;
    const nextIdUserPenyetuju = Object.prototype.hasOwnProperty.call(payload, 'id_user_penyetuju') ? payload.id_user_penyetuju : existing.id_user_penyetuju;
    const nextRolePenyetuju = Object.prototype.hasOwnProperty.call(payload, 'role_penyetuju') ? payload.role_penyetuju : existing.role_penyetuju;
    const nextKeputusan = payload.keputusan ?? existing.keputusan;
    const nextDiputuskanPada = Object.prototype.hasOwnProperty.call(payload, 'diputuskan_pada') ? payload.diputuskan_pada : existing.diputuskan_pada;

    await ensurePeriodeExists(nextPeriodeId);
    await ensureApproverConsistency({
      id_user_penyetuju: nextIdUserPenyetuju,
      role_penyetuju: nextRolePenyetuju,
    });

    const duplicate =
      nextPeriodeId !== existing.id_periode_payroll || nextLevel !== existing.level
        ? await db.persetujuanPeriodePayroll.findFirst({
            where: {
              id_periode_payroll: nextPeriodeId,
              level: nextLevel,
              NOT: {
                id_persetujuan_periode_payroll: id,
              },
            },
            select: {
              id_persetujuan_periode_payroll: true,
              deleted_at: true,
            },
          })
        : null;

    if (duplicate) {
      return NextResponse.json(
        {
          message: duplicate.deleted_at ? 'Kombinasi periode payroll dan level tersebut sudah digunakan oleh data soft delete lain.' : 'Persetujuan periode payroll dengan kombinasi periode dan level tersebut sudah ada.',
        },
        { status: 409 },
      );
    }

    const decisionState = deriveDecisionState({
      keputusan: nextKeputusan,
      diputuskan_pada: nextDiputuskanPada,
      touchedKeputusan: body?.keputusan !== undefined,
      touchedDiputuskanPada: body?.diputuskan_pada !== undefined,
    });

    payload.keputusan = decisionState.keputusan;
    payload.diputuskan_pada = decisionState.diputuskan_pada;

    const updated = await db.persetujuanPeriodePayroll.update({
      where: { id_persetujuan_periode_payroll: id },
      data: payload,
      select: buildSelect(),
    });

    return NextResponse.json({
      message: 'Persetujuan periode payroll berhasil diperbarui.',
      data: updated,
    });
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json(
        {
          message: 'Persetujuan periode payroll dengan kombinasi periode dan level tersebut sudah ada.',
        },
        { status: 409 },
      );
    }

    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('tidak valid') || err.message.includes('wajib') || err.message.includes('tidak ditemukan') || err.message.includes('tidak cocok') || err.message.includes('sudah dihapus')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('PUT /api/admin/persetujuan-periode-payroll/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, DELETE_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);

    const isHardDelete = ['1', 'true'].includes((searchParams.get('hard') || '').toLowerCase());
    const isForceDelete = ['1', 'true'].includes((searchParams.get('force') || '').toLowerCase());
    const hardDelete = isHardDelete || isForceDelete;

    const existing = await db.persetujuanPeriodePayroll.findUnique({
      where: { id_persetujuan_periode_payroll: id },
      select: {
        id_persetujuan_periode_payroll: true,
        deleted_at: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Persetujuan periode payroll tidak ditemukan.' }, { status: 404 });
    }

    if (!hardDelete) {
      if (existing.deleted_at) {
        return NextResponse.json(
          {
            message: 'Persetujuan periode payroll sudah dihapus sebelumnya.',
            mode: 'soft',
          },
          { status: 409 },
        );
      }

      const deleted = await db.persetujuanPeriodePayroll.update({
        where: { id_persetujuan_periode_payroll: id },
        data: { deleted_at: new Date() },
        select: buildSelect(),
      });

      return NextResponse.json({
        message: 'Persetujuan periode payroll berhasil dihapus (soft delete).',
        mode: 'soft',
        data: deleted,
      });
    }

    await db.persetujuanPeriodePayroll.delete({
      where: { id_persetujuan_periode_payroll: id },
    });

    return NextResponse.json({
      message: 'Persetujuan periode payroll berhasil dihapus permanen.',
      mode: 'hard',
    });
  } catch (err) {
    if (err?.code === 'P2003') {
      return NextResponse.json(
        {
          message: 'Persetujuan periode payroll tidak bisa dihapus permanen karena masih direferensikan oleh data lain.',
        },
        { status: 409 },
      );
    }

    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Persetujuan periode payroll tidak ditemukan.' }, { status: 404 });
    }

    console.error('DELETE /api/admin/persetujuan-periode-payroll/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
