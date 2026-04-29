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

async function validateSupervisor(id_supervisor) {
  if (isNullLike(id_supervisor)) return null;
  const id = String(id_supervisor).trim();
  const supervisor = await db.user.findFirst({
    where: { id_user: id, deleted_at: null },
    select: { id_user: true },
  });
  return supervisor ? id : false;
}

const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'nama', 'email']);

export async function GET(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!canRead(auth.actor)) return forbiddenRead();

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1), 100);
    const search = String(searchParams.get('search') || '').trim();
    const includeDeleted = ['1', 'true'].includes(String(searchParams.get('includeDeleted') || '').toLowerCase());
    const orderByParam = String(searchParams.get('orderBy') || 'created_at').trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam) ? orderByParam : 'created_at';
    const sort = String(searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where = {
      ...(includeDeleted ? {} : { deleted_at: null }),
      ...(search
        ? {
            OR: [
              { nama: { contains: search } },
              { email: { contains: search } },
              { kontak: { contains: search } },
              { alamat: { contains: search } },
              { jenis_bank: { contains: search } },
              { nomor_rekening: { contains: search } },
              { nama_pemilik_rekening: { contains: search } },
              {
                supervisor: {
                  is: {
                    nama_pengguna: { contains: search },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      db.freelance.count({ where }),
      db.freelance.findMany({
        where,
        orderBy: { [orderBy]: sort },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id_freelance: true,
          nama: true,
          alamat: true,
          kontak: true,
          email: true,
          jenis_bank: true,
          nomor_rekening: true,
          nama_pemilik_rekening: true,
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
      }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/admin/freelance error:', error);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;
  if (!canManage(auth.actor)) return forbiddenManage();

  try {
    const body = await req.json();
    const nama = String(body?.nama || '').trim();
    const alamat = isNullLike(body?.alamat) ? null : String(body.alamat).trim();
    const kontak = isNullLike(body?.kontak) ? null : String(body.kontak).trim();
    const email = isNullLike(body?.email) ? null : String(body.email).trim();
    const jenisBank = isNullLike(body?.jenis_bank) ? null : String(body.jenis_bank).trim();
    const nomorRekening = isNullLike(body?.nomor_rekening) ? null : String(body.nomor_rekening).trim();
    const namaPemilikRekening = isNullLike(body?.nama_pemilik_rekening) ? null : String(body.nama_pemilik_rekening).trim();
    const supervisorId = await validateSupervisor(body?.id_supervisor);

    if (!nama) {
      return NextResponse.json({ message: "Field 'nama' wajib diisi." }, { status: 400 });
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json({ message: "Field 'email' tidak valid." }, { status: 400 });
    }

    if (supervisorId === false) {
      return NextResponse.json({ message: "Field 'id_supervisor' tidak valid." }, { status: 400 });
    }

    const created = await db.freelance.create({
      data: {
        nama,
        alamat,
        kontak,
        email,
        jenis_bank: jenisBank,
        nomor_rekening: nomorRekening,
        nama_pemilik_rekening: namaPemilikRekening,
        id_supervisor: supervisorId,
      },
      select: {
        id_freelance: true,
        nama: true,
        alamat: true,
        kontak: true,
        email: true,
        jenis_bank: true,
        nomor_rekening: true,
        nama_pemilik_rekening: true,
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

    return NextResponse.json({ message: 'Freelance berhasil dibuat.', data: created }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/freelance error:', error);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
