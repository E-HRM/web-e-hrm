import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const EDIT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const DELETE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const normRole = (role) =>
  String(role || '')
    .trim()
    .toUpperCase();

function normalizeRequiredString(value, fieldName, maxLength = null) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  if (maxLength && normalized.length > maxLength) {
    throw new Error(`Field '${fieldName}' maksimal ${maxLength} karakter.`);
  }

  return normalized;
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
    id_tipe_komponen_payroll: true,
    nama_tipe_komponen: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    _count: {
      select: {
        definisi_komponen: true,
      },
    },
  };
}

export async function GET(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;

    const data = await db.tipeKomponenPayroll.findUnique({
      where: { id_tipe_komponen_payroll: id },
      select: buildSelect(),
    });

    if (!data) {
      return NextResponse.json({ message: 'Tipe komponen payroll tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/admin/tipe-komponen-payroll/[id] error:', err);
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

    const existing = await db.tipeKomponenPayroll.findUnique({
      where: { id_tipe_komponen_payroll: id },
      select: {
        id_tipe_komponen_payroll: true,
        nama_tipe_komponen: true,
        deleted_at: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Tipe komponen payroll tidak ditemukan.' }, { status: 404 });
    }

    const payload = {};

    if (body?.nama_tipe_komponen !== undefined) {
      payload.nama_tipe_komponen = normalizeRequiredString(body.nama_tipe_komponen, 'nama_tipe_komponen', 100);
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ message: 'Tidak ada field yang dikirim untuk diperbarui.' }, { status: 400 });
    }

    const nextNamaTipeKomponen = payload.nama_tipe_komponen ?? existing.nama_tipe_komponen;

    const duplicate = await db.tipeKomponenPayroll.findFirst({
      where: {
        nama_tipe_komponen: nextNamaTipeKomponen,
        NOT: {
          id_tipe_komponen_payroll: id,
        },
      },
      select: {
        id_tipe_komponen_payroll: true,
        deleted_at: true,
      },
    });

    if (duplicate) {
      const duplicateState = duplicate.deleted_at ? 'data soft delete lain' : 'data aktif lain';
      return NextResponse.json({ message: `Nama tipe komponen sudah digunakan oleh ${duplicateState}.` }, { status: 409 });
    }

    const updated = await db.tipeKomponenPayroll.update({
      where: { id_tipe_komponen_payroll: id },
      data: payload,
      select: buildSelect(),
    });

    return NextResponse.json({
      message: 'Tipe komponen payroll berhasil diperbarui.',
      data: updated,
    });
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Nama tipe komponen sudah digunakan oleh data lain.' }, { status: 409 });
    }

    if (err instanceof Error && (err.message.startsWith('Field ') || err.message.includes('karakter'))) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }

    console.error('PUT /api/admin/tipe-komponen-payroll/[id] error:', err);
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

    const existing = await db.tipeKomponenPayroll.findUnique({
      where: { id_tipe_komponen_payroll: id },
      select: {
        id_tipe_komponen_payroll: true,
        deleted_at: true,
        _count: {
          select: {
            definisi_komponen: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Tipe komponen payroll tidak ditemukan.' }, { status: 404 });
    }

    if (!hardDelete) {
      if (existing.deleted_at) {
        return NextResponse.json(
          {
            message: 'Tipe komponen payroll sudah dihapus sebelumnya.',
            mode: 'soft',
          },
          { status: 409 },
        );
      }

      const deleted = await db.tipeKomponenPayroll.update({
        where: { id_tipe_komponen_payroll: id },
        data: { deleted_at: new Date() },
        select: buildSelect(),
      });

      return NextResponse.json({
        message: 'Tipe komponen payroll berhasil dihapus (soft delete).',
        mode: 'soft',
        data: deleted,
      });
    }

    if (existing._count.definisi_komponen > 0) {
      return NextResponse.json(
        {
          message: 'Tipe komponen payroll tidak bisa dihapus permanen karena masih direferensikan definisi komponen payroll.',
        },
        { status: 409 },
      );
    }

    await db.tipeKomponenPayroll.delete({
      where: { id_tipe_komponen_payroll: id },
    });

    return NextResponse.json({
      message: 'Tipe komponen payroll berhasil dihapus permanen.',
      mode: 'hard',
    });
  } catch (err) {
    if (err?.code === 'P2003') {
      return NextResponse.json(
        {
          message: 'Tipe komponen payroll tidak bisa dihapus permanen karena masih direferensikan data lain.',
        },
        { status: 409 },
      );
    }

    console.error('DELETE /api/admin/tipe-komponen-payroll/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
