import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const EDIT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const DELETE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const BULAN_VALUES = new Set(['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']);

const STATUS_PERIODE_VALUES = new Set(['DRAFT', 'DIREVIEW', 'DISETUJUI', 'TERKUNCI']);

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

function normalizeNullableString(value, fieldName = 'string') {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  return normalized;
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

function validatePeriodeState({ tahun, bulan, tanggal_mulai, tanggal_selesai, status_periode }) {
  if (tahun < 2000 || tahun > 9999) {
    throw new Error("Field 'tahun' harus berada pada rentang 2000 sampai 9999.");
  }

  if (tanggal_selesai < tanggal_mulai) {
    throw new Error("Field 'tanggal_selesai' tidak boleh lebih kecil dari 'tanggal_mulai'.");
  }

  if (!BULAN_VALUES.has(bulan)) {
    throw new Error(`bulan tidak valid. Nilai yang diizinkan: ${Array.from(BULAN_VALUES).join(', ')}`);
  }

  if (!STATUS_PERIODE_VALUES.has(status_periode)) {
    throw new Error(`status_periode tidak valid. Nilai yang diizinkan: ${Array.from(STATUS_PERIODE_VALUES).join(', ')}`);
  }
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
    id_periode_konsultan: true,
    tahun: true,
    bulan: true,
    tanggal_mulai: true,
    tanggal_selesai: true,
    status_periode: true,
    catatan: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    _count: {
      select: {
        transaksi_konsultan: true,
        payout_konsultan: true,
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

    const data = await db.periodeKonsultan.findUnique({
      where: { id_periode_konsultan: id },
      select: buildSelect(),
    });

    if (!data) {
      return NextResponse.json({ message: 'Periode konsultan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/admin/periode-konsultan/[id] error:', err);
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

    const existing = await db.periodeKonsultan.findUnique({
      where: { id_periode_konsultan: id },
      select: {
        id_periode_konsultan: true,
        tahun: true,
        bulan: true,
        tanggal_mulai: true,
        tanggal_selesai: true,
        status_periode: true,
        catatan: true,
        deleted_at: true,
        _count: {
          select: {
            transaksi_konsultan: true,
            payout_konsultan: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Periode konsultan tidak ditemukan.' }, { status: 404 });
    }

    const payload = {};

    if (body?.tahun !== undefined) {
      payload.tahun = normalizeRequiredInt(body.tahun, 'tahun', { min: 2000, max: 9999 });
    }

    if (body?.bulan !== undefined) {
      payload.bulan = normalizeEnum(body.bulan, BULAN_VALUES, 'bulan');
    }

    if (body?.tanggal_mulai !== undefined) {
      payload.tanggal_mulai = parseDateOnly(body.tanggal_mulai, 'tanggal_mulai');
      if (!payload.tanggal_mulai) {
        return NextResponse.json({ message: "Field 'tanggal_mulai' tidak boleh kosong." }, { status: 400 });
      }
    }

    if (body?.tanggal_selesai !== undefined) {
      payload.tanggal_selesai = parseDateOnly(body.tanggal_selesai, 'tanggal_selesai');
      if (!payload.tanggal_selesai) {
        return NextResponse.json({ message: "Field 'tanggal_selesai' tidak boleh kosong." }, { status: 400 });
      }
    }

    if (body?.status_periode !== undefined) {
      payload.status_periode = normalizeEnum(body.status_periode, STATUS_PERIODE_VALUES, 'status_periode');
    }

    if (body?.catatan !== undefined) {
      payload.catatan = normalizeNullableString(body.catatan, 'catatan');
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ message: 'Tidak ada field yang dikirim untuk diperbarui.' }, { status: 400 });
    }

    const nextTahun = payload.tahun ?? existing.tahun;
    const nextBulan = payload.bulan ?? existing.bulan;
    const nextTanggalMulai = payload.tanggal_mulai ?? existing.tanggal_mulai;
    const nextTanggalSelesai = payload.tanggal_selesai ?? existing.tanggal_selesai;
    const nextStatusPeriode = payload.status_periode ?? existing.status_periode;

    validatePeriodeState({
      tahun: nextTahun,
      bulan: nextBulan,
      tanggal_mulai: nextTanggalMulai,
      tanggal_selesai: nextTanggalSelesai,
      status_periode: nextStatusPeriode,
    });

    if (nextTahun !== existing.tahun || nextBulan !== existing.bulan) {
      const duplicate = await db.periodeKonsultan.findFirst({
        where: {
          tahun: nextTahun,
          bulan: nextBulan,
          NOT: {
            id_periode_konsultan: id,
          },
        },
        select: {
          id_periode_konsultan: true,
          deleted_at: true,
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            message: duplicate.deleted_at ? 'Tahun dan bulan tersebut sudah digunakan oleh data soft delete lain.' : 'Periode konsultan untuk tahun dan bulan tersebut sudah ada.',
          },
          { status: 409 },
        );
      }
    }

    const updated = await db.periodeKonsultan.update({
      where: { id_periode_konsultan: id },
      data: payload,
      select: buildSelect(),
    });

    return NextResponse.json({
      message: 'Periode konsultan berhasil diperbarui.',
      data: updated,
    });
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Periode konsultan untuk tahun dan bulan tersebut sudah ada.' }, { status: 409 });
    }

    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('tidak valid') || err.message.includes('tanggal')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('PUT /api/admin/periode-konsultan/[id] error:', err);
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

    const existing = await db.periodeKonsultan.findUnique({
      where: { id_periode_konsultan: id },
      select: {
        id_periode_konsultan: true,
        deleted_at: true,
        _count: {
          select: {
            transaksi_konsultan: true,
            payout_konsultan: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Periode konsultan tidak ditemukan.' }, { status: 404 });
    }

    if (!hardDelete) {
      if (existing.deleted_at) {
        return NextResponse.json(
          {
            message: 'Periode konsultan sudah dihapus sebelumnya.',
            mode: 'soft',
          },
          { status: 409 },
        );
      }

      const deletedAt = new Date();

      const [deleted, affectedTransaksi, affectedPayout] = await db.$transaction([
        db.periodeKonsultan.update({
          where: { id_periode_konsultan: id },
          data: { deleted_at: deletedAt },
          select: buildSelect(),
        }),
        db.transaksiKonsultan.updateMany({
          where: {
            id_periode_konsultan: id,
            deleted_at: null,
          },
          data: {
            deleted_at: deletedAt,
          },
        }),
        db.payoutKonsultan.updateMany({
          where: {
            id_periode_konsultan: id,
            deleted_at: null,
          },
          data: {
            deleted_at: deletedAt,
          },
        }),
      ]);

      return NextResponse.json({
        message: 'Periode konsultan berhasil dihapus (soft delete).',
        mode: 'soft',
        data: deleted,
        cascade_summary: {
          transaksi_konsultan_soft_deleted: affectedTransaksi.count,
          payout_konsultan_soft_deleted: affectedPayout.count,
        },
      });
    }

    await db.periodeKonsultan.delete({
      where: { id_periode_konsultan: id },
    });

    return NextResponse.json({
      message: 'Periode konsultan berhasil dihapus permanen.',
      mode: 'hard',
      relation_summary: {
        transaksi_konsultan_terhapus_mengikuti_cascade: existing._count.transaksi_konsultan,
        payout_konsultan_terhapus_mengikuti_cascade: existing._count.payout_konsultan,
      },
    });
  } catch (err) {
    if (err?.code === 'P2003') {
      return NextResponse.json(
        {
          message: 'Periode konsultan tidak bisa dihapus permanen karena masih direferensikan oleh data lain.',
        },
        { status: 409 },
      );
    }

    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Periode konsultan tidak ditemukan.' }, { status: 404 });
    }

    console.error('DELETE /api/admin/periode-konsultan/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
