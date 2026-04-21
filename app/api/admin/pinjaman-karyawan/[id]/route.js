import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const EDIT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const DELETE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const STATUS_PINJAMAN_VALUES = new Set(['AKTIF', 'LUNAS', 'DIBATALKAN']);
const DECIMAL_SCALE = 2;

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
    nominal_cicilan: true,
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

function validateLoanState({ nominal_pinjaman, nominal_cicilan, sisa_saldo, tanggal_mulai, tanggal_selesai, status_pinjaman }) {
  const nominalPinjaman = decimalToScaledBigInt(nominal_pinjaman, DECIMAL_SCALE);
  const nominalCicilan = decimalToScaledBigInt(nominal_cicilan, DECIMAL_SCALE);
  const sisaSaldo = decimalToScaledBigInt(sisa_saldo, DECIMAL_SCALE);

  if (nominalPinjaman <= 0n) {
    throw new Error("Field 'nominal_pinjaman' harus lebih besar dari 0.");
  }

  if (nominalCicilan <= 0n) {
    throw new Error("Field 'nominal_cicilan' harus lebih besar dari 0.");
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

    return NextResponse.json({ data });
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
        nominal_cicilan: true,
        sisa_saldo: true,
        tanggal_mulai: true,
        tanggal_selesai: true,
        status_pinjaman: true,
        catatan: true,
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

    const payload = {};

    let nextIdUser = existing.id_user;
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
      nextIdUser = id_user;
    }

    if (body?.nama_pinjaman !== undefined) {
      payload.nama_pinjaman = normalizeRequiredString(body.nama_pinjaman, 'nama_pinjaman', 255);
    }

    if (body?.nominal_pinjaman !== undefined) {
      payload.nominal_pinjaman = normalizeDecimalString(body.nominal_pinjaman, 'nominal_pinjaman', DECIMAL_SCALE, { min: '0' });
    }

    if (body?.nominal_cicilan !== undefined) {
      payload.nominal_cicilan = normalizeDecimalString(body.nominal_cicilan, 'nominal_cicilan', DECIMAL_SCALE, { min: '0' });
    }

    if (body?.sisa_saldo !== undefined) {
      payload.sisa_saldo = normalizeDecimalString(body.sisa_saldo, 'sisa_saldo', DECIMAL_SCALE, { min: '0' });
    }

    if (body?.tanggal_mulai !== undefined) {
      payload.tanggal_mulai = parseDateOnly(body.tanggal_mulai, 'tanggal_mulai');
      if (!payload.tanggal_mulai) {
        return NextResponse.json({ message: "Field 'tanggal_mulai' tidak boleh kosong." }, { status: 400 });
      }
    }

    if (body?.tanggal_selesai !== undefined) {
      payload.tanggal_selesai = parseDateOnly(body.tanggal_selesai, 'tanggal_selesai');
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
    const nextNominalCicilan = payload.nominal_cicilan ?? existing.nominal_cicilan;
    const nextSisaSaldo = payload.sisa_saldo ?? existing.sisa_saldo;
    const nextTanggalMulai = payload.tanggal_mulai ?? existing.tanggal_mulai;
    const nextTanggalSelesai = Object.prototype.hasOwnProperty.call(payload, 'tanggal_selesai') ? payload.tanggal_selesai : existing.tanggal_selesai;

    const statusProvided = Object.prototype.hasOwnProperty.call(payload, 'status_pinjaman');
    const nextStatusPinjaman = statusProvided
      ? payload.status_pinjaman
      : decimalToScaledBigInt(nextSisaSaldo, DECIMAL_SCALE) === 0n
        ? existing.status_pinjaman === 'DIBATALKAN'
          ? 'DIBATALKAN'
          : 'LUNAS'
        : existing.status_pinjaman === 'LUNAS'
          ? 'AKTIF'
          : existing.status_pinjaman;

    payload.status_pinjaman = nextStatusPinjaman;

    validateLoanState({
      nominal_pinjaman: nextNominalPinjaman,
      nominal_cicilan: nextNominalCicilan,
      sisa_saldo: nextSisaSaldo,
      tanggal_mulai: nextTanggalMulai,
      tanggal_selesai: nextTanggalSelesai,
      status_pinjaman: nextStatusPinjaman,
    });

    const updated = await db.pinjamanKaryawan.update({
      where: { id_pinjaman_karyawan: id },
      data: payload,
      select: buildSelect(),
    });

    return NextResponse.json({
      message: 'Pinjaman karyawan berhasil diperbarui.',
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
        message: 'Pinjaman karyawan berhasil dihapus (soft delete).',
        mode: 'soft',
        data: deleted,
        cascade_summary: {
          cicilan_soft_deleted: affectedCicilan.count,
        },
      });
    }

    await db.pinjamanKaryawan.delete({
      where: { id_pinjaman_karyawan: id },
    });

    return NextResponse.json({
      message: 'Pinjaman karyawan berhasil dihapus permanen.',
      mode: 'hard',
      relation_summary: {
        cicilan_terhapus_mengikuti_cascade: existing._count.cicilan,
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
