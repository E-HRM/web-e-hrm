import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const EDIT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const DELETE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const ARAH_KOMPONEN_VALUES = new Set(['PEMASUKAN', 'POTONGAN']);

const normRole = (role) =>
  String(role || '')
    .trim()
    .toUpperCase();

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

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

function normalizeNullableString(value, fieldName = 'string', maxLength = null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  if (maxLength && normalized.length > maxLength) {
    throw new Error(`Field '${fieldName}' maksimal ${maxLength} karakter.`);
  }

  return normalized;
}

function normalizeBoolean(value, fieldName = 'boolean') {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'ya', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'tidak', 'no'].includes(normalized)) return false;
  }

  throw new Error(`Field '${fieldName}' harus bernilai boolean.`);
}

function normalizeEnum(value, allowedValues, fieldName) {
  const normalized = String(value || '')
    .trim()
    .toUpperCase();

  if (!normalized) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  if (!allowedValues.has(normalized)) {
    throw new Error(`${fieldName} tidak valid. Nilai yang diizinkan: ${Array.from(allowedValues).join(', ')}`);
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

async function ensureTipeKomponenPayrollExists(id_tipe_komponen_payroll) {
  const tipeKomponen = await db.tipeKomponenPayroll.findUnique({
    where: { id_tipe_komponen_payroll },
    select: {
      id_tipe_komponen_payroll: true,
      nama_tipe_komponen: true,
      deleted_at: true,
    },
  });

  if (!tipeKomponen) {
    throw createHttpError(404, 'Tipe komponen payroll tidak ditemukan.');
  }

  if (tipeKomponen.deleted_at) {
    throw createHttpError(400, 'Tipe komponen payroll yang dipilih sudah dihapus.');
  }

  return tipeKomponen;
}

function buildSelect() {
  return {
    id_definisi_komponen_payroll: true,
    id_tipe_komponen_payroll: true,
    nama_komponen: true,
    arah_komponen: true,
    kena_pajak_default: true,
    berulang_default: true,
    aktif: true,
    catatan: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    tipe_komponen: {
      select: {
        id_tipe_komponen_payroll: true,
        nama_tipe_komponen: true,
        deleted_at: true,
      },
    },
    _count: {
      select: {
        item_payroll: true,
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

    const data = await db.definisiKomponenPayroll.findUnique({
      where: { id_definisi_komponen_payroll: id },
      select: buildSelect(),
    });

    if (!data) {
      return NextResponse.json({ message: 'Definisi komponen payroll tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/admin/definisi-komponen-payroll/[id] error:', err);
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

    const existing = await db.definisiKomponenPayroll.findUnique({
      where: { id_definisi_komponen_payroll: id },
      select: {
        id_definisi_komponen_payroll: true,
        id_tipe_komponen_payroll: true,
        nama_komponen: true,
        arah_komponen: true,
        kena_pajak_default: true,
        berulang_default: true,
        aktif: true,
        catatan: true,
        deleted_at: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Definisi komponen payroll tidak ditemukan.' }, { status: 404 });
    }

    const payload = {};

    if (body?.id_tipe_komponen_payroll !== undefined) {
      const id_tipe_komponen_payroll = normalizeRequiredString(body.id_tipe_komponen_payroll, 'id_tipe_komponen_payroll', 36);
      await ensureTipeKomponenPayrollExists(id_tipe_komponen_payroll);
      payload.id_tipe_komponen_payroll = id_tipe_komponen_payroll;
    }

    if (body?.nama_komponen !== undefined) {
      payload.nama_komponen = normalizeRequiredString(body.nama_komponen, 'nama_komponen', 255);
    }

    if (body?.arah_komponen !== undefined) {
      payload.arah_komponen = normalizeEnum(body.arah_komponen, ARAH_KOMPONEN_VALUES, 'arah_komponen');
    }

    if (body?.kena_pajak_default !== undefined) {
      payload.kena_pajak_default = normalizeBoolean(body.kena_pajak_default, 'kena_pajak_default');
    }

    if (body?.berulang_default !== undefined) {
      payload.berulang_default = normalizeBoolean(body.berulang_default, 'berulang_default');
    }

    if (body?.aktif !== undefined) {
      payload.aktif = normalizeBoolean(body.aktif, 'aktif');
    }

    if (body?.catatan !== undefined) {
      payload.catatan = normalizeNullableString(body.catatan, 'catatan');
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ message: 'Tidak ada field yang dikirim untuk diperbarui.' }, { status: 400 });
    }

    const nextIdTipeKomponenPayroll = payload.id_tipe_komponen_payroll ?? existing.id_tipe_komponen_payroll;
    const nextNamaKomponen = payload.nama_komponen ?? existing.nama_komponen;
    const nextArahKomponen = payload.arah_komponen ?? existing.arah_komponen;

    const duplicate = await db.definisiKomponenPayroll.findFirst({
      where: {
        id_tipe_komponen_payroll: nextIdTipeKomponenPayroll,
        nama_komponen: nextNamaKomponen,
        arah_komponen: nextArahKomponen,
        NOT: {
          id_definisi_komponen_payroll: id,
        },
      },
      select: {
        id_definisi_komponen_payroll: true,
        deleted_at: true,
      },
    });

    if (duplicate) {
      const duplicateState = duplicate.deleted_at ? 'data soft delete lain' : 'data aktif lain';
      return NextResponse.json(
        {
          message: `Definisi komponen payroll dengan tipe, nama komponen, dan arah komponen tersebut sudah digunakan oleh ${duplicateState}.`,
        },
        { status: 409 },
      );
    }

    const updated = await db.definisiKomponenPayroll.update({
      where: { id_definisi_komponen_payroll: id },
      data: payload,
      select: buildSelect(),
    });

    return NextResponse.json({
      message: 'Definisi komponen payroll berhasil diperbarui.',
      data: updated,
    });
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Definisi komponen payroll dengan tipe, nama komponen, dan arah komponen tersebut sudah digunakan oleh data lain.' }, { status: 409 });
    }

    if (err?.statusCode) {
      return NextResponse.json({ message: err.message }, { status: err.statusCode });
    }

    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('tidak valid') || err.message.includes('boolean')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('PUT /api/admin/definisi-komponen-payroll/[id] error:', err);
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

    const existing = await db.definisiKomponenPayroll.findUnique({
      where: { id_definisi_komponen_payroll: id },
      select: {
        id_definisi_komponen_payroll: true,
        deleted_at: true,
        _count: {
          select: {
            item_payroll: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Definisi komponen payroll tidak ditemukan.' }, { status: 404 });
    }

    if (!hardDelete) {
      if (existing.deleted_at) {
        return NextResponse.json(
          {
            message: 'Definisi komponen payroll sudah dihapus sebelumnya.',
            mode: 'soft',
          },
          { status: 409 },
        );
      }

      const deleted = await db.definisiKomponenPayroll.update({
        where: { id_definisi_komponen_payroll: id },
        data: { deleted_at: new Date() },
        select: buildSelect(),
      });

      return NextResponse.json({
        message: 'Definisi komponen payroll berhasil dihapus (soft delete).',
        mode: 'soft',
        data: deleted,
      });
    }

    if (existing._count.item_payroll > 0) {
      return NextResponse.json(
        {
          message: 'Definisi komponen payroll tidak bisa dihapus permanen karena masih direferensikan oleh item payroll.',
        },
        { status: 409 },
      );
    }

    await db.definisiKomponenPayroll.delete({
      where: { id_definisi_komponen_payroll: id },
    });

    return NextResponse.json({
      message: 'Definisi komponen payroll berhasil dihapus permanen.',
      mode: 'hard',
    });
  } catch (err) {
    if (err?.code === 'P2003') {
      return NextResponse.json(
        {
          message: 'Definisi komponen payroll tidak bisa dihapus permanen karena masih direferensikan oleh item payroll.',
        },
        { status: 409 },
      );
    }

    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Definisi komponen payroll tidak ditemukan.' }, { status: 404 });
    }

    console.error('DELETE /api/admin/definisi-komponen-payroll/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
