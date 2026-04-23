// app/api/admin/profil-payroll/[id]/route.js
import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const EDIT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const DELETE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const JENIS_HUBUNGAN_KERJA_VALUES = new Set(['FREELANCE', 'INTERNSHIP', 'PKWT', 'PKWTT']);

const normRole = (role) =>
  String(role || '')
    .trim()
    .toUpperCase();

function normalizeEnum(value) {
  return String(value || '')
    .trim()
    .toUpperCase();
}

function normalizeRequiredId(value, fieldName = 'id') {
  const normalized = String(value || '').trim();

  if (!normalized) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  if (normalized.length > 36) {
    throw new Error(`Field '${fieldName}' maksimal 36 karakter.`);
  }

  return normalized;
}

function normalizeNullableString(value, fieldName = 'string', maxLength = null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  if (maxLength !== null && trimmed.length > maxLength) {
    throw new Error(`Field '${fieldName}' maksimal ${maxLength} karakter.`);
  }

  return trimmed;
}

function normalizeBoolean(value, fieldName = 'boolean') {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();

    if (['true', '1', 'ya', 'yes'].includes(v)) return true;
    if (['false', '0', 'tidak', 'no'].includes(v)) return false;
  }

  throw new Error(`Field '${fieldName}' harus bernilai boolean.`);
}

function parseOptionalDateOnly(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Field '${fieldName}' harus berupa tanggal yang valid.`);
  }

  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

function parseOptionalDateTime(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Field '${fieldName}' harus berupa tanggal/waktu yang valid.`);
  }

  return parsed;
}

function parseNonNegativeDecimal(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') {
    throw new Error(`Field '${fieldName}' tidak boleh kosong.`);
  }

  const normalized = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim().replace(',', '.') : value && typeof value.toString === 'function' ? String(value.toString()).trim().replace(',', '.') : null;

  if (!normalized || !/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Field '${fieldName}' harus berupa angka yang valid.`);
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Field '${fieldName}' harus berupa angka yang valid.`);
  }

  if (parsed < 0) {
    throw new Error(`Field '${fieldName}' tidak boleh bernilai negatif.`);
  }

  return parsed.toFixed(2);
}

async function ensureTarifPajakTerExists(id_tarif_pajak_ter) {
  return db.tarifPajakTER.findFirst({
    where: {
      id_tarif_pajak_ter,
      deleted_at: null,
    },
    select: {
      id_tarif_pajak_ter: true,
    },
  });
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
    id_profil_payroll: true,
    id_user: true,
    id_tarif_pajak_ter: true,
    jenis_hubungan_kerja: true,
    gaji_pokok: true,
    payroll_aktif: true,
    tanggal_mulai_payroll: true,
    catatan: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    user: {
      select: {
        id_user: true,
        nama_pengguna: true,
        email: true,
        foto_profil_user: true,
        role: true,
        nomor_induk_karyawan: true,
        nomor_rekening: true,
        jenis_bank: true,
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
    tarif_pajak_ter: {
      select: {
        id_tarif_pajak_ter: true,
        kode_kategori_pajak: true,
        penghasilan_dari: true,
        penghasilan_sampai: true,
        persen_tarif: true,
        berlaku_mulai: true,
        berlaku_sampai: true,
        deleted_at: true,
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

    const data = await db.profilPayroll.findUnique({
      where: { id_profil_payroll: id },
      select: buildSelect(),
    });

    if (!data) {
      return NextResponse.json({ message: 'Profil payroll tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/admin/profil-payroll/[id] error:', err);
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

    const existing = await db.profilPayroll.findUnique({
      where: { id_profil_payroll: id },
      select: {
        id_profil_payroll: true,
        id_user: true,
        id_tarif_pajak_ter: true,
        jenis_hubungan_kerja: true,
        gaji_pokok: true,
        payroll_aktif: true,
        tanggal_mulai_payroll: true,
        catatan: true,
        deleted_at: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Profil payroll tidak ditemukan.' }, { status: 404 });
    }

    const payload = {};

    if (body?.id_user !== undefined) {
      const id_user = normalizeRequiredId(body.id_user, 'id_user');

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

      if (id_user !== existing.id_user) {
        const duplicate = await db.profilPayroll.findFirst({
          where: {
            id_user,
            NOT: {
              id_profil_payroll: existing.id_profil_payroll,
            },
          },
          select: {
            id_profil_payroll: true,
            deleted_at: true,
          },
        });

        if (duplicate?.deleted_at === null) {
          return NextResponse.json({ message: 'Profil payroll untuk user tujuan sudah ada.' }, { status: 409 });
        }

        if (duplicate?.deleted_at !== null) {
          return NextResponse.json(
            {
              message: 'User tujuan sudah memiliki riwayat profil payroll terhapus. Hapus permanen atau pulihkan data tersebut terlebih dahulu.',
            },
            { status: 409 },
          );
        }
      }

      payload.id_user = id_user;
    }

    if (body?.jenis_hubungan_kerja !== undefined) {
      const value = normalizeEnum(body.jenis_hubungan_kerja);

      if (!value || !JENIS_HUBUNGAN_KERJA_VALUES.has(value)) {
        return NextResponse.json(
          {
            message: `jenis_hubungan_kerja tidak valid. Nilai yang diizinkan: ${Array.from(JENIS_HUBUNGAN_KERJA_VALUES).join(', ')}`,
          },
          { status: 400 },
        );
      }

      payload.jenis_hubungan_kerja = value;
    }

    if (body?.id_tarif_pajak_ter !== undefined) {
      const id_tarif_pajak_ter = normalizeRequiredId(body.id_tarif_pajak_ter, 'id_tarif_pajak_ter');

      const tarifPajakTer = await ensureTarifPajakTerExists(id_tarif_pajak_ter);

      if (!tarifPajakTer) {
        return NextResponse.json({ message: 'Tarif pajak TER tidak ditemukan atau sudah dihapus.' }, { status: 404 });
      }

      payload.id_tarif_pajak_ter = id_tarif_pajak_ter;
    }

    if (body?.gaji_pokok !== undefined) {
      payload.gaji_pokok = parseNonNegativeDecimal(body.gaji_pokok, 'gaji_pokok');
    }

    if (body?.catatan !== undefined) {
      payload.catatan = normalizeNullableString(body.catatan, 'catatan');
    }

    if (body?.payroll_aktif !== undefined) {
      payload.payroll_aktif = normalizeBoolean(body.payroll_aktif, 'payroll_aktif');
    }

    if (body?.tanggal_mulai_payroll !== undefined) {
      payload.tanggal_mulai_payroll = parseOptionalDateOnly(body.tanggal_mulai_payroll, 'tanggal_mulai_payroll');
    }

    if (body?.deleted_at !== undefined) {
      payload.deleted_at = parseOptionalDateTime(body.deleted_at, 'deleted_at');
    }

    const updated = await db.profilPayroll.update({
      where: { id_profil_payroll: id },
      data: payload,
      select: buildSelect(),
    });

    return NextResponse.json({
      message: 'Profil payroll berhasil diperbarui.',
      data: updated,
    });
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Profil payroll untuk user tujuan sudah ada.' }, { status: 409 });
    }

    if (err instanceof Error) {
      if (
        err.message.includes('jenis_hubungan_kerja') ||
        err.message.includes('id_tarif_pajak_ter') ||
        err.message.includes('tanggal_mulai_payroll') ||
        err.message.includes('deleted_at') ||
        err.message.includes('boolean') ||
        err.message.includes('gaji_pokok')
      ) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('PUT /api/admin/profil-payroll/[id] error:', err);
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
    const hardDelete = searchParams.get('hard') === '1';

    const existing = await db.profilPayroll.findUnique({
      where: { id_profil_payroll: id },
      select: {
        id_profil_payroll: true,
        deleted_at: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Profil payroll tidak ditemukan.' }, { status: 404 });
    }

    if (hardDelete) {
      await db.profilPayroll.delete({
        where: { id_profil_payroll: id },
      });

      return NextResponse.json({ message: 'Profil payroll berhasil dihapus permanen.' });
    }

    if (existing.deleted_at !== null) {
      return NextResponse.json({ message: 'Profil payroll sudah dihapus sebelumnya.' });
    }

    const deleted = await db.profilPayroll.update({
      where: { id_profil_payroll: id },
      data: {
        deleted_at: new Date(),
      },
      select: buildSelect(),
    });

    return NextResponse.json({
      message: 'Profil payroll berhasil dihapus.',
      data: deleted,
    });
  } catch (err) {
    console.error('DELETE /api/admin/profil-payroll/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
