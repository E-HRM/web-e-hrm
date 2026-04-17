import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { countFridayWeeksInYear, getFridayWeekRange } from '@/lib/kpi-weekly-progress';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

const ALLOWED_ROLES = new Set(['HR', 'DIREKTUR', 'OPERASIONAL', 'SUPERADMIN']);
const ALLOWED_STATUSES = new Set(['draft', 'active', 'locked', 'archived']);

export const FORM_TO_DB_TERM = {
  term1: 'term_1',
  term2: 'term_2',
  term3: 'term_3',
  term4: 'term_4',
};

const DB_TO_FORM_TERM = {
  term_1: 'term1',
  term_2: 'term2',
  term_3: 'term3',
  term_4: 'term4',
};

function normalizeRole(role) {
  return String(role || '').trim().toUpperCase();
}

function parseNumber(value) {
  const safe = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(safe) ? safe : 0;
}

function parseOptionalString(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

async function readJsonBody(request) {
  const raw = await request.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Body request harus berupa JSON yang valid.');
  }
}

export async function getAdminActor(request) {
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    try {
      const payload = verifyAuthToken(auth.slice(7));
      const role = normalizeRole(payload?.role);
      if (!ALLOWED_ROLES.has(role)) {
        return NextResponse.json({ message: 'Forbidden: tidak memiliki akses.' }, { status: 403 });
      }
      return { id: payload?.sub || payload?.id_user || payload?.userId || null, role, source: 'bearer' };
    } catch (_) {}
  }

  const sessionOrResponse = await authenticateRequest();
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;

  const role = normalizeRole(sessionOrResponse?.user?.role);
  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ message: 'Forbidden: tidak memiliki akses.' }, { status: 403 });
  }

  return { id: sessionOrResponse.user.id, role, source: 'session' };
}

export function isKpiStorageUnavailableError(error) {
  const code = String(error?.code || '').trim();
  const message = String(error?.message || '').toLowerCase();

  if (code === 'P2021' || code === 'P2022') {
    return true;
  }

  return (
    message.includes('table') && message.includes('does not exist')
  ) || message.includes('unknown column');
}

export async function parsePlanPayload(request) {
  const body = await readJsonBody(request);

  const userId = String(body?.userId || '').trim();
  const tahun = parseInt(String(body?.tahun || '').trim(), 10);
  const status = String(body?.status || 'draft').trim().toLowerCase();
  const itemsInput = Array.isArray(body?.items) ? body.items : [];

  if (!userId) {
    throw new Error('Field userId wajib diisi.');
  }
  if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) {
    throw new Error('Field tahun harus berupa angka yang valid.');
  }
  if (!ALLOWED_STATUSES.has(status)) {
    throw new Error('Field status tidak valid.');
  }
  if (itemsInput.length === 0) {
    throw new Error('Minimal harus ada 1 item KPI.');
  }

  const items = itemsInput.map((row, index) => {
    const namaKpi = String(row?.namaKpi || '').trim();
    if (!namaKpi) {
      throw new Error(`Nama KPI pada baris ${index + 1} wajib diisi.`);
    }

    return {
      index,
      kpiId: parseOptionalString(row?.kpiId),
      namaKpi,
      satuan: parseOptionalString(row?.satuan),
      targetTahunan: parseNumber(row?.targetTahunan),
      term1: parseNumber(row?.term1),
      term2: parseNumber(row?.term2),
      term3: parseNumber(row?.term3),
      term4: parseNumber(row?.term4),
    };
  });

  return {
    userId,
    tahun,
    status,
    items,
  };
}

export async function getPlanUserSnapshot(userId) {
  const user = await db.user.findFirst({
    where: {
      id_user: userId,
      deleted_at: null,
    },
    select: {
      id_user: true,
      nama_pengguna: true,
      id_jabatan: true,
      id_location: true,
      jabatan: {
        select: {
          id_jabatan: true,
          nama_jabatan: true,
        },
      },
      kantor: {
        select: {
          id_location: true,
          nama_kantor: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('Karyawan tidak ditemukan.');
  }
  if (!user.id_jabatan) {
    throw new Error('Karyawan belum memiliki jabatan, KPI tidak bisa disimpan.');
  }

  return {
    userId: user.id_user,
    namaKaryawan: user.nama_pengguna || '-',
    jabatanId: user.id_jabatan,
    jabatanNama: user.jabatan?.nama_jabatan || '-',
    locationId: user.id_location || null,
    locationNama: user.kantor?.nama_kantor || '-',
  };
}

export function buildPlanInclude() {
  return {
    user: {
      select: {
        id_user: true,
        nama_pengguna: true,
      },
    },
    jabatan: {
      select: {
        id_jabatan: true,
        nama_jabatan: true,
      },
    },
    kantor: {
      select: {
        id_location: true,
        nama_kantor: true,
      },
    },
    items: {
      where: {
        deleted_at: null,
      },
      orderBy: {
        urutan: 'asc',
      },
      include: {
        kpi: {
          select: {
            id_kpi: true,
            nama_kpi: true,
            default_satuan: true,
          },
        },
        terms: {
          where: {
            deleted_at: null,
          },
          orderBy: {
            term: 'asc',
          },
        },
        weekly_progresses: {
          orderBy: {
            week_start: 'desc',
          },
          take: 8,
        },
      },
    },
    _count: {
      select: {
        items: true,
      },
    },
  };
}

export function serializePlan(plan) {
  if (!plan) return null;

  const currentYear = new Date().getUTCFullYear();
  const currentWeek = getFridayWeekRange(new Date());
  const latestPlanWeek = (plan.items || [])
    .flatMap((item) => item.weekly_progresses || [])
    .sort((left, right) => new Date(right.week_start) - new Date(left.week_start))[0] || null;
  const monitorWeek =
    plan.tahun === currentYear
      ? currentWeek
      : latestPlanWeek
        ? {
            weekStart: latestPlanWeek.week_start,
            weekEnd: latestPlanWeek.week_end,
          }
        : null;
  const monitorWeekStartIso = monitorWeek?.weekStart ? new Date(monitorWeek.weekStart).toISOString() : null;
  const weeksInYear = countFridayWeeksInYear(plan.tahun);

  const items = (plan.items || []).map((item, index) => {
    const terms = Object.fromEntries(
      (item.terms || []).map((termRow) => [DB_TO_FORM_TERM[termRow.term] || termRow.term, parseNumber(termRow.achievement)])
    );
    const targetTahunan = parseNumber(item.target_tahunan);
    const weeklyTarget = targetTahunan > 0 ? Math.ceil(targetTahunan / weeksInYear) : 0;
    const weeklyProgress = (item.weekly_progresses || []).map((progressRow) => ({
      id: progressRow.id_kpi_plan_item_week_progress,
      tahun: progressRow.tahun,
      weekStart: progressRow.week_start,
      weekEnd: progressRow.week_end,
      completedCount: progressRow.completed_count || 0,
      updatedAt: progressRow.updated_at,
    }));
    const monitorProgress = monitorWeekStartIso
      ? weeklyProgress.find((progressRow) => {
          try {
            return new Date(progressRow.weekStart).toISOString() === monitorWeekStartIso;
          } catch {
            return false;
          }
        })
      : null;

    return {
      id: item.id_kpi_plan_item,
      kpiId: item.id_kpi,
      nomor: index + 1,
      namaKpi: item.nama_kpi_snapshot || item.kpi?.nama_kpi || '',
      satuan: item.satuan_snapshot || item.kpi?.default_satuan || '',
      targetTahunan,
      weeklyTarget,
      term1: terms.term1 || 0,
      term2: terms.term2 || 0,
      term3: terms.term3 || 0,
      term4: terms.term4 || 0,
      monitorWeekCompleted: monitorProgress?.completedCount || 0,
      recentWeeklyProgress: weeklyProgress,
    };
  });

  const totalCompletedThisWeek = items.reduce(
    (sum, item) => sum + Number(item.monitorWeekCompleted || 0),
    0,
  );
  const matchedKpiThisWeek = items.filter((item) => Number(item.monitorWeekCompleted || 0) > 0).length;

  return {
    id: plan.id_kpi_plan,
    userId: plan.id_user,
    tahun: plan.tahun,
    status: plan.status,
    namaKaryawan: plan.nama_user_snapshot || plan.user?.nama_pengguna || '-',
    namaJabatan: plan.jabatan_snapshot || plan.jabatan?.nama_jabatan || '-',
    namaLokasi: plan.location_snapshot || plan.kantor?.nama_kantor || '-',
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
    totalItems: plan._count?.items ?? plan.items?.length ?? 0,
    monitorWeekStart: monitorWeek?.weekStart || null,
    monitorWeekEnd: monitorWeek?.weekEnd || null,
    totalCompletedThisWeek,
    matchedKpiThisWeek,
    items,
  };
}

export async function replacePlanItems(tx, planId, items) {
  await tx.kPIPlanItem.deleteMany({
    where: {
      id_kpi_plan: planId,
    },
  });

  for (const item of items) {
    let kpiId = item.kpiId;

    if (kpiId) {
      await tx.kPI.update({
        where: { id_kpi: kpiId },
        data: {
          nama_kpi: item.namaKpi,
          default_satuan: item.satuan,
        },
      });
    } else {
      const createdKpi = await tx.kPI.create({
        data: {
          nama_kpi: item.namaKpi,
          default_satuan: item.satuan,
          value_type: 'number',
        },
      });
      kpiId = createdKpi.id_kpi;
    }

    const createdItem = await tx.kPIPlanItem.create({
      data: {
        id_kpi_plan: planId,
        id_kpi: kpiId,
        urutan: item.index,
        nama_kpi_snapshot: item.namaKpi,
        satuan_snapshot: item.satuan,
        target_tahunan: String(item.targetTahunan),
      },
      select: {
        id_kpi_plan_item: true,
      },
    });

    await tx.kPIPlanItemTerm.createMany({
      data: Object.entries(FORM_TO_DB_TERM).map(([formKey, dbTerm]) => ({
        id_kpi_plan_item: createdItem.id_kpi_plan_item,
        term: dbTerm,
        achievement: String(item[formKey] ?? 0),
      })),
    });
  }
}
