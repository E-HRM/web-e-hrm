import { NextResponse } from 'next/server';

import { authenticateRequest } from '../../../../../app/utils/auth/authUtils';
import { normalizeKodeKategoriPajak } from '../../../../../helpers/kodeKategoriPajak';
import { verifyAuthToken } from '../../../../../lib/jwt';
import db from '../../../../../lib/prisma';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const EDIT_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const DELETE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const INCOME_SCALE = 2;
const PERCENT_SCALE = 4;

const normRole = (role) =>
  String(role || '')
    .trim()
    .toUpperCase();

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
    id_tarif_pajak_ter: true,
    kode_kategori_pajak: true,
    penghasilan_dari: true,
    penghasilan_sampai: true,
    persen_tarif: true,
    berlaku_mulai: true,
    berlaku_sampai: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
  };
}

async function ensureNoDuplicate({ kode_kategori_pajak, penghasilan_dari, penghasilan_sampai, berlaku_mulai, berlaku_sampai, excludeId = null }) {
  const duplicate = await db.tarifPajakTER.findFirst({
    where: {
      kode_kategori_pajak,
      penghasilan_dari,
      penghasilan_sampai,
      berlaku_mulai,
      berlaku_sampai,
      deleted_at: null,
      ...(excludeId
        ? {
            NOT: {
              id_tarif_pajak_ter: excludeId,
            },
          }
        : {}),
    },
    select: {
      id_tarif_pajak_ter: true,
    },
  });

  if (duplicate) {
    throw new Error('Tarif pajak TER duplikat. Kombinasi kode kategori pajak, periode berlaku, dan rentang penghasilan yang sama sudah ada.');
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

    const data = await db.tarifPajakTER.findUnique({
      where: { id_tarif_pajak_ter: id },
      select: buildSelect(),
    });

    if (!data) {
      return NextResponse.json({ message: 'Tarif pajak TER tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/admin/tarif-pajak-ter/[id] error:', err);
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

    const existing = await db.tarifPajakTER.findUnique({
      where: { id_tarif_pajak_ter: id },
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
    });

    if (!existing) {
      return NextResponse.json({ message: 'Tarif pajak TER tidak ditemukan.' }, { status: 404 });
    }

    const payload = {};

    if (body?.kode_kategori_pajak !== undefined || body?.kategori_ter !== undefined) {
      payload.kode_kategori_pajak = normalizeKodeKategoriPajak(body?.kode_kategori_pajak ?? body?.kategori_ter);
    }

    if (body?.penghasilan_dari !== undefined) {
      payload.penghasilan_dari = normalizeDecimalString(body.penghasilan_dari, 'penghasilan_dari', INCOME_SCALE, { min: '0' });
    }

    if (body?.penghasilan_sampai !== undefined) {
      payload.penghasilan_sampai = normalizeDecimalString(body.penghasilan_sampai, 'penghasilan_sampai', INCOME_SCALE, { allowNull: true, min: '0' });
    }

    if (body?.persen_tarif !== undefined) {
      payload.persen_tarif = normalizeDecimalString(body.persen_tarif, 'persen_tarif', PERCENT_SCALE, { min: '0', max: '100' });
    }

    if (body?.berlaku_mulai !== undefined) {
      payload.berlaku_mulai = parseDateOnly(body.berlaku_mulai, 'berlaku_mulai');
      if (!payload.berlaku_mulai) {
        return NextResponse.json({ message: "Field 'berlaku_mulai' tidak boleh kosong." }, { status: 400 });
      }
    }

    if (body?.berlaku_sampai !== undefined) {
      payload.berlaku_sampai = parseDateOnly(body.berlaku_sampai, 'berlaku_sampai');
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ message: 'Tidak ada field yang dikirim untuk diperbarui.' }, { status: 400 });
    }

    const nextKodeKategoriPajak = payload.kode_kategori_pajak ?? existing.kode_kategori_pajak;
    const nextPenghasilanDari = payload.penghasilan_dari ?? existing.penghasilan_dari;
    const nextPenghasilanSampai = Object.prototype.hasOwnProperty.call(payload, 'penghasilan_sampai') ? payload.penghasilan_sampai : existing.penghasilan_sampai;
    const nextBerlakuMulai = payload.berlaku_mulai ?? existing.berlaku_mulai;
    const nextBerlakuSampai = Object.prototype.hasOwnProperty.call(payload, 'berlaku_sampai') ? payload.berlaku_sampai : existing.berlaku_sampai;

    const fromIncome = decimalToScaledBigInt(nextPenghasilanDari, INCOME_SCALE);
    const untilIncome = nextPenghasilanSampai === null ? null : decimalToScaledBigInt(nextPenghasilanSampai, INCOME_SCALE);

    if (untilIncome !== null && untilIncome < fromIncome) {
      return NextResponse.json({ message: "Field 'penghasilan_sampai' tidak boleh lebih kecil dari 'penghasilan_dari'." }, { status: 400 });
    }

    if (nextBerlakuSampai && nextBerlakuSampai < nextBerlakuMulai) {
      return NextResponse.json({ message: "Field 'berlaku_sampai' tidak boleh lebih kecil dari 'berlaku_mulai'." }, { status: 400 });
    }

    await ensureNoDuplicate({
      kode_kategori_pajak: nextKodeKategoriPajak,
      penghasilan_dari: nextPenghasilanDari,
      penghasilan_sampai: nextPenghasilanSampai,
      berlaku_mulai: nextBerlakuMulai,
      berlaku_sampai: nextBerlakuSampai,
      excludeId: id,
    });

    const updated = await db.tarifPajakTER.update({
      where: { id_tarif_pajak_ter: id },
      data: payload,
      select: buildSelect(),
    });

    return NextResponse.json({
      message: 'Tarif pajak TER berhasil diperbarui.',
      data: updated,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('kode_kategori_pajak') || err.message.includes('duplikat')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('PUT /api/admin/tarif-pajak-ter/[id] error:', err);
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

    const existing = await db.tarifPajakTER.findUnique({
      where: { id_tarif_pajak_ter: id },
      select: {
        id_tarif_pajak_ter: true,
        deleted_at: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Tarif pajak TER tidak ditemukan.' }, { status: 404 });
    }

    if (!hardDelete) {
      if (existing.deleted_at) {
        return NextResponse.json({
          message: 'Tarif pajak TER sudah dihapus sebelumnya.',
          mode: 'soft',
        });
      }

      const deleted = await db.tarifPajakTER.update({
        where: { id_tarif_pajak_ter: id },
        data: { deleted_at: new Date() },
        select: buildSelect(),
      });

      return NextResponse.json({
        message: 'Tarif pajak TER berhasil dihapus (soft delete).',
        mode: 'soft',
        data: deleted,
      });
    }

    await db.tarifPajakTER.delete({
      where: { id_tarif_pajak_ter: id },
    });

    return NextResponse.json({
      message: 'Tarif pajak TER berhasil dihapus permanen.',
      mode: 'hard',
    });
  } catch (err) {
    if (err?.code === 'P2003') {
      return NextResponse.json(
        {
          message: 'Tarif pajak TER tidak bisa dihapus permanen karena masih direferensikan oleh data lain.',
        },
        { status: 409 },
      );
    }

    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Tarif pajak TER tidak ditemukan.' }, { status: 404 });
    }

    console.error('DELETE /api/admin/tarif-pajak-ter/[id] error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
