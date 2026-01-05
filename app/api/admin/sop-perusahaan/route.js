export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import db from '../../../../lib/prisma';
import { verifyAuthToken } from '../../../../lib/jwt';
import { authenticateRequest } from '../../../utils/auth/authUtils';
import storageClient from '../../_utils/storageClient';
import { parseRequestBody, findFileInBody, isNullLike } from '../../_utils/requestBody';
import { parseDateOnlyToUTC } from '../../../../helpers/date-helper';

const ADMIN_ROLES = new Set(['HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI']);
const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'tanggal_terbit', 'nama_dokumen']);

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

export async function GET(req) {
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

    const search = (searchParams.get('search') || '').trim();
    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());
    const deletedOnly = ['1', 'true'].includes((searchParams.get('deletedOnly') || '').toLowerCase());

    const orderByParam = (searchParams.get('orderBy') || 'created_at').trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam) ? orderByParam : 'created_at';
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    // "GET dapat dilihat semua" => default tetap support pagination, tapi bisa all=true untuk ambil semua
    const all = ['1', 'true'].includes((searchParams.get('all') || '').toLowerCase());
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1), 100);

    const where = {
      ...(deletedOnly ? { deleted_at: { not: null } } : {}),
      ...(!includeDeleted && !deletedOnly ? { deleted_at: null } : {}),
      ...(search ? { OR: [{ nama_dokumen: { contains: search } }] } : {}),
    };

    if (all) {
      const items = await sop.findMany({
        where,
        orderBy: { [orderBy]: sort },
      });
      return NextResponse.json({ total: items.length, items });
    }

    const [total, items] = await Promise.all([
      sop.count({ where }),
      sop.findMany({
        where,
        orderBy: { [orderBy]: sort },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      items,
    });
  } catch (err) {
    console.error('GET /api/admin/sop-perusahaan error:', err);
    return NextResponse.json({ message: 'Gagal mengambil daftar SOP perusahaan.' }, { status: 500 });
  }
}

export async function POST(req) {
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
    const nama_dokumen = typeof body?.nama_dokumen === 'string' ? body.nama_dokumen.trim() : '';
    if (!nama_dokumen) return NextResponse.json({ message: 'nama_dokumen wajib diisi.' }, { status: 400 });

    const tanggal_terbit = parseDateOnlyToUTC(body?.tanggal_terbit);
    if (!tanggal_terbit) {
      return NextResponse.json({ message: 'tanggal_terbit wajib & valid (format: YYYY-MM-DD).' }, { status: 400 });
    }

    let lampiranUrl = null;

    const lampiranFile = findFileInBody(body, ['lampiran_sop', 'lampiran', 'file', 'lampiran_sop_file']);
    if (lampiranFile) {
      try {
        const res = await storageClient.uploadBufferWithPresign(lampiranFile, { folder: 'sop-perusahaan' });
        lampiranUrl = res.publicUrl || null;
      } catch (e) {
        return NextResponse.json({ message: 'Gagal mengunggah lampiran SOP.', detail: e?.message || String(e) }, { status: 502 });
      }
    } else if (Object.prototype.hasOwnProperty.call(body, 'lampiran_sop_url')) {
      lampiranUrl = isNullLike(body.lampiran_sop_url) ? null : String(body.lampiran_sop_url).trim();
    }

    const created = await sop.create({
      data: {
        nama_dokumen,
        tanggal_terbit,
        lampiran_sop_url: lampiranUrl,
      },
    });

    return NextResponse.json({ message: 'SOP perusahaan berhasil dibuat.', data: created }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/sop-perusahaan error:', err);
    return NextResponse.json({ message: 'Gagal membuat SOP perusahaan.' }, { status: 500 });
  }
}
