import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const normRole = (role) =>
  String(role || '')
    .trim()
    .toUpperCase();

function toDateOnly(value) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}

function toPayrollTodayDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const valueByType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Date.UTC(Number(valueByType.year), Number(valueByType.month) - 1, Number(valueByType.day)));
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
      // fallback ke session NextAuth
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

function buildPeriodeSelect() {
  return {
    id_periode_payroll: true,
    tahun: true,
    bulan: true,
    tanggal_mulai: true,
    tanggal_selesai: true,
    status_periode: true,
    catatan: true,
    id_master_template: true,
    created_at: true,
    updated_at: true,
    _count: {
      select: {
        payroll_karyawan: true,
        payoutKonsultans: true,
      },
    },
  };
}

function mapPeriode(item) {
  if (!item) return null;

  return {
    ...item,
    tanggal_mulai: toDateOnly(item.tanggal_mulai),
    tanggal_selesai: toDateOnly(item.tanggal_selesai),
    created_at: item.created_at?.toISOString?.() || item.created_at || null,
    updated_at: item.updated_at?.toISOString?.() || item.updated_at || null,
    total_payroll_karyawan: Number(item?._count?.payroll_karyawan || 0),
    total_payout_konsultan: Number(item?._count?.payoutKonsultans || 0),
  };
}

function mapPayroll(item) {
  if (!item) return null;

  const employeeName = item.nama_karyawan || item.user?.nama_pengguna || '-';
  const jobName = item.user?.jabatan?.nama_jabatan || item.user?.departement?.nama_departement || '-';

  return {
    ...item,
    nama_karyawan_snapshot: employeeName,
    nama_jabatan_snapshot: jobName,
    total_dibayarkan: Number(item.pendapatan_bersih || 0),
    total_pendapatan_bruto: Number(item.total_pendapatan_bruto || 0),
    total_potongan: Number(item.total_potongan || 0),
    pendapatan_bersih: Number(item.pendapatan_bersih || 0),
    created_at: item.created_at?.toISOString?.() || item.created_at || null,
    updated_at: item.updated_at?.toISOString?.() || item.updated_at || null,
  };
}

function mapPinjaman(item) {
  if (!item) return null;

  return {
    ...item,
    nama_karyawan: item.user?.nama_pengguna || '-',
    sisa_pinjaman: Number(item.sisa_saldo || 0),
    nominal_pinjaman: Number(item.nominal_pinjaman || 0),
    sisa_saldo: Number(item.sisa_saldo || 0),
    tanggal_mulai: toDateOnly(item.tanggal_mulai),
    tanggal_selesai: toDateOnly(item.tanggal_selesai),
  };
}

export async function GET(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const today = toPayrollTodayDate();

    const [periodeListRaw, activePeriodRaw, latestPeriodRaw, totalKaryawan, pinjamanAktif, pinjamanListRaw] = await Promise.all([
      db.periodePayroll.findMany({
        orderBy: [{ tanggal_mulai: 'desc' }, { created_at: 'desc' }],
        take: 3,
        select: buildPeriodeSelect(),
      }),
      db.periodePayroll.findFirst({
        where: {
          tanggal_mulai: { lte: today },
          tanggal_selesai: { gte: today },
        },
        orderBy: [{ tanggal_mulai: 'desc' }, { created_at: 'desc' }],
        select: buildPeriodeSelect(),
      }),
      db.periodePayroll.findFirst({
        orderBy: [{ tanggal_mulai: 'desc' }, { created_at: 'desc' }],
        select: buildPeriodeSelect(),
      }),
      db.profilPayroll.count({
        where: {
          deleted_at: null,
          payroll_aktif: true,
          user: {
            is: {
              deleted_at: null,
            },
          },
        },
      }),
      db.pinjamanKaryawan.count({
        where: {
          deleted_at: null,
          status_pinjaman: 'AKTIF',
        },
      }),
      db.pinjamanKaryawan.findMany({
        where: {
          deleted_at: null,
          status_pinjaman: 'AKTIF',
        },
        orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }],
        take: 5,
        select: {
          id_pinjaman_karyawan: true,
          id_user: true,
          nama_pinjaman: true,
          nominal_pinjaman: true,
          sisa_saldo: true,
          status_pinjaman: true,
          tanggal_mulai: true,
          tanggal_selesai: true,
          user: {
            select: {
              id_user: true,
              nama_pengguna: true,
            },
          },
        },
      }),
    ]);

    const currentPeriodRaw = activePeriodRaw || latestPeriodRaw || null;
    const currentPeriod = mapPeriode(currentPeriodRaw);
    const periodeList = periodeListRaw.map(mapPeriode).filter(Boolean);

    let payrollList = [];
    let totalPayrollKaryawan = 0;
    let totalDibayarkan = 0;
    let payrollDibayar = 0;
    let payrollDraft = 0;

    if (currentPeriodRaw?.id_periode_payroll) {
      const payrollWhere = {
        deleted_at: null,
        id_periode_payroll: currentPeriodRaw.id_periode_payroll,
      };

      const [payrollListRaw, totalPayroll, totalPaid, paidCount, draftCount] = await Promise.all([
        db.payrollKaryawan.findMany({
          where: payrollWhere,
          orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }],
          take: 5,
          select: {
            id_payroll_karyawan: true,
            id_periode_payroll: true,
            id_user: true,
            nama_karyawan: true,
            status_payroll: true,
            total_pendapatan_bruto: true,
            total_potongan: true,
            pendapatan_bersih: true,
            created_at: true,
            updated_at: true,
            user: {
              select: {
                id_user: true,
                nama_pengguna: true,
                jabatan: {
                  select: {
                    nama_jabatan: true,
                  },
                },
                departement: {
                  select: {
                    nama_departement: true,
                  },
                },
              },
            },
          },
        }),
        db.payrollKaryawan.count({ where: payrollWhere }),
        db.payrollKaryawan.aggregate({
          where: payrollWhere,
          _sum: {
            pendapatan_bersih: true,
          },
        }),
        db.payrollKaryawan.count({
          where: {
            ...payrollWhere,
            status_payroll: 'DIBAYAR',
          },
        }),
        db.payrollKaryawan.count({
          where: {
            ...payrollWhere,
            status_payroll: 'DRAFT',
          },
        }),
      ]);

      payrollList = payrollListRaw.map(mapPayroll).filter(Boolean);
      totalPayrollKaryawan = Number(totalPayroll || 0);
      totalDibayarkan = Number(totalPaid?._sum?.pendapatan_bersih || 0);
      payrollDibayar = Number(paidCount || 0);
      payrollDraft = Number(draftCount || 0);
    }

    return NextResponse.json({
      data: {
        currentPeriod,
        periodeList,
        payrollList,
        pinjamanList: pinjamanListRaw.map(mapPinjaman).filter(Boolean),
        summary: {
          totalKaryawan: Number(totalKaryawan || 0),
          totalPayrollKaryawan,
          totalDibayarkan,
          payrollDibayar,
          payrollDraft,
          pinjamanAktif: Number(pinjamanAktif || 0),
        },
      },
    });
  } catch (err) {
    console.error('GET /api/admin/payroll-dashboard error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
