import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';
import { getMasterTemplateDelegate } from '../../master-template/_shared';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const EDIT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const DELETE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const BULAN_VALUES = new Set(['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']);
const STATUS_PERIODE_VALUES = new Set(['DRAFT', 'DIPROSES', 'TERKUNCI']);

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

function normalizeNullableId(value, fieldName = 'id') {
  if (value === undefined || value === null) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  if (normalized.length > 36) {
    throw new Error(`Field '${fieldName}' maksimal 36 karakter.`);
  }

  return normalized;
}

function normalizeOptionalNullableId(value, fieldName = 'id') {
  if (value === undefined) return undefined;
  return normalizeNullableId(value, fieldName);
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

function validatePeriodeState({ tahun, bulan, tanggal_mulai, tanggal_selesai }) {
  if (tahun < 2000 || tahun > 9999) {
    throw new Error("Field 'tahun' harus berada pada rentang 2000 sampai 9999.");
  }

  if (tanggal_selesai < tanggal_mulai) {
    throw new Error("Field 'tanggal_selesai' tidak boleh lebih kecil dari 'tanggal_mulai'.");
  }

  if (!BULAN_VALUES.has(bulan)) {
    throw new Error(`bulan tidak valid. Nilai yang diizinkan: ${Array.from(BULAN_VALUES).join(', ')}`);
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
    id_periode_payroll: true,
    tahun: true,
    bulan: true,
    tanggal_mulai: true,
    tanggal_selesai: true,
    status_periode: true,
    catatan: true,
    id_master_template: true,
    created_at: true,
    updated_at: true,
    master_template: {
      select: {
        id_master_template: true,
        nama_template: true,
        file_template_url: true,
      },
    },
    _count: {
      select: {
        payroll_karyawan: true,
        payoutKonsultans: true,
      },
    },
  };
}

async function ensureMasterTemplateExists(id_master_template) {
  if (!id_master_template) return null;

  const masterTemplate = getMasterTemplateDelegate();
  if (!masterTemplate) {
    const err = new Error('Prisma model master_template tidak ditemukan. Pastikan schema + prisma generate sudah benar.');
    err.status = 500;
    throw err;
  }

  const template = await masterTemplate.findFirst({
    where: {
      id_master_template,
      deleted_at: null,
    },
    select: {
      id_master_template: true,
      nama_template: true,
      file_template_url: true,
    },
  });

  if (!template) {
    const err = new Error('Master template payroll tidak ditemukan atau sudah dihapus.');
    err.status = 400;
    throw err;
  }

  return template;
}

function enrichPeriode(item) {
  if (!item) return item;

  return {
    ...item,
    _count: {
      ...item._count,
      payout_konsultan: Number(item?._count?.payoutKonsultans || 0),
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

    const data = await db.periodePayroll.findUnique({
      where: { id_periode_payroll: id },
      select: buildSelect(),
    });

    if (!data) {
      return NextResponse.json({ message: 'Periode payroll tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data: enrichPeriode(data) });
  } catch (err) {
    console.error('GET /api/admin/periode-payroll/[id] error:', err);
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

    const existing = await db.periodePayroll.findUnique({
      where: { id_periode_payroll: id },
      select: {
        id_periode_payroll: true,
        tahun: true,
        bulan: true,
        tanggal_mulai: true,
        tanggal_selesai: true,
        status_periode: true,
        catatan: true,
        id_master_template: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Periode payroll tidak ditemukan.' }, { status: 404 });
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

    if (body?.id_master_template !== undefined) {
      payload.id_master_template = normalizeOptionalNullableId(body.id_master_template, 'id_master_template');
      await ensureMasterTemplateExists(payload.id_master_template);
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ message: 'Tidak ada field yang dikirim untuk diperbarui.' }, { status: 400 });
    }

    const nextTahun = payload.tahun ?? existing.tahun;
    const nextBulan = payload.bulan ?? existing.bulan;
    const nextTanggalMulai = payload.tanggal_mulai ?? existing.tanggal_mulai;
    const nextTanggalSelesai = payload.tanggal_selesai ?? existing.tanggal_selesai;

    validatePeriodeState({
      tahun: nextTahun,
      bulan: nextBulan,
      tanggal_mulai: nextTanggalMulai,
      tanggal_selesai: nextTanggalSelesai,
    });

    if (nextTahun !== existing.tahun || nextBulan !== existing.bulan) {
      const duplicate = await db.periodePayroll.findFirst({
        where: {
          tahun: nextTahun,
          bulan: nextBulan,
          NOT: {
            id_periode_payroll: id,
          },
        },
        select: {
          id_periode_payroll: true,
        },
      });

      if (duplicate) {
        return NextResponse.json({ message: 'Periode payroll untuk tahun dan bulan tersebut sudah ada.' }, { status: 409 });
      }
    }

    const updated = await db.periodePayroll.update({
      where: { id_periode_payroll: id },
      data: payload,
      select: buildSelect(),
    });

    return NextResponse.json({
      message: 'Periode payroll berhasil diperbarui.',
      data: enrichPeriode(updated),
    });
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Periode payroll untuk tahun dan bulan tersebut sudah ada.' }, { status: 409 });
    }

    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('tidak valid') || err.message.includes('tanggal')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('PUT /api/admin/periode-payroll/[id] error:', err);
    return NextResponse.json({ message: err?.message || 'Server error' }, { status: err?.status || 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, DELETE_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;

    const existing = await db.periodePayroll.findUnique({
      where: { id_periode_payroll: id },
      select: {
        id_periode_payroll: true,
        _count: {
          select: {
            payroll_karyawan: true,
            payoutKonsultans: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Periode payroll tidak ditemukan.' }, { status: 404 });
    }

    await db.periodePayroll.delete({
      where: { id_periode_payroll: id },
    });

    return NextResponse.json({
      message: 'Periode payroll berhasil dihapus permanen.',
      mode: 'hard',
      relation_summary: {
        payroll_karyawan_terhapus_mengikuti_cascade: existing._count.payroll_karyawan,
        payout_konsultan_yang_id_periode_payroll_menjadi_null: existing._count.payoutKonsultans,
      },
    });
  } catch (err) {
    if (err?.code === 'P2003') {
      return NextResponse.json(
        {
          message: 'Periode payroll tidak bisa dihapus karena masih direferensikan oleh data lain.',
        },
        { status: 409 },
      );
    }

    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Periode payroll tidak ditemukan.' }, { status: 404 });
    }

    console.error('DELETE /api/admin/periode-payroll/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
