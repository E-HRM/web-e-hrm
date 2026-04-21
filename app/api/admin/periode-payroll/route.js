import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const CREATE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const BULAN_VALUES = new Set(['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']);

const STATUS_PERIODE_VALUES = new Set(['DRAFT', 'DIPROSES', 'DIREVIEW', 'FINAL', 'TERKUNCI']);

const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'tahun', 'bulan', 'tanggal_mulai', 'tanggal_selesai', 'status_periode', 'diproses_pada', 'difinalkan_pada']);

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

function parseRequiredDateOnly(value, fieldName) {
  const parsed = parseDateOnly(value, fieldName);
  if (!parsed) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }
  return parsed;
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

function validatePeriodeState({ tahun, bulan, tanggal_mulai, tanggal_selesai, status_periode, diproses_pada, difinalkan_pada }) {
  if (tahun < 2000 || tahun > 9999) {
    throw new Error("Field 'tahun' harus berada pada rentang 2000 sampai 9999.");
  }

  if (tanggal_selesai < tanggal_mulai) {
    throw new Error("Field 'tanggal_selesai' tidak boleh lebih kecil dari 'tanggal_mulai'.");
  }

  if (diproses_pada && difinalkan_pada && difinalkan_pada < diproses_pada) {
    throw new Error("Field 'difinalkan_pada' tidak boleh lebih kecil dari 'diproses_pada'.");
  }

  if (['DIPROSES', 'DIREVIEW', 'FINAL', 'TERKUNCI'].includes(status_periode) && !diproses_pada) {
    throw new Error(`Status periode '${status_periode}' mensyaratkan field 'diproses_pada' terisi.`);
  }

  if (['FINAL', 'TERKUNCI'].includes(status_periode) && !difinalkan_pada) {
    throw new Error(`Status periode '${status_periode}' mensyaratkan field 'difinalkan_pada' terisi.`);
  }

  if (status_periode === 'DRAFT' && difinalkan_pada) {
    throw new Error("Status periode 'DRAFT' tidak valid jika 'difinalkan_pada' sudah terisi.");
  }

  if (status_periode === 'DRAFT' && diproses_pada) {
    throw new Error("Status periode 'DRAFT' tidak valid jika 'diproses_pada' sudah terisi.");
  }

  if (status_periode === 'DIPROSES' && difinalkan_pada) {
    throw new Error("Status periode 'DIPROSES' tidak valid jika 'difinalkan_pada' sudah terisi.");
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
    diproses_pada: true,
    difinalkan_pada: true,
    catatan: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    _count: {
      select: {
        payroll_karyawan: true,
        persetujuan_periode: true,
        payout_konsultan: true,
      },
    },
  };
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

    const tahun = searchParams.get('tahun') !== null && searchParams.get('tahun') !== '' ? normalizeRequiredInt(searchParams.get('tahun'), 'tahun', { min: 2000, max: 9999 }) : undefined;

    const bulan = searchParams.get('bulan') ? normalizeEnum(searchParams.get('bulan'), BULAN_VALUES, 'bulan') : undefined;

    const status_periode = searchParams.get('status_periode') ? normalizeEnum(searchParams.get('status_periode'), STATUS_PERIODE_VALUES, 'status_periode') : undefined;

    const orderByParam = (searchParams.get('orderBy') || 'created_at').trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam) ? orderByParam : 'created_at';
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const tanggalMulaiFrom = parseDateOnly(searchParams.get('tanggalMulaiFrom'), 'tanggalMulaiFrom');
    const tanggalMulaiTo = parseDateOnly(searchParams.get('tanggalMulaiTo'), 'tanggalMulaiTo');
    const tanggalSelesaiFrom = parseDateOnly(searchParams.get('tanggalSelesaiFrom'), 'tanggalSelesaiFrom');
    const tanggalSelesaiTo = parseDateOnly(searchParams.get('tanggalSelesaiTo'), 'tanggalSelesaiTo');
    const aktifPada = parseDateOnly(searchParams.get('aktifPada'), 'aktifPada');

    if (tanggalMulaiFrom && tanggalMulaiTo && tanggalMulaiFrom > tanggalMulaiTo) {
      return NextResponse.json({ message: 'Parameter tanggalMulaiFrom tidak boleh lebih besar dari tanggalMulaiTo.' }, { status: 400 });
    }

    if (tanggalSelesaiFrom && tanggalSelesaiTo && tanggalSelesaiFrom > tanggalSelesaiTo) {
      return NextResponse.json({ message: 'Parameter tanggalSelesaiFrom tidak boleh lebih besar dari tanggalSelesaiTo.' }, { status: 400 });
    }

    const andConditions = [];

    if (aktifPada) {
      andConditions.push({ tanggal_mulai: { lte: aktifPada } }, { tanggal_selesai: { gte: aktifPada } });
    }

    const where = {
      ...(deletedOnly ? { deleted_at: { not: null } } : {}),
      ...(!includeDeleted && !deletedOnly ? { deleted_at: null } : {}),
      ...(typeof tahun === 'number' ? { tahun } : {}),
      ...(bulan ? { bulan } : {}),
      ...(status_periode ? { status_periode } : {}),
      ...(tanggalMulaiFrom || tanggalMulaiTo
        ? {
            tanggal_mulai: {
              ...(tanggalMulaiFrom ? { gte: tanggalMulaiFrom } : {}),
              ...(tanggalMulaiTo ? { lte: tanggalMulaiTo } : {}),
            },
          }
        : {}),
      ...(tanggalSelesaiFrom || tanggalSelesaiTo
        ? {
            tanggal_selesai: {
              ...(tanggalSelesaiFrom ? { gte: tanggalSelesaiFrom } : {}),
              ...(tanggalSelesaiTo ? { lte: tanggalSelesaiTo } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [{ bulan: { equals: search.toUpperCase() } }, { catatan: { contains: search } }],
          }
        : {}),
      ...(andConditions.length ? { AND: andConditions } : {}),
    };

    const [total, data] = await Promise.all([
      db.periodePayroll.count({ where }),
      db.periodePayroll.findMany({
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
    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('tidak valid') || err.message.includes('tanggal')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('GET /api/admin/periode-payroll error:', err);
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

    const tahun = normalizeRequiredInt(body?.tahun, 'tahun', { min: 2000, max: 9999 });
    const bulan = normalizeEnum(body?.bulan, BULAN_VALUES, 'bulan');
    const tanggal_mulai = parseRequiredDateOnly(body?.tanggal_mulai, 'tanggal_mulai');
    const tanggal_selesai = parseRequiredDateOnly(body?.tanggal_selesai, 'tanggal_selesai');
    const status_periode = body?.status_periode === undefined ? 'DRAFT' : normalizeEnum(body?.status_periode, STATUS_PERIODE_VALUES, 'status_periode');
    const diproses_pada = parseDateTime(body?.diproses_pada, 'diproses_pada');
    const difinalkan_pada = parseDateTime(body?.difinalkan_pada, 'difinalkan_pada');
    const catatan = normalizeNullableString(body?.catatan, 'catatan');

    validatePeriodeState({
      tahun,
      bulan,
      tanggal_mulai,
      tanggal_selesai,
      status_periode,
      diproses_pada,
      difinalkan_pada,
    });

    const existing = await db.periodePayroll.findFirst({
      where: { tahun, bulan },
      select: {
        id_periode_payroll: true,
        deleted_at: true,
      },
    });

    const payload = {
      tahun,
      bulan,
      tanggal_mulai,
      tanggal_selesai,
      status_periode,
      diproses_pada,
      difinalkan_pada,
      catatan,
      deleted_at: null,
    };

    if (existing && existing.deleted_at === null) {
      return NextResponse.json({ message: 'Periode payroll untuk tahun dan bulan tersebut sudah ada.' }, { status: 409 });
    }

    if (existing && existing.deleted_at !== null) {
      const restored = await db.periodePayroll.update({
        where: { id_periode_payroll: existing.id_periode_payroll },
        data: payload,
        select: buildSelect(),
      });

      return NextResponse.json(
        {
          message: 'Periode payroll berhasil dipulihkan dan diperbarui.',
          data: restored,
        },
        { status: 200 },
      );
    }

    const created = await db.periodePayroll.create({
      data: payload,
      select: buildSelect(),
    });

    return NextResponse.json({ message: 'Periode payroll berhasil dibuat.', data: created }, { status: 201 });
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Periode payroll untuk tahun dan bulan tersebut sudah ada.' }, { status: 409 });
    }

    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('tidak valid') || err.message.includes('tanggal') || err.message.includes('Status periode')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('POST /api/admin/periode-payroll error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
