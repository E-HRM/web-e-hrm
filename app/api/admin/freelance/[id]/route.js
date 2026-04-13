import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

async function ensureAuth(req) {
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    try {
      const payload = verifyAuthToken(auth.slice(7));
      return {
        actor: {
          id: payload?.sub || payload?.id_user || payload?.userId,
          role: payload?.role,
          source: 'bearer',
        },
      };
    } catch (_) {}
  }

  const sessionOrRes = await authenticateRequest();
  if (sessionOrRes instanceof NextResponse) return sessionOrRes;

  return {
    actor: {
      id: sessionOrRes.user.id,
      role: sessionOrRes.user.role,
      source: 'session',
    },
  };
}

function normalizeRole(role) {
  return String(role || '').trim().toUpperCase();
}

function canRead(actor) {
  return ['HR', 'DIREKTUR', 'OPERASIONAL', 'SUPERADMIN'].includes(normalizeRole(actor?.role));
}

function canManage(actor) {
  return ['HR', 'OPERASIONAL', 'SUPERADMIN'].includes(normalizeRole(actor?.role));
}

function forbiddenRead() {
  return NextResponse.json({ message: 'Forbidden: tidak memiliki akses melihat data freelance.' }, { status: 403 });
}

function forbiddenManage() {
  return NextResponse.json({ message: 'Forbidden: tidak memiliki akses mengelola data freelance.' }, { status: 403 });
}

function isNullLike(value) {
  if (value == null) return true;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return !normalized || normalized === 'null' || normalized === 'undefined';
  }
  return false;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function normalizeTodoItems(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || '').trim()).filter(Boolean);
      }
    } catch (_) {}

    return trimmed
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function serializeForm(record) {
  const todoItems = normalizeTodoItems(record?.todo_list);

  return {
    id_form_freelance: record?.id_form_freelance,
    id_freelance: record?.id_freelance,
    tanggal_kerja: record?.tanggal_kerja,
    status_hari_kerja: record?.status_hari_kerja,
    todo_list: record?.todo_list,
    todo_items: todoItems,
    decision: record?.decision || 'pending',
    note: record?.note || null,
    decided_at: record?.decided_at || null,
    created_at: record?.created_at,
    updated_at: record?.updated_at,
    approver_user_id: record?.approver_user_id || null,
    approver_role: record?.approver_role || null,
    approver: record?.approver || null,
  };
}

async function validateSupervisor(id_supervisor) {
  if (isNullLike(id_supervisor)) return null;
  const id = String(id_supervisor).trim();
  const supervisor = await db.user.findFirst({
    where: { id_user: id, deleted_at: null },
    select: { id_user: true },
  });
  return supervisor ? id : false;
}

export async function GET(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!canRead(auth.actor)) return forbiddenRead();

  try {
    const data = await db.freelance.findUnique({
      where: { id_freelance: params.id },
      select: {
        id_freelance: true,
        nama: true,
        alamat: true,
        kontak: true,
        email: true,
        id_supervisor: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        supervisor: {
          select: {
            id_user: true,
            nama_pengguna: true,
            email: true,
          },
        },
        form_freelance: {
          where: { deleted_at: null },
          orderBy: [
            { tanggal_kerja: 'desc' },
            { updated_at: 'desc' },
          ],
          select: {
            id_form_freelance: true,
            id_freelance: true,
            tanggal_kerja: true,
            status_hari_kerja: true,
            todo_list: true,
            decision: true,
            note: true,
            decided_at: true,
            approver_user_id: true,
            approver_role: true,
            created_at: true,
            updated_at: true,
            approver: {
              select: {
                id_user: true,
                nama_pengguna: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!data) {
      return NextResponse.json({ message: 'Freelance tidak ditemukan.' }, { status: 404 });
    }

    const forms = Array.isArray(data.form_freelance) ? data.form_freelance.map(serializeForm) : [];
    const summary = forms.reduce(
      (acc, item) => {
        acc.total_forms += 1;
        if (item.status_hari_kerja === 'FULL_DAY') acc.full_day += 1;
        if (item.status_hari_kerja === 'HALF_DAY') acc.half_day += 1;

        const decision = String(item.decision || 'pending').toLowerCase();
        if (decision === 'disetujui') acc.disetujui += 1;
        else if (decision === 'ditolak') acc.ditolak += 1;
        else acc.pending += 1;

        return acc;
      },
      {
        total_forms: 0,
        full_day: 0,
        half_day: 0,
        pending: 0,
        disetujui: 0,
        ditolak: 0,
      }
    );

    return NextResponse.json({
      data: {
        ...data,
        form_freelance: forms,
        summary,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/freelance/[id] error:', error);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!canManage(auth.actor)) return forbiddenManage();

  try {
    const body = await req.json();
    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'nama')) {
      const nama = String(body?.nama || '').trim();
      if (!nama) {
        return NextResponse.json({ message: "Field 'nama' wajib diisi." }, { status: 400 });
      }
      payload.nama = nama;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'alamat')) {
      payload.alamat = isNullLike(body?.alamat) ? null : String(body.alamat).trim();
    }

    if (Object.prototype.hasOwnProperty.call(body, 'kontak')) {
      payload.kontak = isNullLike(body?.kontak) ? null : String(body.kontak).trim();
    }

    if (Object.prototype.hasOwnProperty.call(body, 'email')) {
      const email = isNullLike(body?.email) ? null : String(body.email).trim();
      if (email && !isValidEmail(email)) {
        return NextResponse.json({ message: "Field 'email' tidak valid." }, { status: 400 });
      }
      payload.email = email;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'id_supervisor')) {
      const supervisorId = await validateSupervisor(body?.id_supervisor);
      if (supervisorId === false) {
        return NextResponse.json({ message: "Field 'id_supervisor' tidak valid." }, { status: 400 });
      }
      payload.id_supervisor = supervisorId;
    }

    if (!Object.keys(payload).length) {
      return NextResponse.json({ message: 'Tidak ada perubahan yang diberikan.' }, { status: 400 });
    }

    const updated = await db.freelance.update({
      where: { id_freelance: params.id },
      data: payload,
      select: {
        id_freelance: true,
        nama: true,
        alamat: true,
        kontak: true,
        email: true,
        id_supervisor: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        supervisor: {
          select: {
            id_user: true,
            nama_pengguna: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ message: 'Freelance berhasil diperbarui.', data: updated });
  } catch (error) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ message: 'Freelance tidak ditemukan.' }, { status: 404 });
    }
    console.error('PUT /api/admin/freelance/[id] error:', error);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!canManage(auth.actor)) return forbiddenManage();

  try {
    const { searchParams } = new URL(req.url);
    const hardDelete = String(searchParams.get('hard') || '').toLowerCase() === 'true';

    if (hardDelete) {
      await db.freelance.delete({ where: { id_freelance: params.id } });
      return NextResponse.json({ message: 'Freelance dihapus permanen.' });
    }

    await db.freelance.update({
      where: { id_freelance: params.id },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ message: 'Freelance dihapus.' });
  } catch (error) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ message: 'Freelance tidak ditemukan.' }, { status: 404 });
    }
    console.error('DELETE /api/admin/freelance/[id] error:', error);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
