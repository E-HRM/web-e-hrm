export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { parseRequestBody } from '@/app/api/_utils/requestBody';
import { ALLOWED_ORDER_BY, deleteSupabaseByPublicUrl, getActor, getMasterTemplateDelegate, getTemplateFileFromBody, guardAdmin, isNullLike, uploadTemplateToSupabase } from './_shared';

export async function GET(req) {
  const actor = await getActor(req);
  if (actor instanceof NextResponse) return actor;

  const forbidden = guardAdmin(actor.actor);
  if (forbidden) return forbidden;

  const masterTemplate = getMasterTemplateDelegate();
  if (!masterTemplate) {
    return NextResponse.json({ message: 'Prisma model master_template tidak ditemukan. Pastikan schema + prisma generate sudah benar.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();
    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());
    const deletedOnly = ['1', 'true'].includes((searchParams.get('deletedOnly') || '').toLowerCase());
    const orderByParam = (searchParams.get('orderBy') || 'created_at').trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam) ? orderByParam : 'created_at';
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const all = ['1', 'true'].includes((searchParams.get('all') || '').toLowerCase());
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1), 100);

    const where = {
      ...(deletedOnly ? { deleted_at: { not: null } } : {}),
      ...(!includeDeleted && !deletedOnly ? { deleted_at: null } : {}),
      ...(search
        ? {
            OR: [{ nama_template: { contains: search, mode: 'insensitive' } }, { file_template_url: { contains: search, mode: 'insensitive' } }],
          }
        : {}),
    };

    if (all) {
      const items = await masterTemplate.findMany({
        where,
        orderBy: { [orderBy]: sort },
      });

      return NextResponse.json({ total: items.length, items });
    }

    const skip = (page - 1) * pageSize;
    const [total, items] = await db.$transaction([
      masterTemplate.count({ where }),
      masterTemplate.findMany({
        where,
        orderBy: { [orderBy]: sort },
        skip,
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
    console.error('GET /admin/master template error:', err);
    return NextResponse.json({ message: err?.message || 'Server error.' }, { status: err?.status || 500 });
  }
}

export async function POST(req) {
  const actor = await getActor(req);
  if (actor instanceof NextResponse) return actor;

  const forbidden = guardAdmin(actor.actor);
  if (forbidden) return forbidden;

  const masterTemplate = getMasterTemplateDelegate();
  if (!masterTemplate) {
    return NextResponse.json({ message: 'Prisma model master_template tidak ditemukan. Pastikan schema + prisma generate sudah benar.' }, { status: 500 });
  }

  let parsed;
  try {
    parsed = await parseRequestBody(req);
  } catch (err) {
    return NextResponse.json({ message: err?.message || 'Body tidak valid.' }, { status: err?.status || 400 });
  }

  const body = parsed.body || {};
  let uploaded = null;

  try {
    const nama_template = typeof body.nama_template === 'string' ? body.nama_template.trim() : '';
    if (!nama_template) {
      return NextResponse.json({ message: 'nama template wajib diisi.' }, { status: 400 });
    }

    const file = getTemplateFileFromBody(body);
    let file_template_url = null;

    if (file) {
      uploaded = await uploadTemplateToSupabase(file, {
        prefix: 'master-template',
        filenameBase: nama_template,
      });
      file_template_url = uploaded.publicUrl;
    } else if (Object.prototype.hasOwnProperty.call(body, 'file_template_url')) {
      file_template_url = isNullLike(body.file_template_url) ? null : String(body.file_template_url).trim();
    }

    if (!file_template_url) {
      return NextResponse.json({ message: 'file template wajib diisi atau upload file ke Supabase.' }, { status: 400 });
    }

    const created = await masterTemplate.create({
      data: {
        nama_template,
        file_template_url,
      },
    });

    return NextResponse.json({ message: 'Master template berhasil dibuat.', data: created }, { status: 201 });
  } catch (err) {
    if (uploaded?.publicUrl) {
      try {
        await deleteSupabaseByPublicUrl(uploaded.publicUrl);
      } catch (cleanupErr) {
        console.warn('Cleanup upload POST master-template gagal:', cleanupErr);
      }
    }

    console.error('POST /admin/master-template error:', err);
    return NextResponse.json({ message: err?.message || 'Server error.' }, { status: err?.status || 500 });
  }
}
