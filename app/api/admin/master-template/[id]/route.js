export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { parseRequestBody } from '@/app/api/_utils/requestBody';
import {
  deleteSupabaseByPublicUrl,
  getActor,
  getMasterTemplateDelegate,
  getTemplateFileFromBody,
  guardAdmin,
  isNullLike,
  uploadTemplateToSupabase,
} from '../_shared';

export async function GET(req, { params }) {
  const actor = await getActor(req);
  if (actor instanceof NextResponse) return actor;

  const forbidden = guardAdmin(actor.actor);
  if (forbidden) return forbidden;

  const masterTemplate = getMasterTemplateDelegate();
  if (!masterTemplate) {
    return NextResponse.json(
      { message: 'Prisma model master_template tidak ditemukan. Pastikan schema + prisma generate sudah benar.' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());

    const data = await masterTemplate.findFirst({
      where: {
        id_master_template: params.id,
        ...(!includeDeleted ? { deleted_at: null } : {}),
      },
    });

    if (!data) {
      return NextResponse.json({ message: 'Master template tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /admin/master-template/[id] error:', err);
    return NextResponse.json({ message: err?.message || 'Server error.' }, { status: err?.status || 500 });
  }
}

export async function PUT(req, { params }) {
  const actor = await getActor(req);
  if (actor instanceof NextResponse) return actor;

  const forbidden = guardAdmin(actor.actor);
  if (forbidden) return forbidden;

  const masterTemplate = getMasterTemplateDelegate();
  if (!masterTemplate) {
    return NextResponse.json(
      { message: 'Prisma model master_template tidak ditemukan. Pastikan schema + prisma generate sudah benar.' },
      { status: 500 }
    );
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
    const current = await masterTemplate.findFirst({
      where: { id_master_template: params.id },
      select: {
        id_master_template: true,
        nama_template: true,
        file_template_url: true,
        deleted_at: true,
      },
    });

    if (!current) {
      return NextResponse.json({ message: 'Master template tidak ditemukan.' }, { status: 404 });
    }

    if (current.deleted_at) {
      return NextResponse.json({ message: 'Master template sudah dihapus.' }, { status: 400 });
    }

    const updateData = {};

    if (Object.prototype.hasOwnProperty.call(body, 'nama_template')) {
      const nama_template = typeof body.nama_template === 'string' ? body.nama_template.trim() : '';
      if (!nama_template) {
        return NextResponse.json({ message: 'nama_template tidak boleh kosong.' }, { status: 400 });
      }
      updateData.nama_template = nama_template;
    }

    const file = getTemplateFileFromBody(body);
    if (file) {
      uploaded = await uploadTemplateToSupabase(file, {
        prefix: 'master-template',
        filenameBase: updateData.nama_template || current.nama_template,
      });
      updateData.file_template_url = uploaded.publicUrl;
    } else if (Object.prototype.hasOwnProperty.call(body, 'file_template_url')) {
      const file_template_url = isNullLike(body.file_template_url) ? null : String(body.file_template_url).trim();
      if (!file_template_url) {
        return NextResponse.json({ message: 'file_template_url tidak boleh kosong.' }, { status: 400 });
      }
      updateData.file_template_url = file_template_url;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'Tidak ada field yang diupdate.' }, { status: 400 });
    }

    const updated = await masterTemplate.update({
      where: { id_master_template: params.id },
      data: updateData,
    });

    if (
      Object.prototype.hasOwnProperty.call(updateData, 'file_template_url') &&
      current.file_template_url &&
      current.file_template_url !== updated.file_template_url
    ) {
      try {
        await deleteSupabaseByPublicUrl(current.file_template_url);
      } catch (cleanupErr) {
        console.warn('Cleanup file lama PUT master-template gagal:', cleanupErr);
      }
    }

    return NextResponse.json({ message: 'Master template berhasil diupdate.', data: updated });
  } catch (err) {
    if (uploaded?.publicUrl) {
      try {
        await deleteSupabaseByPublicUrl(uploaded.publicUrl);
      } catch (cleanupErr) {
        console.warn('Cleanup upload PUT master-template gagal:', cleanupErr);
      }
    }

    console.error('PUT /admin/master-template/[id] error:', err);
    return NextResponse.json({ message: err?.message || 'Server error.' }, { status: err?.status || 500 });
  }
}

export async function DELETE(req, { params }) {
  const actor = await getActor(req);
  if (actor instanceof NextResponse) return actor;

  const forbidden = guardAdmin(actor.actor);
  if (forbidden) return forbidden;

  const masterTemplate = getMasterTemplateDelegate();
  if (!masterTemplate) {
    return NextResponse.json(
      { message: 'Prisma model master_template tidak ditemukan. Pastikan schema + prisma generate sudah benar.' },
      { status: 500 }
    );
  }

  try {
    const current = await masterTemplate.findFirst({
      where: { id_master_template: params.id },
      select: { id_master_template: true, deleted_at: true },
    });

    if (!current) {
      return NextResponse.json({ message: 'Master template tidak ditemukan.' }, { status: 404 });
    }

    if (current.deleted_at) {
      return NextResponse.json({ message: 'Master template sudah dihapus.' }, { status: 400 });
    }

    const deleted = await masterTemplate.update({
      where: { id_master_template: params.id },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ message: 'Master template dihapus (soft delete).', data: deleted });
  } catch (err) {
    console.error('DELETE /admin/master-template/[id] error:', err);
    return NextResponse.json({ message: err?.message || 'Server error.' }, { status: err?.status || 500 });
  }
}
