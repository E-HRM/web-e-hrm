import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';
import pinjamanCicilanSchedule from '@/helpers/pinjamanCicilanSchedule';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const EDIT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const DELETE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const STATUS_PINJAMAN_VALUES = new Set(['DRAFT', 'AKTIF', 'LUNAS', 'DIBATALKAN']);
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

function buildPinjamanSynchronization({ nominal_pinjaman, tenor_bulan, tanggal_mulai, status_pinjaman, existingTanggalSelesai = null }) {
  if (status_pinjaman === 'AKTIF') {
    const generatedSchedule = buildGeneratedCicilanSchedule({
      nominal_pinjaman,
      tenor_bulan,
      tanggal_mulai,
    });

    return {
      generatedSchedule,
      resolvedSisaSaldo: nominal_pinjaman,
      resolvedTanggalSelesai: generatedSchedule.tanggal_selesai,
      shouldReplaceCicilan: true,
    };
  }

  if (status_pinjaman === 'DRAFT' || status_pinjaman === 'DIBATALKAN') {
    return {
      generatedSchedule: null,
      resolvedSisaSaldo: nominal_pinjaman,
      resolvedTanggalSelesai: null,
      shouldReplaceCicilan: true,
    };
  }

  return {
    generatedSchedule: null,
    resolvedSisaSaldo: '0.00',
    resolvedTanggalSelesai: existingTanggalSelesai,
    shouldReplaceCicilan: false,
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

export async function GET(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { id } = params;

    const data = await db.pinjamanKaryawan.findUnique({
      where: { id_pinjaman_karyawan: id },
      select: buildSelect(),
    });

    if (!data) {
      return NextResponse.json({ message: 'Pinjaman karyawan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data: enrichPinjaman(data) });
  } catch (err) {
    console.error('GET /api/admin/pinjaman-karyawan/[id] error:', err);
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

    const existing = await db.pinjamanKaryawan.findUnique({
      where: { id_pinjaman_karyawan: id },
      select: {
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
        deleted_at: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Pinjaman karyawan tidak ditemukan.' }, { status: 404 });
    }

    const payload = {};

    if (body?.id_user !== undefined) {
      const id_user = normalizeRequiredString(body.id_user, 'id_user', 36);

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
    }

    if (body?.nama_pinjaman !== undefined) {
      payload.nama_pinjaman = normalizeRequiredString(body.nama_pinjaman, 'nama_pinjaman', 255);
    }

    if (body?.nominal_pinjaman !== undefined) {
      payload.nominal_pinjaman = normalizeDecimalString(body.nominal_pinjaman, 'nominal_pinjaman', DECIMAL_SCALE, { min: '0' });
    }

    if (body?.tenor_bulan !== undefined) {
      payload.tenor_bulan = normalizePositiveInteger(body.tenor_bulan, 'tenor_bulan');
    }

    if (body?.tanggal_mulai !== undefined) {
      payload.tanggal_mulai = parseDateOnly(body.tanggal_mulai, 'tanggal_mulai');
      if (!payload.tanggal_mulai) {
        return NextResponse.json({ message: "Field 'tanggal_mulai' tidak boleh kosong." }, { status: 400 });
      }
    }

    if (body?.status_pinjaman !== undefined) {
      payload.status_pinjaman = normalizeEnum(body.status_pinjaman, STATUS_PINJAMAN_VALUES, 'status_pinjaman');
    }

    if (body?.catatan !== undefined) {
      payload.catatan = normalizeNullableString(body.catatan, 'catatan');
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ message: 'Tidak ada field yang dikirim untuk diperbarui.' }, { status: 400 });
    }

    const nextNominalPinjaman = payload.nominal_pinjaman ?? existing.nominal_pinjaman;
    const nextTenorBulan = payload.tenor_bulan ?? existing.tenor_bulan;
    const nextTanggalMulai = payload.tanggal_mulai ?? existing.tanggal_mulai;
    const nextStatusPinjaman = payload.status_pinjaman ?? existing.status_pinjaman;

    const synchronization = buildPinjamanSynchronization({
      nominal_pinjaman: nextNominalPinjaman,
      tenor_bulan: nextTenorBulan,
      tanggal_mulai: nextTanggalMulai,
      status_pinjaman: nextStatusPinjaman,
      existingTanggalSelesai: existing.tanggal_selesai,
    });

    payload.sisa_saldo = synchronization.resolvedSisaSaldo;
    payload.tanggal_selesai = synchronization.resolvedTanggalSelesai;
    payload.status_pinjaman = nextStatusPinjaman;

    validateLoanState({
      nominal_pinjaman: nextNominalPinjaman,
      tenor_bulan: nextTenorBulan,
      sisa_saldo: payload.sisa_saldo,
      tanggal_mulai: nextTanggalMulai,
      tanggal_selesai: payload.tanggal_selesai,
      status_pinjaman: nextStatusPinjaman,
    });

    const updated = await db.$transaction(async (tx) => {
      await tx.pinjamanKaryawan.update({
        where: { id_pinjaman_karyawan: id },
        data: payload,
      });

      if (synchronization.shouldReplaceCicilan) {
        await tx.cicilanPinjamanKaryawan.deleteMany({
          where: {
            id_pinjaman_karyawan: id,
          },
        });

        if (synchronization.generatedSchedule?.cicilanDrafts?.length) {
          await tx.cicilanPinjamanKaryawan.createMany({
            data: synchronization.generatedSchedule.cicilanDrafts.map((cicilan) => ({
              ...cicilan,
              id_pinjaman_karyawan: id,
            })),
          });
        }
      }

      const data = await tx.pinjamanKaryawan.findUnique({
        where: { id_pinjaman_karyawan: id },
        select: buildSelect(),
      });

      return enrichPinjaman(data);
    });

    const message =
      nextStatusPinjaman === 'AKTIF'
        ? 'Pinjaman karyawan berhasil diperbarui dan jadwal cicilan telah digenerate ulang.'
        : nextStatusPinjaman === 'DRAFT'
          ? 'Pinjaman karyawan berhasil diperbarui sebagai draft dan seluruh cicilan terkait telah dibersihkan.'
          : nextStatusPinjaman === 'DIBATALKAN'
            ? 'Pinjaman karyawan berhasil dibatalkan dan seluruh cicilan terkait telah dihapus.'
            : 'Pinjaman karyawan berhasil diperbarui.';

    return NextResponse.json({
      message,
      data: updated,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('status_pinjaman') || err.message.includes('tanggal') || err.message.includes('sisa_saldo') || err.message.includes('lebih besar dari 0')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('PUT /api/admin/pinjaman-karyawan/[id] error:', err);
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

    const existing = await db.pinjamanKaryawan.findUnique({
      where: { id_pinjaman_karyawan: id },
      select: {
        id_pinjaman_karyawan: true,
        status_pinjaman: true,
        deleted_at: true,
        _count: {
          select: {
            cicilan: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Pinjaman karyawan tidak ditemukan.' }, { status: 404 });
    }

    if (!['DRAFT', 'DIBATALKAN'].includes(String(existing.status_pinjaman || '').toUpperCase())) {
      return NextResponse.json(
        {
          message: 'Pinjaman hanya dapat dihapus jika statusnya DRAFT atau DIBATALKAN.',
        },
        { status: 409 },
      );
    }

    if (!hardDelete) {
      if (existing.deleted_at) {
        return NextResponse.json(
          {
            message: 'Pinjaman karyawan sudah dihapus sebelumnya.',
            mode: 'soft',
          },
          { status: 409 },
        );
      }

      const deletedAt = new Date();

      const [deleted, affectedCicilan] = await db.$transaction([
        db.pinjamanKaryawan.update({
          where: { id_pinjaman_karyawan: id },
          data: { deleted_at: deletedAt },
          select: buildSelect(),
        }),
        db.cicilanPinjamanKaryawan.updateMany({
          where: {
            id_pinjaman_karyawan: id,
            deleted_at: null,
          },
          data: {
            deleted_at: deletedAt,
          },
        }),
      ]);

      return NextResponse.json({
        message: 'Pinjaman karyawan berhasil dihapus.',
        mode: 'soft',
        data: enrichPinjaman(deleted),
        cascade_summary: {
          cicilan_soft_deleted: affectedCicilan.count,
        },
      });
    }

    const deletedSummary = await db.$transaction(async (tx) => {
      const affectedCicilan = await tx.cicilanPinjamanKaryawan.deleteMany({
        where: {
          id_pinjaman_karyawan: id,
        },
      });

      await tx.pinjamanKaryawan.delete({
        where: { id_pinjaman_karyawan: id },
      });

      return affectedCicilan.count;
    });

    return NextResponse.json({
      message: 'Pinjaman karyawan berhasil dihapus permanen.',
      mode: 'hard',
      relation_summary: {
        cicilan_terhapus: deletedSummary,
      },
    });
  } catch (err) {
    if (err?.code === 'P2003') {
      return NextResponse.json(
        {
          message: 'Pinjaman karyawan tidak bisa dihapus permanen karena masih direferensikan oleh data lain.',
        },
        { status: 409 },
      );
    }

    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Pinjaman karyawan tidak ditemukan.' }, { status: 404 });
    }

    console.error('DELETE /api/admin/pinjaman-karyawan/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
