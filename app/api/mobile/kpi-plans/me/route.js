export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';
import db from '@/lib/prisma';
import {
  buildPlanInclude,
  isKpiStorageUnavailableError,
  serializePlan,
} from '@/app/api/admin/kpi-plans/_utils';

async function ensureAuth(req) {
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    try {
      const payload = verifyAuthToken(auth.slice(7).trim());
      const id = payload?.sub || payload?.id_user || payload?.userId;
      return { actor: { id, role: payload?.role, source: 'bearer' } };
    } catch {
      // Fallback ke session web bila route diakses dari browser internal.
    }
  }

  const sessionOrRes = await authenticateRequest();
  if (sessionOrRes instanceof NextResponse) return sessionOrRes;

  return {
    actor: {
      id: sessionOrRes?.user?.id || sessionOrRes?.user?.id_user,
      role: sessionOrRes?.user?.role,
      source: 'session',
    },
  };
}

function parseYearParam(value) {
  const year = parseInt(String(value || '').trim(), 10);
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null;
}

export async function GET(req) {
  const authRes = await ensureAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  const userId = String(authRes?.actor?.id || '').trim();
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestedYear = parseYearParam(searchParams.get('tahun'));
  const currentYear = new Date().getFullYear();
  const baseWhere = {
    id_user: userId,
    deleted_at: null,
  };

  try {
    const yearRows = await db.kPIPlan.findMany({
      where: baseWhere,
      select: {
        tahun: true,
      },
      orderBy: [
        { tahun: 'desc' },
        { updated_at: 'desc' },
      ],
    });

    const availableYears = [...new Set(
      yearRows
        .map((row) => row?.tahun)
        .filter((year) => Number.isInteger(year))
    )];

    const resolvedYear =
      requestedYear ??
      (availableYears.includes(currentYear) ? currentYear : (availableYears[0] ?? null));

    if (!resolvedYear) {
      return NextResponse.json({
        data: null,
        availableYears: [],
        requestedYear,
        resolvedYear: null,
        message: 'KPI belum tersedia untuk user ini.',
      });
    }

    const plan = await db.kPIPlan.findFirst({
      where: {
        ...baseWhere,
        tahun: resolvedYear,
      },
      include: buildPlanInclude(),
      orderBy: {
        updated_at: 'desc',
      },
    });

    return NextResponse.json({
      data: serializePlan(plan),
      availableYears,
      requestedYear,
      resolvedYear,
      message: plan ? 'KPI berhasil dimuat.' : 'KPI belum tersedia untuk tahun yang dipilih.',
    });
  } catch (error) {
    console.error('GET /api/mobile/kpi-plans/me error:', error);
    if (isKpiStorageUnavailableError(error)) {
      return NextResponse.json({
        data: null,
        availableYears: [],
        requestedYear,
        resolvedYear: null,
        message: 'Tabel KPI belum tersedia di database. Jalankan migration Prisma terlebih dahulu.',
      }, { status: 503 });
    }
    return NextResponse.json({ message: 'Gagal memuat KPI user.' }, { status: 500 });
  }
}
