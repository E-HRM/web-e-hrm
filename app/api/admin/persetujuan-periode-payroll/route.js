import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const CREATE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const APPROVE_STATUS_VALUES = new Set(['pending', 'disetujui', 'ditolak']);
const ROLE_VALUES = new Set(['KARYAWAN', 'HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI']);
const BULAN_VALUES = new Set(['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']);

const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'level', 'keputusan', 'diputuskan_pada']);

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

function normalizeOptionalInt(value, fieldName, options = {}) {
  if (value === undefined || value === null || value === '') return undefined;
  return normalizeRequiredInt(value, fieldName, options);
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
      tahun: true,
      bulan: true,
      status_periode: true,
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

export async function GET(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1), 100);

    const search = (searchParams.get('search') || '').trim();

    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());
    const deletedOnly = ['1', 'true'].includes((searchParams.get('deletedOnly') || '').toLowerCase());

    const id_periode_payroll = normalizeNullableString(searchParams.get('id_periode_payroll'));
    const id_user_penyetuju = normalizeNullableString(searchParams.get('id_user_penyetuju'));
    const role_penyetuju = searchParams.get('role_penyetuju') ? normalizeRoleEnum(searchParams.get('role_penyetuju'), 'role_penyetuju') : undefined;
    const keputusan = searchParams.get('keputusan') ? normalizeApproveStatus(searchParams.get('keputusan'), 'keputusan') : undefined;
    const level = normalizeOptionalInt(searchParams.get('level'), 'level', { min: 1 });
    const tahun = normalizeOptionalInt(searchParams.get('tahun'), 'tahun', { min: 2000, max: 9999 });
    const bulan = searchParams.get('bulan')
      ? (() => {
          const normalized = normRole(searchParams.get('bulan'));
          if (!BULAN_VALUES.has(normalized)) {
            throw new Error(`bulan tidak valid. Nilai yang diizinkan: ${Array.from(BULAN_VALUES).join(', ')}`);
          }
          return normalized;
        })()
      : undefined;

    const orderByParam = (searchParams.get('orderBy') || 'created_at').trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam) ? orderByParam : 'created_at';

    const sortParam = (searchParams.get('sort') || 'desc').trim().toLowerCase();
    const sort = sortParam === 'asc' ? 'asc' : 'desc';

    const where = {
      ...(deletedOnly ? { deleted_at: { not: null } } : {}),
      ...(!includeDeleted && !deletedOnly ? { deleted_at: null } : {}),
      ...(id_periode_payroll ? { id_periode_payroll } : {}),
      ...(id_user_penyetuju ? { id_user_penyetuju } : {}),
      ...(role_penyetuju ? { role_penyetuju } : {}),
      ...(keputusan ? { keputusan } : {}),
      ...(typeof level === 'number' ? { level } : {}),
      ...(typeof tahun === 'number' || bulan
        ? {
            periode_payroll: {
              ...(typeof tahun === 'number' ? { tahun } : {}),
              ...(bulan ? { bulan } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { catatan: { contains: search } },
              {
                penyetuju: {
                  OR: [{ nama_pengguna: { contains: search } }, { email: { contains: search } }],
                },
              },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      db.persetujuanPeriodePayroll.count({ where }),
      db.persetujuanPeriodePayroll.findMany({
        where,
        orderBy: [{ [orderBy]: sort }, { level: 'asc' }],
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
    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('tidak valid') || err.message.includes('wajib')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('GET /api/admin/persetujuan-periode-payroll error:', err);
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

    const id_periode_payroll = normalizeNullableString(body?.id_periode_payroll);
    if (!id_periode_payroll) {
      return NextResponse.json({ message: "Field 'id_periode_payroll' wajib diisi." }, { status: 400 });
    }

    const level = normalizeRequiredInt(body?.level, 'level', { min: 1 });
    const id_user_penyetuju = normalizeNullableString(body?.id_user_penyetuju);
    const role_penyetuju = normalizeOptionalRoleEnum(body?.role_penyetuju, 'role_penyetuju');
    const keputusan = body?.keputusan === undefined ? 'pending' : normalizeApproveStatus(body?.keputusan, 'keputusan');
    const catatan = normalizeNullableString(body?.catatan);
    const diputuskan_pada_raw = parseDateTime(body?.diputuskan_pada, 'diputuskan_pada');

    await ensurePeriodeExists(id_periode_payroll);
    await ensureApproverConsistency({ id_user_penyetuju, role_penyetuju });

    const decisionState = deriveDecisionState({
      keputusan,
      diputuskan_pada: diputuskan_pada_raw,
      touchedKeputusan: body?.keputusan !== undefined,
      touchedDiputuskanPada: body?.diputuskan_pada !== undefined,
    });

    const existing = await db.persetujuanPeriodePayroll.findFirst({
      where: {
        id_periode_payroll,
        level,
      },
      select: {
        id_persetujuan_periode_payroll: true,
        deleted_at: true,
      },
    });

    const payload = {
      id_periode_payroll,
      level,
      id_user_penyetuju,
      role_penyetuju,
      keputusan: decisionState.keputusan,
      diputuskan_pada: decisionState.diputuskan_pada,
      catatan,
      deleted_at: null,
    };

    if (existing && existing.deleted_at === null) {
      return NextResponse.json(
        {
          message: 'Persetujuan periode payroll dengan kombinasi periode dan level tersebut sudah ada.',
        },
        { status: 409 },
      );
    }

    if (existing && existing.deleted_at !== null) {
      const restored = await db.persetujuanPeriodePayroll.update({
        where: { id_persetujuan_periode_payroll: existing.id_persetujuan_periode_payroll },
        data: payload,
        select: buildSelect(),
      });

      return NextResponse.json(
        {
          message: 'Persetujuan periode payroll berhasil dipulihkan dan diperbarui.',
          data: restored,
        },
        { status: 200 },
      );
    }

    const created = await db.persetujuanPeriodePayroll.create({
      data: payload,
      select: buildSelect(),
    });

    return NextResponse.json(
      {
        message: 'Persetujuan periode payroll berhasil dibuat.',
        data: created,
      },
      { status: 201 },
    );
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

    console.error('POST /api/admin/persetujuan-periode-payroll error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
