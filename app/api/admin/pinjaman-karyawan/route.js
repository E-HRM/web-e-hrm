import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';
import pinjamanCicilanSchedule from '@/helpers/pinjamanCicilanSchedule';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const CREATE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const STATUS_PINJAMAN_VALUES = new Set(['DRAFT', 'AKTIF', 'LUNAS', 'DIBATALKAN']);

const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'nama_pinjaman', 'nominal_pinjaman', 'tenor_bulan', 'sisa_saldo', 'tanggal_mulai', 'tanggal_selesai', 'status_pinjaman']);

const DECIMAL_SCALE = 2;
const { buildGeneratedCicilanSchedule, calculateNominalCicilan } = pinjamanCicilanSchedule;

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

function stripLeadingZeros(numStr) {
  const stripped = numStr.replace(/^0+(?=\d)/, '');
  return stripped || '0';
}

function decimalToScaledBigInt(value, scale) {
  const stringValue = String(value);
  const negative = stringValue.startsWith('-');
  const unsigned = negative ? stringValue.slice(1) : stringValue;
  const [intPartRaw, fracPartRaw = ''] = unsigned.split('.');
  const intPart = stripLeadingZeros(intPartRaw || '0');
  const fracPart = fracPartRaw.padEnd(scale, '0').slice(0, scale);
  const bigintValue = BigInt(`${intPart}${fracPart}`);
  return negative ? -bigintValue : bigintValue;
}

function normalizeDecimalString(value, fieldName, scale, options = {}) {
  const { allowNull = false, min = null, max = null } = options;

  if (value === undefined) return undefined;
  if (value === null || value === '') {
    if (allowNull) return null;
    throw new Error(`Field '${fieldName}' tidak boleh kosong.`);
  }

  const raw = String(value).trim().replace(',', '.');

  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    throw new Error(`Field '${fieldName}' harus berupa angka desimal yang valid.`);
  }

  const [integerPartRaw, fractionPartRaw = ''] = raw.split('.');
  if (fractionPartRaw.length > scale) {
    throw new Error(`Field '${fieldName}' maksimal memiliki ${scale} angka desimal.`);
  }

  const negative = integerPartRaw.startsWith('-');
  const integerDigits = negative ? integerPartRaw.slice(1) : integerPartRaw;
  const normalizedInteger = stripLeadingZeros(integerDigits || '0');
  const normalizedFraction = fractionPartRaw.padEnd(scale, '0');

  const normalized = `${negative ? '-' : ''}${normalizedInteger}.${normalizedFraction}`;
  const scaledValue = decimalToScaledBigInt(normalized, scale);

  if (min !== null && scaledValue < decimalToScaledBigInt(min, scale)) {
    throw new Error(`Field '${fieldName}' tidak boleh lebih kecil dari ${min}.`);
  }

  if (max !== null && scaledValue > decimalToScaledBigInt(max, scale)) {
    throw new Error(`Field '${fieldName}' tidak boleh lebih besar dari ${max}.`);
  }

  return normalized;
}

function normalizePositiveInteger(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  const raw = String(value).trim();

  if (!/^\d+$/.test(raw)) {
    throw new Error(`Field '${fieldName}' harus berupa bilangan bulat lebih besar dari 0.`);
  }

  const parsed = Number(raw);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Field '${fieldName}' harus berupa bilangan bulat lebih besar dari 0.`);
  }

  return parsed;
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

function buildSelect() {
  return {
    id_pinjaman_karyawan: true,
    id_user: true,
    nama_pinjaman: true,
    nominal_pinjaman: true,
    tenor_bulan: true,
    sisa_saldo: true,
    tanggal_mulai: true,
    tanggal_selesai: true,
    status_pinjaman: true,
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
    _count: {
      select: {
        cicilan: true,
      },
    },
  };
}

function enrichPinjaman(data) {
  if (!data) return data;

  return {
    ...data,
    nominal_cicilan: calculateNominalCicilan({
      nominal_pinjaman: data.nominal_pinjaman,
      tenor_bulan: data.tenor_bulan,
    }),
  };
}

function validateLoanState({ nominal_pinjaman, tenor_bulan, sisa_saldo, tanggal_mulai, tanggal_selesai, status_pinjaman }) {
  const nominalPinjaman = decimalToScaledBigInt(nominal_pinjaman, DECIMAL_SCALE);
  const sisaSaldo = decimalToScaledBigInt(sisa_saldo, DECIMAL_SCALE);

  if (nominalPinjaman <= 0n) {
    throw new Error("Field 'nominal_pinjaman' harus lebih besar dari 0.");
  }

  if (!Number.isInteger(Number(tenor_bulan)) || Number(tenor_bulan) <= 0) {
    throw new Error("Field 'tenor_bulan' harus berupa bilangan bulat lebih besar dari 0.");
  }

  if (sisaSaldo < 0n) {
    throw new Error("Field 'sisa_saldo' tidak boleh bernilai negatif.");
  }

  if (sisaSaldo > nominalPinjaman) {
    throw new Error("Field 'sisa_saldo' tidak boleh lebih besar dari 'nominal_pinjaman'.");
  }

  if (tanggal_selesai && tanggal_selesai < tanggal_mulai) {
    throw new Error("Field 'tanggal_selesai' tidak boleh lebih kecil dari 'tanggal_mulai'.");
  }

  if (status_pinjaman === 'LUNAS' && sisaSaldo !== 0n) {
    throw new Error("Status pinjaman 'LUNAS' mensyaratkan 'sisa_saldo' bernilai 0.");
  }

  if (status_pinjaman === 'AKTIF' && sisaSaldo === 0n) {
    throw new Error("Status pinjaman 'AKTIF' tidak valid jika 'sisa_saldo' bernilai 0. Gunakan status 'LUNAS'.");
  }
}

function validateCreateStatus(status_pinjaman) {
  if (status_pinjaman === 'LUNAS') {
    throw new Error("Pinjaman baru tidak dapat langsung dibuat dengan status 'LUNAS'.");
  }
}

function buildCreateScheduleSnapshot({ nominal_pinjaman, tenor_bulan, tanggal_mulai, status_pinjaman }) {
  if (status_pinjaman !== 'AKTIF') {
    return {
      generatedSchedule: null,
      resolvedTanggalSelesai: null,
      resolvedSisaSaldo: nominal_pinjaman,
    };
  }

  const generatedSchedule = buildGeneratedCicilanSchedule({
    nominal_pinjaman,
    tenor_bulan,
    tanggal_mulai,
  });

  return {
    generatedSchedule,
    resolvedTanggalSelesai: generatedSchedule.tanggal_selesai,
    resolvedSisaSaldo: nominal_pinjaman,
  };
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

    const status_pinjaman = searchParams.get('status_pinjaman') ? normalizeEnum(searchParams.get('status_pinjaman'), STATUS_PINJAMAN_VALUES, 'status_pinjaman') : undefined;

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
      andConditions.push(
        { tanggal_mulai: { lte: aktifPada } },
        {
          OR: [{ tanggal_selesai: null }, { tanggal_selesai: { gte: aktifPada } }],
        },
      );
    }

    const where = {
      ...(deletedOnly ? { deleted_at: { not: null } } : {}),
      ...(!includeDeleted && !deletedOnly ? { deleted_at: null } : {}),
      ...(id_user ? { id_user } : {}),
      ...(status_pinjaman ? { status_pinjaman } : {}),
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
            OR: [
              { nama_pinjaman: { contains: search } },
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
      ...(andConditions.length ? { AND: andConditions } : {}),
    };

    const [total, data] = await Promise.all([
      db.pinjamanKaryawan.count({ where }),
      db.pinjamanKaryawan.findMany({
        where,
        orderBy: { [orderBy]: sort },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: buildSelect(),
      }),
    ]);

    return NextResponse.json({
      data: data.map(enrichPinjaman),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('status_pinjaman') || err.message.includes('tanggal')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('GET /api/admin/pinjaman-karyawan error:', err);
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

    const id_user = normalizeRequiredString(body?.id_user, 'id_user', 36);
    const nama_pinjaman = normalizeRequiredString(body?.nama_pinjaman, 'nama_pinjaman', 255);

    const nominal_pinjaman = normalizeDecimalString(body?.nominal_pinjaman, 'nominal_pinjaman', DECIMAL_SCALE, { min: '0' });
    const tenor_bulan = normalizePositiveInteger(body?.tenor_bulan, 'tenor_bulan');

    const tanggal_mulai = parseRequiredDateOnly(body?.tanggal_mulai, 'tanggal_mulai');
    const status_pinjaman = body?.status_pinjaman === undefined ? 'DRAFT' : normalizeEnum(body?.status_pinjaman, STATUS_PINJAMAN_VALUES, 'status_pinjaman');
    const catatan = normalizeNullableString(body?.catatan, 'catatan');

    validateCreateStatus(status_pinjaman);

    const { generatedSchedule, resolvedTanggalSelesai, resolvedSisaSaldo } = buildCreateScheduleSnapshot({
      nominal_pinjaman,
      tenor_bulan,
      tanggal_mulai,
      status_pinjaman,
    });

    validateLoanState({
      nominal_pinjaman,
      tenor_bulan,
      sisa_saldo: resolvedSisaSaldo,
      tanggal_mulai,
      tanggal_selesai: resolvedTanggalSelesai,
      status_pinjaman,
    });

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

    const created = await db.$transaction(async (tx) => {
      const createdPinjaman = await tx.pinjamanKaryawan.create({
        data: {
          id_user,
          nama_pinjaman,
          nominal_pinjaman,
          tenor_bulan,
          sisa_saldo: resolvedSisaSaldo,
          tanggal_mulai,
          tanggal_selesai: resolvedTanggalSelesai,
          status_pinjaman,
          catatan,
        },
        select: {
          id_pinjaman_karyawan: true,
        },
      });

      if (generatedSchedule?.cicilanDrafts?.length) {
        await tx.cicilanPinjamanKaryawan.createMany({
          data: generatedSchedule.cicilanDrafts.map((cicilan) => ({
            ...cicilan,
            id_pinjaman_karyawan: createdPinjaman.id_pinjaman_karyawan,
          })),
        });
      }

      const data = await tx.pinjamanKaryawan.findUnique({
        where: { id_pinjaman_karyawan: createdPinjaman.id_pinjaman_karyawan },
        select: buildSelect(),
      });

      return enrichPinjaman(data);
    });

    const message =
      status_pinjaman === 'AKTIF'
        ? 'Pinjaman karyawan berhasil dibuat dan jadwal cicilan otomatis telah digenerate.'
        : 'Pinjaman karyawan berhasil dibuat tanpa generate cicilan karena status belum aktif.';

    return NextResponse.json({ message, data: created }, { status: 201 });
  } catch (err) {
    if (err instanceof Error) {
      if (
        err.message.startsWith('Field ') ||
        err.message.includes('status_pinjaman') ||
        err.message.includes('tanggal') ||
        err.message.includes('sisa_saldo') ||
        err.message.includes('lebih besar dari 0') ||
        err.message.includes("langsung dibuat dengan status 'LUNAS'")
      ) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('POST /api/admin/pinjaman-karyawan error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
