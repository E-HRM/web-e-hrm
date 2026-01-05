export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import db from '../../../../../lib/prisma';
import { verifyAuthToken } from '../../../../../lib/jwt';
import { authenticateRequest } from '../../../../utils/auth/authUtils';
import storageClient from '../../../_utils/storageClient';
import { parseRequestBody, findFileInBody, isNullLike } from '../../../_utils/requestBody';
import { parseDateOnlyToUTC } from '../../../../../helpers/date-helper';

const ADMIN_ROLES = new Set(['HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI']);

function getSopDelegate() {
  return db?.sop_karyawan || db?.sopKaryawan || null;
}

async function getActor(req) {
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    try {
      const payload = verifyAuthToken(auth.slice(7));
      return { id: payload?.sub || payload?.id_user || payload?.userId, role: payload?.role, source: 'bearer' };
    } catch (_) {}
  }

  const sessionOrRes = await authenticateRequest();
  if (sessionOrRes instanceof NextResponse) return sessionOrRes;

  return { id: sessionOrRes.user.id, role: sessionOrRes.user.role, source: 'session' };
}

function guardAdmin(actor) {
  const role = String(actor?.role || '')
    .trim()
    .toUpperCase();
  if (!ADMIN_ROLES.has(role)) {
    return NextResponse.json({ message: 'Forbidden: hanya admin yang dapat mengakses resource ini.' }, { status: 403 });
  }
  return null;
}

export async function GET(req, { params }) {
  const actor = await getActor(req);
  if (actor instanceof NextResponse) return actor;
  const forbidden = guardAdmin(actor);
  if (forbidden) return forbidden;

  const sop = getSopDelegate();
  if (!sop) {
    return NextResponse.json({ message: 'Prisma model sop_karyawan tidak ditemukan. Pastikan schema + prisma generate sudah benar.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());

    const data = await sop.findFirst({
      where: {
        id_sop_karyawan: params.id,
        ...(!includeDeleted ? { deleted_at: null } : {}),
      },
    });

    if (!data) return NextResponse.json({ message: 'SOP tidak ditemukan.' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/admin/sop-perusahaan/[id] error:', err);
    return NextResponse.json({ message: 'Gagal mengambil detail SOP.' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const actor = await getActor(req);
  if (actor instanceof NextResponse) return actor;
  const forbidden = guardAdmin(actor);
  if (forbidden) return forbidden;

  const sop = getSopDelegate();
  if (!sop) {
    return NextResponse.json({ message: 'Prisma model sop_karyawan tidak ditemukan. Pastikan schema + prisma generate sudah benar.' }, { status: 500 });
  }

  let parsed;
  try {
    parsed = await parseRequestBody(req);
  } catch (err) {
    const status = err?.status || 400;
    return NextResponse.json({ message: err?.message || 'Body tidak valid.' }, { status });
  }

  const body = parsed.body || {};

  try {
    const updateData = {};

    if (Object.prototype.hasOwnProperty.call(body, 'nama_dokumen')) {
      const nama_dokumen = typeof body.nama_dokumen === 'string' ? body.nama_dokumen.trim() : '';
      if (!nama_dokumen) return NextResponse.json({ message: 'nama_dokumen tidak boleh kosong.' }, { status: 400 });
      updateData.nama_dokumen = nama_dokumen;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'tanggal_terbit')) {
      const tanggal_terbit = parseDateOnlyToUTC(body.tanggal_terbit);
      if (!tanggal_terbit) {
        return NextResponse.json({ message: 'tanggal_terbit tidak valid (format: YYYY-MM-DD).' }, { status: 400 });
      }
      updateData.tanggal_terbit = tanggal_terbit;
    }

    // upload file lampiran SOP
    const lampiranFile = findFileInBody(body, ['lampiran_sop', 'lampiran', 'file', 'lampiran_sop_file']);
    if (lampiranFile) {
      try {
        const res = await storageClient.uploadBufferWithPresign(lampiranFile, { folder: 'sop-perusahaan' });
        updateData.lampiran_sop_url = res.publicUrl || null;
      } catch (e) {
        return NextResponse.json({ message: 'Gagal mengunggah lampiran SOP.', detail: e?.message || String(e) }, { status: 502 });
      }
    } else if (Object.prototype.hasOwnProperty.call(body, 'lampiran_sop_url')) {
      updateData.lampiran_sop_url = isNullLike(body.lampiran_sop_url) ? null : String(body.lampiran_sop_url).trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'Tidak ada field yang diupdate.' }, { status: 400 });
    }

    const updated = await sop.update({
      where: { id_sop_karyawan: params.id },
      data: updateData,
    });

    return NextResponse.json({ message: 'SOP berhasil diupdate.', data: updated });
  } catch (err) {
    if (err?.code === 'P2025') return NextResponse.json({ message: 'SOP tidak ditemukan.' }, { status: 404 });
    console.error('PUT /api/admin/sop-perusahaan/[id] error:', err);
    return NextResponse.json({ message: 'Gagal mengupdate SOP.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const actor = await getActor(req);
  if (actor instanceof NextResponse) return actor;
  const forbidden = guardAdmin(actor);
  if (forbidden) return forbidden;

  const sop = getSopDelegate();
  if (!sop) {
    return NextResponse.json({ message: 'Prisma model sop_karyawan tidak ditemukan. Pastikan schema + prisma generate sudah benar.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const isHardDelete = (searchParams.get('hard') || '').toLowerCase() === 'true';

    if (isHardDelete) {
      await sop.delete({ where: { id_sop_karyawan: params.id } });
      return NextResponse.json({ message: 'SOP dihapus permanen (hard delete).' });
    }

    await sop.update({
      where: { id_sop_karyawan: params.id },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ message: 'SOP dihapus (soft delete).' });
  } catch (err) {
    if (err?.code === 'P2025') return NextResponse.json({ message: 'SOP tidak ditemukan.' }, { status: 404 });
    console.error('DELETE /api/admin/sop-perusahaan/[id] error:', err);
    return NextResponse.json({ message: 'Gagal menghapus SOP.' }, { status: 500 });
  }
}
