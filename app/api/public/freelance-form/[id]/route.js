import { NextResponse } from 'next/server';
import db from '@/lib/prisma';

function normalizeDateInput(value) {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const parsed = new Date(`${raw}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function deriveWorkdayStatus(todoItems = []) {
  const total = normalizeTodoItems(todoItems).length;
  return total >= 3 ? 'FULL_DAY' : 'HALF_DAY';
}

function serializeForm(record) {
  const todoItems = normalizeTodoItems(record?.todo_list);

  return {
    id_form_freelance: record?.id_form_freelance,
    id_freelance: record?.id_freelance,
    tanggal_kerja: formatDateOnly(record?.tanggal_kerja),
    status_hari_kerja: record?.status_hari_kerja,
    todo_list: record?.todo_list,
    todo_items: todoItems,
    decision: record?.decision || 'pending',
    note: record?.note || null,
    decided_at: record?.decided_at || null,
    approver: record?.approver || null,
    created_at: record?.created_at,
    updated_at: record?.updated_at,
  };
}

async function findActiveFreelance(id_freelance) {
  return db.freelance.findFirst({
    where: {
      id_freelance,
      deleted_at: null,
    },
    select: {
      id_freelance: true,
      nama: true,
      email: true,
      kontak: true,
      alamat: true,
    },
  });
}

export async function GET(_req, { params }) {
  try {
    const freelance = await findActiveFreelance(params.id);

    if (!freelance) {
      return NextResponse.json({ message: 'Freelance tidak ditemukan.' }, { status: 404 });
    }

    const submissions = await db.formFreelance.findMany({
      where: {
        id_freelance: params.id,
        deleted_at: null,
      },
      orderBy: [
        { tanggal_kerja: 'desc' },
        { updated_at: 'desc' },
      ],
      take: 30,
      select: {
        id_form_freelance: true,
        id_freelance: true,
        tanggal_kerja: true,
        status_hari_kerja: true,
        todo_list: true,
        decision: true,
        note: true,
        decided_at: true,
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
    });

    return NextResponse.json({
      data: {
        freelance,
        submissions: submissions.map(serializeForm),
      },
    });
  } catch (error) {
    console.error('GET /api/public/freelance-form/[id] error:', error);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const freelance = await findActiveFreelance(params.id);

    if (!freelance) {
      return NextResponse.json({ message: 'Freelance tidak ditemukan.' }, { status: 404 });
    }

    const body = await req.json();
    const tanggal_kerja = normalizeDateInput(body?.tanggal_kerja);
    const todoItems = normalizeTodoItems(body?.todo_list);
    const status_hari_kerja = deriveWorkdayStatus(todoItems);

    if (!tanggal_kerja) {
      return NextResponse.json({ message: 'Tanggal kerja wajib diisi.' }, { status: 400 });
    }

    if (!todoItems.length) {
      return NextResponse.json({ message: 'Todo list wajib diisi minimal 1 item.' }, { status: 400 });
    }

    const serializedTodoList = JSON.stringify(todoItems);
    const requestedId = String(body?.id_form_freelance || '').trim();

    let existing = null;

    if (requestedId) {
      existing = await db.formFreelance.findFirst({
        where: {
          id_form_freelance: requestedId,
          id_freelance: params.id,
          deleted_at: null,
        },
        select: { id_form_freelance: true },
      });
    }

    if (!existing) {
      existing = await db.formFreelance.findFirst({
        where: {
          id_freelance: params.id,
          tanggal_kerja,
          deleted_at: null,
        },
        select: { id_form_freelance: true },
      });
    }

    const payload = {
      tanggal_kerja,
      status_hari_kerja,
      todo_list: serializedTodoList,
      decision: 'pending',
      note: null,
      decided_at: null,
      approver_user_id: null,
      approver_role: null,
    };

    const record = existing
      ? await db.formFreelance.update({
          where: { id_form_freelance: existing.id_form_freelance },
          data: payload,
          select: {
            id_form_freelance: true,
            id_freelance: true,
            tanggal_kerja: true,
            status_hari_kerja: true,
            todo_list: true,
            decision: true,
            note: true,
            decided_at: true,
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
        })
      : await db.formFreelance.create({
          data: {
            id_freelance: params.id,
            ...payload,
          },
          select: {
            id_form_freelance: true,
            id_freelance: true,
            tanggal_kerja: true,
            status_hari_kerja: true,
            todo_list: true,
            decision: true,
            note: true,
            decided_at: true,
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
        });

    return NextResponse.json({
      message: existing ? 'Form freelance berhasil diperbarui.' : 'Form freelance berhasil dikirim.',
      action: existing ? 'updated' : 'created',
      data: serializeForm(record),
    });
  } catch (error) {
    console.error('POST /api/public/freelance-form/[id] error:', error);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
