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

function normalizeNullableString(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function parseDateOnly(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Field '${fieldName}' harus berupa tanggal yang valid.`);
  }

  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

function parseNonNegativeDecimal(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') {
    throw new Error(`Field '${fieldName}' tidak boleh kosong.`);
  }

  const normalized = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : null;

  if (!normalized || !/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Field '${fieldName}' harus berupa angka yang valid.`);
  }

  const num = Number(normalized);
  if (!Number.isFinite(num)) {
    throw new Error(`Field '${fieldName}' harus berupa angka yang valid.`);
  }

  if (num < 0) {
    throw new Error(`Field '${fieldName}' tidak boleh bernilai negatif.`);
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
    id_riwayat_kompensasi: true,
    id_user: true,
    gaji_pokok: true,
    tunjangan_jabatan: true,
    tunjangan_bpjsk: true,
    tunjangan_kesehatan: true,
    berlaku_mulai: true,
    berlaku_sampai: true,
    catatan: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    user: {
      select: {
        id_user: true,
        nama_pengguna: true,
        email: true,
        role: true,
        nomor_induk_karyawan: true,
        status_kerja: true,
        deleted_at: true,
        departement: {
          select: {
            id_departement: true,
            nama_departement: true,
          },
        },
        jabatan: {
          select: {
            id_jabatan: true,
            nama_jabatan: true,
          },
        },
        kantor: {
          select: {
            id_location: true,
            nama_kantor: true,
          },
        },
      },
    },
  };
}

function buildOverlapWhere(id_user, berlaku_mulai, berlaku_sampai, excludeId) {
  return {
    id_user,
    deleted_at: null,
    ...(excludeId
      ? {
          NOT: {
            id_riwayat_kompensasi: excludeId,
          },
        }
      : {}),
    ...(berlaku_sampai === null
      ? {
          OR: [{ berlaku_sampai: null }, { berlaku_sampai: { gte: berlaku_mulai } }],
        }
      : {
          AND: [
            { berlaku_mulai: { lte: berlaku_sampai } },
            {
              OR: [{ berlaku_sampai: null }, { berlaku_sampai: { gte: berlaku_mulai } }],
            },
          ],
        }),
  };
}

async function ensureNoOverlap({ id_user, berlaku_mulai, berlaku_sampai, excludeId }) {
  const conflict = await db.riwayatKompensasiKaryawan.findFirst({
    where: buildOverlapWhere(id_user, berlaku_mulai, berlaku_sampai, excludeId),
    select: {
      id_riwayat_kompensasi: true,
      berlaku_mulai: true,
      berlaku_sampai: true,
    },
  });

  if (conflict) {
    throw new Error('Periode kompensasi bertabrakan dengan riwayat kompensasi lain untuk user ini.');
  }
}

export async function GET(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;

    const data = await db.riwayatKompensasiKaryawan.findUnique({
      where: { id_riwayat_kompensasi: id },
      select: buildSelect(),
    });

    if (!data) {
      return NextResponse.json({ message: 'Riwayat kompensasi karyawan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/admin/riwayat-kompensasi-karyawan/[id] error:', err);
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

    const existing = await db.riwayatKompensasiKaryawan.findUnique({
      where: { id_riwayat_kompensasi: id },
      select: {
        id_riwayat_kompensasi: true,
        id_user: true,
        gaji_pokok: true,
        tunjangan_jabatan: true,
        tunjangan_bpjsk: true,
        tunjangan_kesehatan: true,
        berlaku_mulai: true,
        berlaku_sampai: true,
        catatan: true,
        deleted_at: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Riwayat kompensasi karyawan tidak ditemukan.' }, { status: 404 });
    }

    const payload = {};

    let nextIdUser = existing.id_user;
    if (body?.id_user !== undefined) {
      const id_user = String(body.id_user || '').trim();
      if (!id_user) {
        return NextResponse.json({ message: "Field 'id_user' tidak boleh kosong." }, { status: 400 });
      }

      const user = await db.user.findFirst({
        where: {
          id_user,
          deleted_at: null,
        },
        select: { id_user: true },
      });

      if (!user) {
        return NextResponse.json({ message: 'User tidak ditemukan atau sudah dihapus.' }, { status: 404 });
      }

      payload.id_user = id_user;
      nextIdUser = id_user;
    }

    if (body?.gaji_pokok !== undefined) {
      payload.gaji_pokok = parseNonNegativeDecimal(body.gaji_pokok, 'gaji_pokok');
    }

    if (body?.tunjangan_jabatan !== undefined) {
      payload.tunjangan_jabatan = parseNonNegativeDecimal(body.tunjangan_jabatan, 'tunjangan_jabatan');
    }

    if (body?.tunjangan_bpjsk !== undefined) {
      payload.tunjangan_bpjsk = parseNonNegativeDecimal(body.tunjangan_bpjsk, 'tunjangan_bpjsk');
    }

    if (body?.tunjangan_kesehatan !== undefined) {
      payload.tunjangan_kesehatan = parseNonNegativeDecimal(body.tunjangan_kesehatan, 'tunjangan_kesehatan');
    }

    if (body?.berlaku_mulai !== undefined) {
      payload.berlaku_mulai = parseDateOnly(body.berlaku_mulai, 'berlaku_mulai');
      if (!payload.berlaku_mulai) {
        return NextResponse.json({ message: "Field 'berlaku_mulai' tidak boleh kosong." }, { status: 400 });
      }
    }

    if (body?.berlaku_sampai !== undefined) {
      payload.berlaku_sampai = parseDateOnly(body.berlaku_sampai, 'berlaku_sampai');
    }

    if (body?.catatan !== undefined) {
      payload.catatan = normalizeNullableString(body.catatan);
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ message: 'Tidak ada field yang dikirim untuk diperbarui.' }, { status: 400 });
    }

    const nextBerlakuMulai = payload.berlaku_mulai ?? existing.berlaku_mulai;
    const nextBerlakuSampai = Object.prototype.hasOwnProperty.call(payload, 'berlaku_sampai') ? payload.berlaku_sampai : existing.berlaku_sampai;

    if (nextBerlakuSampai && nextBerlakuSampai < nextBerlakuMulai) {
      return NextResponse.json({ message: "Field 'berlaku_sampai' tidak boleh lebih kecil dari 'berlaku_mulai'." }, { status: 400 });
    }

    await ensureNoOverlap({
      id_user: nextIdUser,
      berlaku_mulai: nextBerlakuMulai,
      berlaku_sampai: nextBerlakuSampai,
      excludeId: id,
    });

    const updated = await db.riwayatKompensasiKaryawan.update({
      where: { id_riwayat_kompensasi: id },
      data: payload,
      select: buildSelect(),
    });

    return NextResponse.json({
      message: 'Riwayat kompensasi karyawan berhasil diperbarui.',
      data: updated,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('tanggal') || err.message.includes('angka') || err.message.includes('negatif') || err.message.includes('bertabrakan')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }
    console.error('PUT /api/admin/riwayat-kompensasi-karyawan/[id] error:', err);
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
    const hardDelete =
      ['1', 'true'].includes((searchParams.get('hard') || '').toLowerCase()) ||
      ['1', 'true'].includes((searchParams.get('force') || '').toLowerCase());

    const existing = await db.riwayatKompensasiKaryawan.findUnique({
      where: { id_riwayat_kompensasi: id },
      select: {
        id_riwayat_kompensasi: true,
        deleted_at: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Riwayat kompensasi karyawan tidak ditemukan.' }, { status: 404 });
    }

    if (hardDelete) {
      try {
        await db.riwayatKompensasiKaryawan.delete({
          where: { id_riwayat_kompensasi: id },
        });

        return NextResponse.json({
          message: 'Riwayat kompensasi karyawan berhasil dihapus permanen (hard delete).',
        });
      } catch (err) {
        if (err?.code === 'P2003') {
          return NextResponse.json(
            { message: 'Riwayat kompensasi karyawan gagal dihapus permanen karena masih direferensikan data lain.' },
            { status: 409 },
          );
        }
        throw err;
      }
    }

    if (existing.deleted_at) {
      return NextResponse.json({ message: 'Riwayat kompensasi karyawan sudah dihapus sebelumnya.' }, { status: 409 });
    }

    await db.riwayatKompensasiKaryawan.update({
      where: { id_riwayat_kompensasi: id },
      data: {
        deleted_at: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Riwayat kompensasi karyawan berhasil dihapus (soft delete).',
    });
  } catch (err) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Riwayat kompensasi karyawan tidak ditemukan.' }, { status: 404 });
    }
    console.error('DELETE /api/admin/riwayat-kompensasi-karyawan/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
