import db from '@/lib/prisma';

function normalizeMatchText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildMatchTokens(value) {
  return normalizeMatchText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

export function resolveKpiMetricSource(kpiName, satuan = '') {
  const normalizedName = normalizeMatchText(kpiName);
  const normalized = normalizeMatchText(`${kpiName} ${satuan}`);
  if (!normalized) return 'activity';

  if (
    normalizedName.includes('konsultasi') ||
    normalizedName.includes('consultation') ||
    normalizedName.includes('kunjungan') ||
    normalizedName.includes('visit')
  ) {
    return 'activity';
  }

  if (
    normalized.includes('revenue') ||
    normalized.includes('sales') ||
    normalized.includes('omzet') ||
    normalized.includes('omset') ||
    normalized.includes('penjualan') ||
    normalized.includes('rupiah')
  ) {
    return 'revenue';
  }

  if (normalizedName.includes('lead') || normalizedName.includes('potensial study')) {
    return 'lead';
  }

  if (
    normalizedName.includes('student') ||
    normalizedName.includes('siswa') ||
    normalizedName.includes('english course') ||
    normalizedName.includes('english group') ||
    normalizedName.includes('english professional') ||
    normalizedName.includes('career program')
  ) {
    return 'student';
  }

  return 'activity';
}

function getActivityMatchCandidates(entry) {
  const source = String(entry?.source || '').toLowerCase();
  const primaryCandidates =
    source === 'kunjungan'
      ? [entry?.categoryName, entry?.title]
      : [entry?.projectName, entry?.title];

  return primaryCandidates.map(normalizeMatchText).filter(Boolean);
}

export function isKpiActivityMatchedByEntry(kpiName, entry) {
  const normalizedKpi = normalizeMatchText(kpiName);
  if (!normalizedKpi) return false;

  const kpiTokens = buildMatchTokens(kpiName);
  const candidates = getActivityMatchCandidates(entry);

  return candidates.some((candidate) => {
    if (candidate === normalizedKpi) return true;
    if (normalizedKpi.length >= 5 && candidate.includes(normalizedKpi)) return true;
    if (candidate.length >= 5 && normalizedKpi.includes(candidate)) return true;

    if (kpiTokens.length === 0) return false;
    const candidateTokens = new Set(buildMatchTokens(candidate));
    return kpiTokens.every((token) => candidateTokens.has(token));
  });
}

export function countFridayWeeksInYear(year) {
  const firstDay = new Date(Date.UTC(year, 0, 1));
  const firstFridayOffset = (5 - firstDay.getUTCDay() + 7) % 7;
  let cursor = new Date(Date.UTC(year, 0, 1 + firstFridayOffset));
  let count = 0;

  while (cursor.getUTCFullYear() === year) {
    count += 1;
    cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  return count || 52;
}

function toDateOnlyUTC(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function getFridayWeekRange(value = new Date()) {
  const base = toDateOnlyUTC(value);
  if (!base) {
    const fallback = toDateOnlyUTC(new Date());
    return {
      weekStart: fallback,
      weekEnd: new Date(fallback.getTime() + 6 * 24 * 60 * 60 * 1000),
    };
  }

  const diff = (base.getUTCDay() - 5 + 7) % 7;
  const weekStart = new Date(base.getTime() - diff * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  return { weekStart, weekEnd };
}

function getAgendaReferenceDate(row) {
  return row?.end_date || row?.start_date || row?.updated_at || row?.created_at || null;
}

function getKunjunganReferenceDate(row) {
  return row?.jam_checkout || row?.jam_selesai || row?.tanggal || row?.updated_at || row?.created_at || null;
}

function buildAgendaEntry(row) {
  return {
    id: row.id_agenda_kerja,
    source: 'agenda',
    projectName: row.agenda?.nama_agenda || '',
    title: row.agenda?.nama_agenda || row.deskripsi_kerja || '',
    completedAt: getAgendaReferenceDate(row),
  };
}

function buildKunjunganEntry(row) {
  return {
    id: row.id_kunjungan,
    source: 'kunjungan',
    categoryName: row.kategori?.kategori_kunjungan || '',
    title: row.kategori?.kategori_kunjungan || '',
    completedAt: getKunjunganReferenceDate(row),
  };
}

export async function syncWeeklyKpiProgressForUser(userId, referenceDate, prismaClient = db) {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) return { synced: false, reason: 'missing-user' };

  const { weekStart, weekEnd } = getFridayWeekRange(referenceDate || new Date());
  const candidateYears = Array.from(new Set([weekStart.getUTCFullYear(), weekEnd.getUTCFullYear()]));

  const plans = await prismaClient.kPIPlan.findMany({
    where: {
      id_user: normalizedUserId,
      deleted_at: null,
      tahun: { in: candidateYears },
    },
    include: {
      items: {
        where: { deleted_at: null },
        include: {
          kpi: {
            select: {
              id_kpi: true,
              nama_kpi: true,
              default_satuan: true,
            },
          },
        },
      },
    },
  });

  if (!plans.length) {
    return {
      synced: false,
      reason: 'no-plan',
      userId: normalizedUserId,
      weekStart,
      weekEnd,
    };
  }

  const [completedAgenda, completedKunjungan] = await Promise.all([
    prismaClient.agendaKerja.findMany({
      where: {
        id_user: normalizedUserId,
        deleted_at: null,
        status: 'selesai',
        OR: [
          { end_date: { gte: weekStart, lte: weekEnd } },
          { start_date: { gte: weekStart, lte: weekEnd } },
          { updated_at: { gte: weekStart, lte: weekEnd } },
        ],
      },
      include: {
        agenda: {
          select: {
            nama_agenda: true,
          },
        },
      },
    }),
    prismaClient.kunjungan.findMany({
      where: {
        id_user: normalizedUserId,
        deleted_at: null,
        status_kunjungan: 'selesai',
        OR: [
          { jam_checkout: { gte: weekStart, lte: weekEnd } },
          { jam_selesai: { gte: weekStart, lte: weekEnd } },
          { tanggal: { gte: weekStart, lte: weekEnd } },
          { updated_at: { gte: weekStart, lte: weekEnd } },
        ],
      },
      include: {
        kategori: {
          select: {
            kategori_kunjungan: true,
          },
        },
      },
    }),
  ]);

  const completedEntries = [
    ...completedAgenda.map(buildAgendaEntry),
    ...completedKunjungan.map(buildKunjunganEntry),
  ];

  const activityItems = [];
  const rowsToCreate = [];

  for (const plan of plans) {
    for (const item of plan.items || []) {
      const namaKpi = item.nama_kpi_snapshot || item.kpi?.nama_kpi || '';
      const satuan = item.satuan_snapshot || item.kpi?.default_satuan || '';
      const metricSource = resolveKpiMetricSource(namaKpi, satuan);
      if (metricSource !== 'activity') continue;

      activityItems.push(item.id_kpi_plan_item);

      const completedCount = completedEntries.filter((entry) => {
        const completedAt = toDateOnlyUTC(entry.completedAt);
        if (!completedAt) return false;
        if (completedAt.getUTCFullYear() !== plan.tahun) return false;
        return isKpiActivityMatchedByEntry(namaKpi, entry);
      }).length;

      if (completedCount <= 0) continue;

      rowsToCreate.push({
        id_kpi_plan_item: item.id_kpi_plan_item,
        tahun: plan.tahun,
        week_start: weekStart,
        week_end: weekEnd,
        completed_count: completedCount,
      });
    }
  }

  if (activityItems.length) {
    await prismaClient.kPIPlanItemWeekProgress.deleteMany({
      where: {
        id_kpi_plan_item: { in: activityItems },
        week_start: weekStart,
      },
    });
  }

  if (rowsToCreate.length) {
    await prismaClient.kPIPlanItemWeekProgress.createMany({
      data: rowsToCreate,
    });
  }

  return {
    synced: true,
    userId: normalizedUserId,
    weekStart,
    weekEnd,
    savedRows: rowsToCreate.length,
  };
}

export async function syncWeeklyKpiProgressForTargets(targets, prismaClient = db) {
  const deduped = [];
  const seen = new Set();

  for (const target of Array.isArray(targets) ? targets : []) {
    const userId = String(target?.userId || '').trim();
    if (!userId) continue;
    const { weekStart } = getFridayWeekRange(target?.referenceDate || new Date());
    const key = `${userId}:${weekStart.toISOString()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push({ userId, referenceDate: target?.referenceDate || weekStart });
  }

  const results = await Promise.allSettled(
    deduped.map((target) => syncWeeklyKpiProgressForUser(target.userId, target.referenceDate, prismaClient))
  );

  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error('Gagal sinkron KPI mingguan:', result.reason);
    }
  });

  return results;
}
