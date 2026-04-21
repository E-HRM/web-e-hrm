import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const CREATE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'berlaku_mulai', 'berlaku_sampai', 'gaji_pokok', 'tunjangan_jabatan', 'tunjangan_bpjsk', 'tunjangan_kesehatan']);

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

function parseRequiredDateOnly(value, fieldName) {
  const parsed = parseDateOnly(value, fieldName);
  if (!parsed) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }
  return parsed;
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
    const id_user = (searchParams.get('id_user') || '').trim();

    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());
    const deletedOnly = ['1', 'true'].includes((searchParams.get('deletedOnly') || '').toLowerCase());

    const orderByParam = (searchParams.get('orderBy') || 'created_at').trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam) ? orderByParam : 'created_at';
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const berlakuMulaiFrom = parseDateOnly(searchParams.get('berlakuMulaiFrom'), 'berlakuMulaiFrom');
    const berlakuMulaiTo = parseDateOnly(searchParams.get('berlakuMulaiTo'), 'berlakuMulaiTo');
    const berlakuSampaiFrom = parseDateOnly(searchParams.get('berlakuSampaiFrom'), 'berlakuSampaiFrom');
    const berlakuSampaiTo = parseDateOnly(searchParams.get('berlakuSampaiTo'), 'berlakuSampaiTo');
    const aktifPada = parseDateOnly(searchParams.get('aktifPada'), 'aktifPada');

    if (berlakuMulaiFrom && berlakuMulaiTo && berlakuMulaiFrom > berlakuMulaiTo) {
      return NextResponse.json({ message: 'Parameter berlakuMulaiFrom tidak boleh lebih besar dari berlakuMulaiTo.' }, { status: 400 });
    }

    if (berlakuSampaiFrom && berlakuSampaiTo && berlakuSampaiFrom > berlakuSampaiTo) {
      return NextResponse.json({ message: 'Parameter berlakuSampaiFrom tidak boleh lebih besar dari berlakuSampaiTo.' }, { status: 400 });
    }

    const where = {
      ...(deletedOnly ? { deleted_at: { not: null } } : {}),
      ...(!includeDeleted && !deletedOnly ? { deleted_at: null } : {}),
      ...(id_user ? { id_user } : {}),
      ...(search
        ? {
            OR: [
              { catatan: { contains: search } },
              {
                user: {
                  is: {
                    nama_pengguna: { contains: search },
                  },
                },
              },
              {
                user: {
                  is: {
                    email: { contains: search },
                  },
                },
              },
              {
                user: {
                  is: {
                    nomor_induk_karyawan: { contains: search },
                  },
                },
              },
            ],
          }
        : {}),
      ...(berlakuMulaiFrom || berlakuMulaiTo
        ? {
            berlaku_mulai: {
              ...(berlakuMulaiFrom ? { gte: berlakuMulaiFrom } : {}),
              ...(berlakuMulaiTo ? { lte: berlakuMulaiTo } : {}),
            },
          }
        : {}),
      ...(berlakuSampaiFrom || berlakuSampaiTo
        ? {
            berlaku_sampai: {
              ...(berlakuSampaiFrom ? { gte: berlakuSampaiFrom } : {}),
              ...(berlakuSampaiTo ? { lte: berlakuSampaiTo } : {}),
            },
          }
        : {}),
      ...(aktifPada
        ? {
            AND: [
              { berlaku_mulai: { lte: aktifPada } },
              {
                OR: [{ berlaku_sampai: null }, { berlaku_sampai: { gte: aktifPada } }],
              },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      db.riwayatKompensasiKaryawan.count({ where }),
      db.riwayatKompensasiKaryawan.findMany({
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
    if (err instanceof Error && err.message.includes('tanggal')) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    console.error('GET /api/admin/riwayat-kompensasi-karyawan error:', err);
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

    const id_user = String(body?.id_user || '').trim();
    if (!id_user) {
      return NextResponse.json({ message: "Field 'id_user' wajib diisi." }, { status: 400 });
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

    const berlaku_mulai = parseRequiredDateOnly(body?.berlaku_mulai, 'berlaku_mulai');
    const berlaku_sampai = parseDateOnly(body?.berlaku_sampai, 'berlaku_sampai');

    if (berlaku_sampai && berlaku_sampai < berlaku_mulai) {
      return NextResponse.json({ message: "Field 'berlaku_sampai' tidak boleh lebih kecil dari 'berlaku_mulai'." }, { status: 400 });
    }

    const data = {
      id_user,
      gaji_pokok: parseNonNegativeDecimal(body?.gaji_pokok ?? '0', 'gaji_pokok'),
      tunjangan_jabatan: parseNonNegativeDecimal(body?.tunjangan_jabatan ?? '0', 'tunjangan_jabatan'),
      tunjangan_bpjsk: parseNonNegativeDecimal(body?.tunjangan_bpjsk ?? '0', 'tunjangan_bpjsk'),
      tunjangan_kesehatan: parseNonNegativeDecimal(body?.tunjangan_kesehatan ?? '0', 'tunjangan_kesehatan'),
      berlaku_mulai,
      berlaku_sampai,
      catatan: normalizeNullableString(body?.catatan),
    };

    await ensureNoOverlap({
      id_user,
      berlaku_mulai,
      berlaku_sampai,
      excludeId: null,
    });

    const created = await db.riwayatKompensasiKaryawan.create({
      data,
      select: buildSelect(),
    });

    return NextResponse.json({ message: 'Riwayat kompensasi karyawan berhasil dibuat.', data: created }, { status: 201 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('tanggal') || err.message.includes('angka') || err.message.includes('negatif') || err.message.includes('bertabrakan') || err.message.includes('wajib diisi')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }
    console.error('POST /api/admin/riwayat-kompensasi-karyawan error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
