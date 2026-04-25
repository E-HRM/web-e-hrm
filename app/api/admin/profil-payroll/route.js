// app/api/admin/profil-payroll/route.js
import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const CREATE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'tanggal_mulai_payroll', 'jenis_hubungan_kerja', 'gaji_pokok', 'tunjangan_bpjs', 'payroll_aktif']);

const JENIS_HUBUNGAN_KERJA_VALUES = new Set(['FREELANCE', 'INTERNSHIP', 'PKWT', 'PKWTT']);

const normRole = (role) =>
  String(role || '')
    .trim()
    .toUpperCase();

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

function normalizeNullableString(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
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
    jenis_hubungan_kerja: true,
    gaji_pokok: true,
    tunjangan_bpjs: true,
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
  };
}

function buildSearchClauses(search) {
  if (!search) return [];

  return [
    { catatan: { contains: search } },
    { user: { is: { nama_pengguna: { contains: search } } } },
    { user: { is: { email: { contains: search } } } },
    { user: { is: { nomor_induk_karyawan: { contains: search } } } },
    { user: { is: { jabatan: { is: { nama_jabatan: { contains: search } } } } } },
    { user: { is: { departement: { is: { nama_departement: { contains: search } } } } } },
  ];
}

export async function GET(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1), 100);

    const search = String(searchParams.get('search') || '').trim();
    const id_user = String(searchParams.get('id_user') || '').trim();
    const includeDeleted = searchParams.get('includeDeleted') === '1';

    const jenis_hubungan_kerja = normalizeEnum(searchParams.get('jenis_hubungan_kerja'));

    const payrollAktifRaw = searchParams.get('payroll_aktif');
    const orderByParam = String(searchParams.get('orderBy') || 'created_at').trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam) ? orderByParam : 'created_at';
    const sort = String(searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    if (jenis_hubungan_kerja && !JENIS_HUBUNGAN_KERJA_VALUES.has(jenis_hubungan_kerja)) {
      return NextResponse.json(
        {
          message: `jenis_hubungan_kerja tidak valid. Nilai yang diizinkan: ${Array.from(JENIS_HUBUNGAN_KERJA_VALUES).join(', ')}`,
        },
        { status: 400 },
      );
    }

    let payroll_aktif;
    if (payrollAktifRaw !== null && payrollAktifRaw !== '') {
      payroll_aktif = normalizeBoolean(payrollAktifRaw, 'payroll_aktif');
    }

    const searchClauses = buildSearchClauses(search);

    const where = {
      ...(includeDeleted ? {} : { deleted_at: null }),
      ...(id_user ? { id_user } : {}),
      ...(jenis_hubungan_kerja ? { jenis_hubungan_kerja } : {}),
      ...(typeof payroll_aktif === 'boolean' ? { payroll_aktif } : {}),
      ...(searchClauses.length > 0 ? { OR: searchClauses } : {}),
    };

    const [total, data] = await Promise.all([
      db.profilPayroll.count({ where }),
      db.profilPayroll.findMany({
        where,
        orderBy: { [orderBy]: sort },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: buildSelect(),
      }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    if (err instanceof Error && (err.message.startsWith('Field ') || err.message.includes('boolean'))) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }

    console.error('GET /api/admin/profil-payroll error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, CREATE_ROLES);
  if (forbidden) return forbidden;

  try {
    const body = await req.json();

    const id_user = normalizeRequiredId(body?.id_user, 'id_user');
    const jenis_hubungan_kerja = normalizeEnum(body?.jenis_hubungan_kerja);

    if (!jenis_hubungan_kerja) {
      return NextResponse.json({ message: "Field 'jenis_hubungan_kerja' wajib diisi." }, { status: 400 });
    }

    if (!JENIS_HUBUNGAN_KERJA_VALUES.has(jenis_hubungan_kerja)) {
      return NextResponse.json(
        {
          message: `jenis_hubungan_kerja tidak valid. Nilai yang diizinkan: ${Array.from(JENIS_HUBUNGAN_KERJA_VALUES).join(', ')}`,
        },
        { status: 400 },
      );
    }

    const user = await db.user.findFirst({
      where: {
        id_user,
        deleted_at: null,
      },
      select: {
        id_user: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan atau sudah dihapus.' }, { status: 404 });
    }

    const existing = await db.profilPayroll.findFirst({
      where: {
        id_user,
      },
      select: {
        id_profil_payroll: true,
        deleted_at: true,
      },
    });

    const payload = {
      id_user,
      jenis_hubungan_kerja,
      gaji_pokok: parseNonNegativeDecimal(body?.gaji_pokok ?? '0', 'gaji_pokok'),
      tunjangan_bpjs: parseNonNegativeDecimal(body?.tunjangan_bpjs ?? '0', 'tunjangan_bpjs'),
      payroll_aktif: body?.payroll_aktif === undefined ? true : normalizeBoolean(body.payroll_aktif, 'payroll_aktif'),
      tanggal_mulai_payroll: parseOptionalDateOnly(body?.tanggal_mulai_payroll, 'tanggal_mulai_payroll'),
      catatan: normalizeNullableString(body?.catatan),
    };

    if (existing && existing.deleted_at === null) {
      return NextResponse.json({ message: 'Profil payroll untuk user ini sudah ada.' }, { status: 409 });
    }

    if (existing && existing.deleted_at !== null) {
      const restored = await db.profilPayroll.update({
        where: { id_profil_payroll: existing.id_profil_payroll },
        data: payload,
        select: buildSelect(),
      });

      return NextResponse.json(
        {
          message: 'Profil payroll berhasil dipulihkan dan diperbarui.',
          data: restored,
        },
        { status: 200 },
      );
    }

    const created = await db.profilPayroll.create({
      data: payload,
      select: buildSelect(),
    });

    return NextResponse.json(
      {
        message: 'Profil payroll berhasil dibuat.',
        data: created,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Profil payroll untuk user ini sudah ada.' }, { status: 409 });
    }

    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('tanggal_mulai_payroll') || err.message.includes('boolean')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('POST /api/admin/profil-payroll error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
