import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const EDIT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const DELETE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const SHARE_SCALE = 4;

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

function normalizeBoolean(value, fieldName = 'boolean') {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'ya', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'tidak', 'no'].includes(normalized)) return false;
  }

  throw new Error(`Field '${fieldName}' harus bernilai boolean.`);
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
    id_jenis_produk_konsultan: true,
    nama_produk: true,
    persen_share_default: true,
    aktif: true,
    catatan: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    _count: {
      select: {
        transaksi_konsultan: true,
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

    const data = await db.jenisProdukKonsultan.findUnique({
      where: { id_jenis_produk_konsultan: id },
      select: buildSelect(),
    });

    if (!data) {
      return NextResponse.json({ message: 'Jenis produk konsultan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/admin/produk-konsultan/[id] error:', err);
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

    const existing = await db.jenisProdukKonsultan.findUnique({
      where: { id_jenis_produk_konsultan: id },
      select: {
        id_jenis_produk_konsultan: true,
        nama_produk: true,
        persen_share_default: true,
        aktif: true,
        catatan: true,
        deleted_at: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Jenis produk konsultan tidak ditemukan.' }, { status: 404 });
    }

    const payload = {};

    if (body?.nama_produk !== undefined) {
      payload.nama_produk = normalizeRequiredString(body.nama_produk, 'nama_produk', 255);
    }

    if (body?.persen_share_default !== undefined) {
      payload.persen_share_default = normalizeDecimalString(body.persen_share_default, 'persen_share_default', SHARE_SCALE, { allowNull: true, min: '0', max: '100' });
    }

    if (body?.aktif !== undefined) {
      payload.aktif = normalizeBoolean(body.aktif, 'aktif');
    }

    if (body?.catatan !== undefined) {
      payload.catatan = normalizeNullableString(body.catatan, 'catatan');
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ message: 'Tidak ada field yang dikirim untuk diperbarui.' }, { status: 400 });
    }

    const nextNamaProduk = payload.nama_produk ?? existing.nama_produk;

    const duplicate = await db.jenisProdukKonsultan.findFirst({
      where: {
        NOT: {
          id_jenis_produk_konsultan: id,
        },
        nama_produk: nextNamaProduk,
      },
      select: {
        id_jenis_produk_konsultan: true,
        nama_produk: true,
        deleted_at: true,
      },
    });

    if (duplicate) {
      const duplicateState = duplicate.deleted_at ? 'data soft delete lain' : 'data aktif lain';

      return NextResponse.json(
        {
          message: `Nama produk sudah digunakan oleh ${duplicateState}.`,
        },
        { status: 409 },
      );
    }

    const updated = await db.jenisProdukKonsultan.update({
      where: { id_jenis_produk_konsultan: id },
      data: payload,
      select: buildSelect(),
    });

    return NextResponse.json({
      message: 'Jenis produk konsultan berhasil diperbarui.',
      data: updated,
    });
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Nama produk sudah digunakan oleh data lain.' }, { status: 409 });
    }

    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('desimal') || err.message.includes('karakter') || err.message.includes('boolean')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('PUT /api/admin/produk-konsultan/[id] error:', err);
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

    const existing = await db.jenisProdukKonsultan.findUnique({
      where: { id_jenis_produk_konsultan: id },
      select: {
        id_jenis_produk_konsultan: true,
        deleted_at: true,
        _count: {
          select: {
            transaksi_konsultan: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Jenis produk konsultan tidak ditemukan.' }, { status: 404 });
    }

    if (!hardDelete) {
      if (existing.deleted_at) {
        return NextResponse.json(
          {
            message: 'Jenis produk konsultan sudah dihapus sebelumnya.',
            mode: 'soft',
          },
          { status: 409 },
        );
      }

      const deleted = await db.jenisProdukKonsultan.update({
        where: { id_jenis_produk_konsultan: id },
        data: { deleted_at: new Date() },
        select: buildSelect(),
      });

      return NextResponse.json({
        message: 'Jenis produk konsultan berhasil dihapus (soft delete).',
        mode: 'soft',
        data: deleted,
      });
    }

    await db.jenisProdukKonsultan.delete({
      where: { id_jenis_produk_konsultan: id },
    });

    return NextResponse.json({
      message: 'Jenis produk konsultan berhasil dihapus permanen.',
      mode: 'hard',
      relation_summary: {
        transaksi_konsultan_yang_terkait_sebelumnya: existing._count.transaksi_konsultan,
      },
    });
  } catch (err) {
    if (err?.code === 'P2003') {
      return NextResponse.json(
        {
          message: 'Jenis produk konsultan tidak bisa dihapus permanen karena masih direferensikan oleh data lain.',
        },
        { status: 409 },
      );
    }

    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Jenis produk konsultan tidak ditemukan.' }, { status: 404 });
    }

    console.error('DELETE /api/admin/produk-konsultan/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
