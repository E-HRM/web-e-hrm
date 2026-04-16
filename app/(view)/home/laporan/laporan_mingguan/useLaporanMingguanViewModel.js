"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import { ApiEndpoints } from "@/constrainst/endpoints";
import { fetcher } from "@/app/utils/fetcher";

const EMPTY = Object.freeze([]);
const OVER_BREAK_THRESHOLD_SECONDS = 60 * 60;
const LEADS_BY_CONSULTANT_API_URL =
  process.env.NEXT_PUBLIC_REPORT_LEADS_BY_CONSULTANT_API_URL ||
  "https://onestepsolutionbali.com/api/leads_by_consultant";
const LEADS_BY_CONSULTANT_API_KEY =
  process.env.NEXT_PUBLIC_REPORT_LEADS_BY_CONSULTANT_API_KEY || "";
const RAW_STUDENT_BY_CONSULTANT_URL =
  process.env.NEXT_PUBLIC_REPORT_STUDENT_BY_CONSULTANT_API_URL || "";
const STUDENT_BY_CONSULTANT_API_URL =
  /^https?:\/\//i.test(RAW_STUDENT_BY_CONSULTANT_URL)
    ? RAW_STUDENT_BY_CONSULTANT_URL
    : "https://oss-english.onestepsolutionbali.com/api/report/student-report-by-consultant";
const STUDENT_BY_CONSULTANT_API_KEY =
  process.env.NEXT_PUBLIC_REPORT_STUDENT_BY_CONSULTANT_API_KEY ||
  (!/^https?:\/\//i.test(RAW_STUDENT_BY_CONSULTANT_URL)
    ? RAW_STUDENT_BY_CONSULTANT_URL
    : "");

function getWeekStartFriday(value = dayjs()) {
  const base = dayjs(value).startOf("day");
  const diff = (base.day() - 5 + 7) % 7;
  return base.subtract(diff, "day");
}

const DEFAULT_WEEK_START = getWeekStartFriday().format("YYYY-MM-DD");

function formatDateLabel(value, options) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", options).format(date);
}

function formatDateKey(value) {
  if (!value) return "";
  const str = String(value).trim();
  const matched = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (matched) return matched[1];
  const parsed = dayjs(str);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
}

function formatDateTime(value) {
  if (!value) return "-";
  const str = String(value).trim();
  const direct = str.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2})?/);
  if (direct) {
    return `${formatDateLabel(direct[1], { day: "2-digit", month: "short", year: "numeric" })} ${direct[2]}`;
  }

  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return str;

  return formatDateLabel(parsed, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds) {
  const safe = Number(seconds || 0);
  if (!Number.isFinite(safe) || safe <= 0) return "0 jam";

  const totalMinutes = Math.floor(safe / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours && minutes) return `${hours}j ${minutes}m`;
  if (hours) return `${hours} jam`;
  return `${minutes} menit`;
}

function formatPercent(value) {
  const safe = Number(value || 0);
  if (!Number.isFinite(safe)) return "0%";
  return `${Math.round(safe)}%`;
}

function formatNumber(value, maximumFractionDigits = 2) {
  const safe = Number(value || 0);
  if (!Number.isFinite(safe)) return "0";

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(safe);
}

function formatCurrency(value) {
  const safe = Number(value || 0);
  if (!Number.isFinite(safe)) return "Rp0";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(safe);
}

function buildEmptyFreelanceWeeklySummary() {
  return {
    total_supervisors: 0,
    total_freelance: 0,
    total_forms: 0,
    full_day: 0,
    half_day: 0,
    pending: 0,
    disetujui: 0,
    ditolak: 0,
  };
}

function summarizeFreelanceWeeklyRows(rows) {
  const summary = buildEmptyFreelanceWeeklySummary();
  const freelanceIds = new Set();

  for (const supervisorRow of Array.isArray(rows) ? rows : EMPTY) {
    summary.total_supervisors += 1;

    for (const freelance of Array.isArray(supervisorRow?.freelancers) ? supervisorRow.freelancers : EMPTY) {
      if (freelance?.id_freelance) freelanceIds.add(freelance.id_freelance);

      const itemSummary = freelance?.summary || {};
      summary.total_forms += Number(itemSummary.total_forms || 0);
      summary.full_day += Number(itemSummary.full_day || 0);
      summary.half_day += Number(itemSummary.half_day || 0);
      summary.pending += Number(itemSummary.pending || 0);
      summary.disetujui += Number(itemSummary.disetujui || 0);
      summary.ditolak += Number(itemSummary.ditolak || 0);
    }
  }

  summary.total_freelance = freelanceIds.size;
  return summary;
}

function computeSeconds(start, end) {
  if (!start || !end) return 0;
  const startAt = new Date(start).getTime();
  const endAt = new Date(end).getTime();
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt < startAt) return 0;
  return Math.floor((endAt - startAt) / 1000);
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function getAgendaStatusLabel(status) {
  const key = String(status || "").toLowerCase();
  if (key === "selesai") return "Selesai";
  if (key === "diproses") return "Diproses";
  if (key === "ditunda") return "Ditunda";
  return "Teragenda";
}

function getVisitStatusLabel(status) {
  const key = String(status || "").toLowerCase();
  if (key === "selesai") return "Selesai";
  if (key === "berlangsung") return "Berlangsung";
  if (key === "batal") return "Batal";
  return "Teragenda";
}

function normalizeMatchText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildMatchTokens(value) {
  return normalizeMatchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function buildPersonNameVariants(value) {
  const raw = String(value || "").trim();
  if (!raw) return EMPTY;

  const variants = new Set();
  const normalized = normalizeMatchText(raw);
  if (normalized) variants.add(normalized);

  const withoutParentheses = raw.replace(/\([^)]*\)/g, " ").trim();
  const normalizedWithoutParentheses = normalizeMatchText(withoutParentheses);
  if (normalizedWithoutParentheses) variants.add(normalizedWithoutParentheses);

  for (const separator of [" - ", "-", "|", "/"]) {
    const head = withoutParentheses.split(separator)[0]?.trim();
    const normalizedHead = normalizeMatchText(head);
    if (normalizedHead) variants.add(normalizedHead);
  }

  const firstToken = buildMatchTokens(withoutParentheses)[0];
  if (firstToken) variants.add(firstToken);

  return Array.from(variants).filter(Boolean);
}

function scorePersonNameMatch(sourceName, candidateName) {
  const sourceVariants = buildPersonNameVariants(sourceName);
  const candidateVariants = buildPersonNameVariants(candidateName);

  if (sourceVariants.length === 0 || candidateVariants.length === 0) return 0;

  let bestScore = 0;

  for (const sourceVariant of sourceVariants) {
    const sourceTokens = buildMatchTokens(sourceVariant);
    if (sourceTokens.length === 0) continue;

    for (const candidateVariant of candidateVariants) {
      const candidateTokens = buildMatchTokens(candidateVariant);
      if (candidateTokens.length === 0) continue;

      let score = 0;

      if (sourceVariant === candidateVariant) {
        score += 200;
      } else if (candidateVariant.includes(sourceVariant) || sourceVariant.includes(candidateVariant)) {
        score += 140;
      }

      const sourceFirst = sourceTokens[0];
      const candidateFirst = candidateTokens[0];
      if (
        sourceFirst &&
        candidateFirst &&
        (candidateFirst === sourceFirst ||
          candidateFirst.startsWith(sourceFirst) ||
          sourceFirst.startsWith(candidateFirst))
      ) {
        score += 90;
      }

      let matchedTokens = 0;
      for (const sourceToken of sourceTokens) {
        const hasExact = candidateTokens.some((candidateToken) => candidateToken === sourceToken);
        const hasPrefix = candidateTokens.some(
          (candidateToken) =>
            candidateToken.startsWith(sourceToken) || sourceToken.startsWith(candidateToken)
        );

        if (hasExact) {
          score += 40;
          matchedTokens += 1;
        } else if (hasPrefix) {
          score += 28;
          matchedTokens += 1;
        }
      }

      if (matchedTokens === sourceTokens.length) {
        score += 35;
      }

      bestScore = Math.max(bestScore, score);
    }
  }

  return bestScore;
}

function findBestMatchedUserByConsultantName(sourceName, users) {
  let bestUser = null;
  let bestScore = 0;

  for (const user of users) {
    const score = scorePersonNameMatch(sourceName, user?.nama);
    if (score > bestScore) {
      bestScore = score;
      bestUser = user;
    }
  }

  if (bestScore < 90) {
    return {
      matchedUser: null,
      matchedScore: bestScore,
    };
  }

  return {
    matchedUser: bestUser,
    matchedScore: bestScore,
  };
}

function getItemMatchCandidates(item) {
  return [
    item?.title,
    item?.projectName,
    item?.categoryName,
    item?.description,
  ]
    .map(normalizeMatchText)
    .filter(Boolean);
}

function isKpiMatchedByItem(kpiName, item) {
  const normalizedKpi = normalizeMatchText(kpiName);
  if (!normalizedKpi) return false;

  const kpiTokens = buildMatchTokens(kpiName);
  const candidates = getItemMatchCandidates(item);

  return candidates.some((candidate) => {
    if (candidate === normalizedKpi) return true;

    if (normalizedKpi.length >= 5 && candidate.includes(normalizedKpi)) return true;
    if (candidate.length >= 5 && normalizedKpi.includes(candidate)) return true;

    if (kpiTokens.length === 0) return false;
    const candidateTokens = new Set(buildMatchTokens(candidate));
    return kpiTokens.every((token) => candidateTokens.has(token));
  });
}

function getActivityAnchorId(source, id) {
  return `activity-${source}-${id}`;
}

function resolveKpiMetricSource(kpiName, satuan = "") {
  const normalized = normalizeMatchText(`${kpiName} ${satuan}`);
  if (!normalized) return "activity";

  if (
    normalized.includes("revenue") ||
    normalized.includes("sales") ||
    normalized.includes("omzet") ||
    normalized.includes("omset") ||
    normalized.includes("penjualan") ||
    normalized.includes("rupiah")
  ) {
    return "revenue";
  }

  if (
    normalized.includes("lead") ||
    normalized.includes("konsultasi") ||
    normalized.includes("consultation") ||
    normalized.includes("consultant") ||
    normalized.includes("siswa") ||
    normalized.includes("student")
  ) {
    return "lead";
  }

  return "activity";
}


function extractLeadRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.leads)) return payload.data.leads;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.leads)) return payload.leads;
  if (Array.isArray(payload?.items)) return payload.items;
  return EMPTY;
}

function extractStudentRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.students)) return payload.data.students;
  if (Array.isArray(payload?.students)) return payload.students;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  return EMPTY;
}

function normalizeLeadDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object" && Object.keys(value).length === 0) return null;
  return null;
}

function normalizeLeadRow(item, index) {
  return {
    id:
      item?.id_lead ??
      item?.id ??
      item?.uuid ??
      item?.lead_id ??
      `${String(item?.name ?? item?.nama ?? item?.full_name ?? "lead").trim()}-${String(item?.created_at ?? item?.tanggal ?? index)}`,
    nama: String(
      item?.nama ??
        item?.name ??
        item?.nama_lengkap ??
        item?.full_name ??
        item?.lead_name ??
        item?.student_name ??
        "Tanpa Nama"
    ).trim(),
    email: String(item?.email ?? item?.email_address ?? "").trim(),
    phone: String(item?.phone ?? item?.nomor_hp ?? item?.no_hp ?? item?.whatsapp ?? item?.wa ?? "").trim(),
    country: String(item?.country ?? item?.negara ?? item?.destination_country ?? item?.tujuan_negara ?? "").trim(),
    domicile: String(item?.domicile ?? item?.domisili ?? item?.alamat ?? "").trim(),
    educationLast: String(item?.education_last ?? item?.pendidikan_terakhir ?? item?.education ?? "").trim(),
    source: String(item?.source ?? item?.sumber ?? item?.channel ?? "").trim(),
    status: String(item?.status ?? item?.lead_status ?? item?.stage ?? "baru").trim(),
    consultantName: String(
      item?.consultant_name ?? item?.nama_konsultan ?? item?.consultant ?? item?.owner_name ?? ""
    ).trim(),
    assignedAt: normalizeLeadDateValue(item?.assigned_at ?? item?.assignedAt ?? null),
    createdAt: normalizeLeadDateValue(item?.created_at ?? item?.tanggal ?? item?.createdAt ?? item?.submitted_at ?? null),
    notes: String(item?.notes ?? item?.catatan ?? item?.keterangan ?? "").trim(),
    raw: item,
  };
}

function summarizeLeadRows(rows) {
  const statusMap = new Map();
  const sourceMap = new Map();
  const countrySet = new Set();

  for (const row of rows) {
    const statusKey = String(row?.status || "baru").trim().toLowerCase() || "baru";
    statusMap.set(statusKey, (statusMap.get(statusKey) || 0) + 1);

    const sourceKey = String(row?.source || "").trim();
    if (sourceKey) sourceMap.set(sourceKey, (sourceMap.get(sourceKey) || 0) + 1);

    const countryKey = String(row?.country || "").trim();
    if (countryKey) countrySet.add(countryKey);
  }

  return {
    total: rows.length,
    countryCount: countrySet.size,
    statusBreakdown: Array.from(statusMap.entries())
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total),
    sourceBreakdown: Array.from(sourceMap.entries())
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total),
  };
}

function normalizeStudentRow(item, index) {
  return {
    id:
      item?.id_student ??
      item?.id ??
      item?.uuid ??
      `${String(item?.student_name ?? item?.nama_siswa ?? item?.nama ?? "student").trim()}-${index}`,
    nama: String(
      item?.student_name ??
        item?.nama_siswa ??
        item?.nama ??
        item?.name ??
        item?.full_name ??
        "Tanpa Nama"
    ).trim(),
    consultantName: String(
      item?.consultant_name ?? item?.nama_konsultan ?? item?.consultant ?? item?.owner_name ?? ""
    ).trim(),
    programName: String(
      item?.program_name ??
        item?.nama_program ??
        item?.product_name ??
        item?.nama_produk ??
        item?.program ??
        ""
    ).trim(),
    status: String(item?.status ?? item?.student_status ?? item?.stage ?? "").trim(),
    createdAt: normalizeLeadDateValue(item?.created_at ?? item?.tanggal ?? item?.createdAt ?? null),
    raw: item,
  };
}

function summarizeStudentRows(rows) {
  const programSet = new Set();
  const statusMap = new Map();

  for (const row of rows) {
    const programKey = String(row?.programName || "").trim();
    if (programKey) programSet.add(programKey);

    const statusKey = String(row?.status || "").trim().toLowerCase();
    if (statusKey) statusMap.set(statusKey, (statusMap.get(statusKey) || 0) + 1);
  }

  return {
    total: rows.length,
    programCount: programSet.size,
    statusBreakdown: Array.from(statusMap.entries())
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total),
  };
}

function countFridayWeeksInYear(year) {
  const safeYear = Number(year);
  if (!Number.isInteger(safeYear)) return 52;

  let cursor = dayjs(`${safeYear}-01-01`).startOf("day");
  const offset = (5 - cursor.day() + 7) % 7;
  cursor = cursor.add(offset, "day");

  let total = 0;
  while (cursor.year() === safeYear) {
    total += 1;
    cursor = cursor.add(7, "day");
  }

  return total || 52;
}

function normalizeKpiPlan(plan) {
  const id = String(plan?.id ?? plan?.id_kpi_plan ?? "").trim();
  if (!id) return null;

  return {
    id,
    userId: String(plan?.userId ?? plan?.id_user ?? "").trim(),
    tahun: Number(plan?.tahun || 0),
    namaKaryawan: plan?.namaKaryawan ?? plan?.nama_user_snapshot ?? "",
    namaJabatan: plan?.namaJabatan ?? plan?.jabatan_snapshot ?? "",
    namaLokasi: plan?.namaLokasi ?? plan?.location_snapshot ?? "",
    items: (Array.isArray(plan?.items) ? plan.items : EMPTY).map((item) => ({
      id: String(item?.id ?? item?.id_kpi_plan_item ?? "").trim(),
      kpiId: String(item?.kpiId ?? item?.id_kpi ?? "").trim(),
      namaKpi: String(item?.namaKpi ?? item?.nama_kpi_snapshot ?? "").trim(),
      satuan: String(item?.satuan ?? item?.satuan_snapshot ?? "").trim(),
      targetTahunan: Number(item?.targetTahunan ?? item?.target_tahunan ?? 0),
    })),
  };
}

function buildUserMeta(user) {
  if (!user) return null;

  const id = String(user?.id_user ?? user?.id ?? user?.uuid ?? "").trim();
  if (!id) return null;

  const departement =
    user?.departement?.nama_departement ??
    user?.departemen?.nama_departemen ??
    user?.department?.name ??
    (typeof user?.departement === "string" ? user.departement : null) ??
    (typeof user?.departemen === "string" ? user.departemen : null) ??
    (typeof user?.department === "string" ? user.department : null) ??
    user?.divisi ??
    "-";

  const jabatan =
    user?.jabatan?.nama_jabatan ??
    user?.jabatan?.nama ??
    user?.jabatan?.title ??
    (typeof user?.jabatan === "string" ? user.jabatan : null) ??
    user?.role ??
    "-";

  return {
    id,
    nama: user?.nama_pengguna ?? user?.nama ?? user?.name ?? user?.email ?? id,
    email: user?.email ?? "",
    role: user?.role ?? "-",
    departement,
    jabatan,
    foto: user?.foto_profil_user ?? null,
  };
}

async function fetchAllUsers() {
  const pageSize = 500;
  let page = 1;
  const all = [];

  while (true) {
    const url = `${ApiEndpoints.GetUsers}?page=${page}&pageSize=${pageSize}&includeDeleted=0&orderBy=nama_pengguna&sort=asc`;
    const json = await fetcher(url);
    const items = Array.isArray(json?.data) ? json.data : EMPTY;

    all.push(...items);

    const totalPages = json?.pagination?.totalPages ?? json?.meta?.totalPages ?? null;
    if (totalPages) {
      if (page >= totalPages) break;
      page += 1;
      continue;
    }

    if (items.length < pageSize) break;
    page += 1;
  }

  return all;
}

async function fetchAllAgenda(from, to) {
  const perPage = 200;
  let page = 1;
  const all = [];

  while (true) {
    const params = new URLSearchParams({
      from,
      to,
      page: String(page),
      perPage: String(perPage),
      orderBy: "start_date",
      sort: "asc",
    });

    const json = await fetcher(`${ApiEndpoints.GetAgendaKerja}?${params.toString()}`);
    const items = Array.isArray(json?.data) ? json.data : Array.isArray(json?.items) ? json.items : EMPTY;

    all.push(...items);

    const totalPages = json?.pagination?.totalPages ?? json?.meta?.totalPages ?? null;
    if (totalPages) {
      if (page >= totalPages) break;
      page += 1;
      continue;
    }

    if (items.length < perPage) break;
    page += 1;
  }

  return all;
}

async function fetchAllKunjungan(from, to) {
  const pageSize = 500;
  let page = 1;
  const all = [];

  while (true) {
    const params = new URLSearchParams({
      tanggal_mulai: from,
      tanggal_selesai: to,
      page: String(page),
      pageSize: String(pageSize),
      orderBy: "tanggal",
      sort: "asc",
    });

    const json = await fetcher(`${ApiEndpoints.GetKunjungan}?${params.toString()}`);
    const items = Array.isArray(json?.data) ? json.data : EMPTY;

    all.push(...items);

    const totalPages = json?.pagination?.totalPages ?? json?.meta?.totalPages ?? null;
    if (totalPages) {
      if (page >= totalPages) break;
      page += 1;
      continue;
    }

    if (items.length < pageSize) break;
    page += 1;
  }

  return all;
}

async function fetchAllAbsensi(from, to) {
  const perPage = 2000;
  let page = 1;
  const all = [];

  while (true) {
    const json = await fetcher(
      ApiEndpoints.GetAbsensiRecords({
        from,
        to,
        page,
        perPage,
      })
    );

    const items = Array.isArray(json?.data) ? json.data : EMPTY;
    all.push(...items);

    const totalPages = json?.meta?.totalPages ?? json?.pagination?.totalPages ?? null;
    if (totalPages) {
      if (page >= totalPages) break;
      page += 1;
      continue;
    }

    if (items.length < perPage) break;
    page += 1;
  }

  return all;
}

async function fetchRevenueWeeklySales(from, to) {
  try {
    return await fetcher(
      ApiEndpoints.GetSalesWeeklyReport({
        from,
        to,
      })
    );
  } catch (error) {
    console.error("Revenue weekly sales unavailable:", error);
    return {
      basis_day: "Friday",
      range: { from, to },
      data: [],
    };
  }
}



async function fetchFreelanceWeeklyReport(from, to) {
  return fetcher(
    ApiEndpoints.GetFreelanceWeeklyReport({
      from,
      to,
    })
  );
}

async function fetchLeadsByConsultantReport(name, rangeDate = "") {
  if (!name) {
    return {
      query: { name: "", range_date: rangeDate || "" },
      summary: {
        total: 0,
        countryCount: 0,
        statusBreakdown: [],
        sourceBreakdown: [],
      },
      data: [],
    };
  }

  if (!LEADS_BY_CONSULTANT_API_KEY) {
    throw new Error("NEXT_PUBLIC_REPORT_LEADS_BY_CONSULTANT_API_KEY belum diset.");
  }

  const url = new URL(String(LEADS_BY_CONSULTANT_API_URL).replace(/\/+$|$/, ""));
  url.searchParams.set("name", name);
  if (rangeDate) url.searchParams.set("range_date", rangeDate);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": LEADS_BY_CONSULTANT_API_KEY,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error?.message ||
        `HTTP error! status: ${response.status}`
    );
  }

  const rows = extractLeadRows(payload).map(normalizeLeadRow);
  const responseData = payload?.data && typeof payload.data === "object" ? payload.data : {};
  return {
    query: {
      name: responseData?.query_name || name,
      normalized_query: responseData?.normalized_query || "",
      range_date: responseData?.range_date || rangeDate || "",
    },
    matchedConsultant: responseData?.matched_consultant || null,
    summary: summarizeLeadRows(rows),
    data: rows,
  };
}

async function fetchStudentByConsultantReport(name, rangeDate = "") {
  if (!name) {
    return {
      query: { name: "", range_date: rangeDate || "" },
      summary: {
        total: 0,
        programCount: 0,
        statusBreakdown: [],
      },
      data: [],
    };
  }

  if (!STUDENT_BY_CONSULTANT_API_KEY) {
    throw new Error("NEXT_PUBLIC_REPORT_STUDENT_BY_CONSULTANT_API_KEY belum diset.");
  }

  const url = new URL(String(STUDENT_BY_CONSULTANT_API_URL).replace(/\/+$|$/, ""));
  url.searchParams.set("name", name);
  if (rangeDate) url.searchParams.set("range_date", rangeDate);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": STUDENT_BY_CONSULTANT_API_KEY,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error?.message ||
        `HTTP error! status: ${response.status}`
    );
  }

  const rows = extractStudentRows(payload).map(normalizeStudentRow);
  return {
    query: { name, range_date: rangeDate || "" },
    summary: summarizeStudentRows(rows),
    data: rows,
  };
}

async function fetchAllKpiPlans(years, userId = "") {
  const all = [];
  const uniqueYears = Array.from(new Set((Array.isArray(years) ? years : EMPTY).filter(Boolean)));

  for (const year of uniqueYears) {
    const pageSize = 100;
    let page = 1;

    while (true) {
      const json = await fetcher(
        ApiEndpoints.GetKpiPlans({
          tahun: year,
          userId: userId || undefined,
          page,
          pageSize,
        })
      );

      const rows = Array.isArray(json?.data) ? json.data : EMPTY;
      all.push(...rows.map(normalizeKpiPlan).filter(Boolean));

      const totalPages = json?.pagination?.totalPages ?? json?.meta?.totalPages ?? null;
      if (totalPages) {
        if (page >= totalPages) break;
        page += 1;
        continue;
      }

      if (rows.length < pageSize) break;
      page += 1;
    }
  }

  return all;
}

function normalizeAgendaItem(item, usersById) {
  const userId = String(item?.id_user ?? item?.user?.id_user ?? item?.user?.id ?? "").trim();
  const mergedUser = {
    ...(userId ? usersById.get(userId) || {} : {}),
    ...(item?.user || {}),
  };
  const meta = buildUserMeta(mergedUser);
  const startedAt = item?.start_date ?? item?.end_date ?? item?.created_at ?? null;

  return {
    id: item?.id_agenda_kerja ?? item?.id ?? "",
    source: "agenda",
    userId: meta?.id ?? userId,
    user: meta,
    title: item?.deskripsi_kerja || item?.agenda?.nama_agenda || "Aktivitas",
    projectName: item?.agenda?.nama_agenda || "-",
    description: item?.deskripsi_kerja || "-",
    status: String(item?.status || "teragenda").toLowerCase(),
    statusLabel: getAgendaStatusLabel(item?.status),
    startedAt,
    endedAt: item?.end_date ?? null,
    dateKey: formatDateKey(startedAt),
    durationSeconds:
      Number(item?.duration_seconds) > 0
        ? Number(item.duration_seconds)
        : computeSeconds(item?.start_date, item?.end_date),
  };
}

function normalizeKunjunganItem(item, usersById) {
  const userId = String(item?.id_user ?? item?.user?.id_user ?? item?.user?.id ?? "").trim();
  const mergedUser = {
    ...(userId ? usersById.get(userId) || {} : {}),
    ...(item?.user || {}),
  };
  const meta = buildUserMeta(mergedUser);
  const startedAt = item?.jam_mulai ?? item?.tanggal ?? item?.created_at ?? null;

  return {
    id: item?.id_kunjungan ?? item?.id ?? "",
    source: "kunjungan",
    userId: meta?.id ?? userId,
    user: meta,
    title: item?.kategori?.kategori_kunjungan || "Kunjungan Klien",
    categoryName: item?.kategori?.kategori_kunjungan || "-",
    description: item?.deskripsi || item?.hand_over || "-",
    status: String(item?.status_kunjungan || "diproses").toLowerCase(),
    statusLabel: getVisitStatusLabel(item?.status_kunjungan),
    startedAt,
    endedAt: item?.jam_selesai ?? null,
    dateKey: formatDateKey(item?.tanggal ?? startedAt),
    durationSeconds: computeSeconds(item?.jam_mulai, item?.jam_selesai),
  };
}

function resolveLocationCompliance(location, latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const officeLat = Number(location?.latitude);
  const officeLon = Number(location?.longitude);
  const radius = Number(location?.radius);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (!Number.isFinite(officeLat) || !Number.isFinite(officeLon) || !Number.isFinite(radius)) return null;

  return haversineMeters(lat, lon, officeLat, officeLon) <= radius;
}

function normalizeAbsensiItem(item, usersById) {
  const userId = String(item?.id_user ?? item?.user?.id_user ?? item?.user?.id ?? "").trim();
  const mergedUser = {
    ...(userId ? usersById.get(userId) || {} : {}),
    ...(item?.user || {}),
  };
  const meta = buildUserMeta(mergedUser);
  const breaks = Array.isArray(item?.istirahat) ? item.istirahat : EMPTY;
  const breakSessions = breaks.map((entry) => ({
    id: entry?.id_istirahat ?? "",
    start: entry?.start_istirahat ?? null,
    end: entry?.end_istirahat ?? null,
    durationSeconds: computeSeconds(entry?.start_istirahat, entry?.end_istirahat),
  }));
  const totalBreakSeconds = breakSessions.reduce((total, entry) => total + entry.durationSeconds, 0);

  return {
    id: item?.id_absensi ?? "",
    userId: meta?.id ?? userId,
    user: meta,
    dateKey: formatDateKey(item?.tanggal),
    tanggal: item?.tanggal ?? null,
    jamMasuk: item?.jam_masuk ?? null,
    jamPulang: item?.jam_pulang ?? null,
    statusMasuk: String(item?.status_masuk || "").toLowerCase(),
    statusPulang: String(item?.status_pulang || "").toLowerCase(),
    checkInCompliant: resolveLocationCompliance(item?.lokasiIn, item?.in_latitude, item?.in_longitude),
    checkOutCompliant: resolveLocationCompliance(item?.lokasiOut, item?.out_latitude, item?.out_longitude),
    breakSessions,
    totalBreakSeconds,
  };
}

function normalizeRevenueItem(item, users) {
  const consultantName = String(item?.nama_konsultan || "").trim();
  const { matchedUser, matchedScore } = findBestMatchedUserByConsultantName(consultantName, users);

  return {
    id: `${item?.week_start || ""}:${consultantName}:${item?.nama_produk || ""}`,
    consultantName,
    productName: String(item?.nama_produk || "-").trim() || "-",
    revenue: Number(item?.revenue || 0),
    dateLabel: String(item?.date || "").trim(),
    weekStart: String(item?.week_start || "").trim(),
    weekEnd: String(item?.week_end || "").trim(),
    matchedUserId: matchedUser?.id || "",
    matchedUser,
    matchedScore,
  };
}

function summarizeItemsByKey(items, getKey, getLabel, durationGetter = null) {
  const map = new Map();

  for (const item of items) {
    const rawKey = getKey(item);
    const key = String(rawKey || "").trim() || "tanpa-kategori";

    if (!map.has(key)) {
      map.set(key, {
        key,
        label: getLabel(item) || "-",
        total: 0,
        selesai: 0,
        durationSeconds: 0,
        latestAt: 0,
      });
    }

    const row = map.get(key);
    row.total += 1;
    if (String(item?.status || "").toLowerCase() === "selesai") row.selesai += 1;
    if (typeof durationGetter === "function") {
      row.durationSeconds += Number(durationGetter(item) || 0);
    }

    const latestAt = new Date(item?.startedAt || item?.endedAt || 0).getTime();
    if (Number.isFinite(latestAt) && latestAt > row.latestAt) row.latestAt = latestAt;
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.durationSeconds !== a.durationSeconds) return b.durationSeconds - a.durationSeconds;
    return String(a.label).localeCompare(String(b.label));
  });
}

export default function useLaporanMingguanViewModel() {
  const [weekStart, setWeekStart] = useState(DEFAULT_WEEK_START);
  const [selectedUserId, setSelectedUserId] = useState("");

  const week = useMemo(() => {
    const start = getWeekStartFriday(weekStart);
    const end = start.add(6, "day").endOf("day");
    return {
      start,
      end,
      from: start.format("YYYY-MM-DD"),
      to: end.format("YYYY-MM-DD"),
      label: `${formatDateLabel(start.toDate(), { day: "2-digit", month: "short", year: "numeric" })} - ${formatDateLabel(end.toDate(), { day: "2-digit", month: "short", year: "numeric" })}`,
    };
  }, [weekStart]);

  const usersSwr = useSWR("laporan-mingguan:users", fetchAllUsers, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const agendaSwr = useSWR(
    ["laporan-mingguan:agenda", week.from, week.to],
    () => fetchAllAgenda(week.from, week.to),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const kunjunganSwr = useSWR(
    ["laporan-mingguan:kunjungan", week.from, week.to],
    () => fetchAllKunjungan(week.from, week.to),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const absensiSwr = useSWR(
    ["laporan-mingguan:absensi", week.from, week.to],
    () => fetchAllAbsensi(week.from, week.to),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const revenueSwr = useSWR(
    ["laporan-mingguan:revenue", week.from, week.to],
    () => fetchRevenueWeeklySales(week.from, week.to),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const freelanceWeeklySwr = useSWR(
    ["laporan-mingguan:freelance-weekly", week.from, week.to],
    () => fetchFreelanceWeeklyReport(week.from, week.to),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const leadsByConsultantSwr = useSWR(
    selectedUserId ? ["laporan-mingguan:leads-by-consultant", selectedUserId, week.from, week.to] : null,
    () => fetchLeadsByConsultantReport(selectedUserMeta?.nama || "", `${week.from},${week.to}`),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const studentByConsultantSwr = useSWR(
    selectedUserId ? ["laporan-mingguan:student-by-consultant", selectedUserId, week.from, week.to] : null,
    () => fetchStudentByConsultantReport(selectedUserMeta?.nama || "", `${week.from},${week.to}`),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const kpiYears = useMemo(
    () => Array.from(new Set([week.start.year(), week.end.year()])),
    [week.end, week.start]
  );

  const kpiPlansSwr = useSWR(
    ["laporan-mingguan:kpi-plans", selectedUserId || "all", ...kpiYears],
    () => fetchAllKpiPlans(kpiYears, selectedUserId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const users = useMemo(
    () => (Array.isArray(usersSwr.data) ? usersSwr.data : EMPTY),
    [usersSwr.data]
  );

  const usersById = useMemo(() => {
    const map = new Map();
    for (const row of users) {
      const meta = buildUserMeta(row);
      if (meta?.id) map.set(meta.id, meta);
    }
    return map;
  }, [users]);

  const karyawanOptions = useMemo(() => {
    return users
      .map(buildUserMeta)
      .filter(Boolean)
      .map((user) => ({ value: user.id, label: user.nama }));
  }, [users]);

  useEffect(() => {
    if (karyawanOptions.length === 0) {
      if (selectedUserId) setSelectedUserId("");
      return;
    }

    const stillExists = karyawanOptions.some((option) => option.value === selectedUserId);
    if (!stillExists) {
      setSelectedUserId(karyawanOptions[0].value);
    }
  }, [karyawanOptions, selectedUserId]);

  const selectedUserMeta = useMemo(
    () => (selectedUserId ? usersById.get(selectedUserId) || null : null),
    [selectedUserId, usersById]
  );

  const agendaItems = useMemo(() => {
    const rows = Array.isArray(agendaSwr.data) ? agendaSwr.data : EMPTY;
    return rows.map((item) => normalizeAgendaItem(item, usersById));
  }, [agendaSwr.data, usersById]);

  const kunjunganItems = useMemo(() => {
    const rows = Array.isArray(kunjunganSwr.data) ? kunjunganSwr.data : EMPTY;
    return rows.map((item) => normalizeKunjunganItem(item, usersById));
  }, [kunjunganSwr.data, usersById]);

  const absensiItems = useMemo(() => {
    const rows = Array.isArray(absensiSwr.data) ? absensiSwr.data : EMPTY;
    return rows.map((item) => normalizeAbsensiItem(item, usersById));
  }, [absensiSwr.data, usersById]);

  const kpiPlans = useMemo(
    () => (Array.isArray(kpiPlansSwr.data) ? kpiPlansSwr.data : EMPTY),
    [kpiPlansSwr.data]
  );

  const revenueItems = useMemo(() => {
    const rows = Array.isArray(revenueSwr.data?.data) ? revenueSwr.data.data : EMPTY;
    const userRows = users.map(buildUserMeta).filter(Boolean);
    return rows.map((item) => normalizeRevenueItem(item, userRows));
  }, [revenueSwr.data, users]);

  const filteredAgendaItems = useMemo(() => {
    if (!selectedUserId) return agendaItems;
    return agendaItems.filter((item) => item.userId === selectedUserId);
  }, [agendaItems, selectedUserId]);

  const filteredKunjunganItems = useMemo(() => {
    if (!selectedUserId) return kunjunganItems;
    return kunjunganItems.filter((item) => item.userId === selectedUserId);
  }, [kunjunganItems, selectedUserId]);

  const filteredAbsensiItems = useMemo(() => {
    if (!selectedUserId) return absensiItems;
    return absensiItems.filter((item) => item.userId === selectedUserId);
  }, [absensiItems, selectedUserId]);

  const filteredRevenueItems = useMemo(() => {
    if (!selectedUserId) return revenueItems;
    return revenueItems.filter((item) => item.matchedUserId === selectedUserId);
  }, [revenueItems, selectedUserId]);

  const combinedFeed = useMemo(() => {
    return [...filteredAgendaItems, ...filteredKunjunganItems]
      .slice()
      .sort((a, b) => {
        const left = new Date(a.startedAt || a.endedAt || 0).getTime();
        const right = new Date(b.startedAt || b.endedAt || 0).getTime();
        const safeLeft = Number.isFinite(left) ? left : 0;
        const safeRight = Number.isFinite(right) ? right : 0;
        return safeRight - safeLeft;
      });
  }, [filteredAgendaItems, filteredKunjunganItems]);

  const summary = useMemo(() => {
    const agendaDone = filteredAgendaItems.filter((item) => item.status === "selesai").length;
    const agendaInProgress = filteredAgendaItems.filter((item) => item.status === "diproses").length;
    const agendaPlanned = filteredAgendaItems.filter((item) => item.status === "teragenda").length;
    const agendaPaused = filteredAgendaItems.filter((item) => item.status === "ditunda").length;

    const visitDone = filteredKunjunganItems.filter((item) => item.status === "selesai").length;
    const visitRunning = filteredKunjunganItems.filter((item) => item.status === "berlangsung").length;
    const visitPlanned = filteredKunjunganItems.filter((item) => item.status === "diproses").length;
    const visitCanceled = filteredKunjunganItems.filter((item) => item.status === "batal").length;

    const agendaDurationSeconds = filteredAgendaItems.reduce(
      (total, item) => total + Number(item.durationSeconds || 0),
      0
    );

    const visitDurationSeconds = filteredKunjunganItems.reduce(
      (total, item) => total + Number(item.durationSeconds || 0),
      0
    );

    const activeUserCount = new Set(
      [
        ...filteredAgendaItems,
        ...filteredKunjunganItems,
        ...filteredAbsensiItems,
      ]
        .map((item) => item.userId)
        .filter(Boolean)
    ).size;

    const totalTrackedItems = filteredAgendaItems.length + filteredKunjunganItems.length;
    const completedTrackedItems = agendaDone + visitDone;
    const completionRate = totalTrackedItems ? (completedTrackedItems / totalTrackedItems) * 100 : 0;
    const agendaCompletionRate = filteredAgendaItems.length ? (agendaDone / filteredAgendaItems.length) * 100 : 0;
    const visitCompletionRate = filteredKunjunganItems.length ? (visitDone / filteredKunjunganItems.length) * 100 : 0;

    return {
      activeUserCount,
      totalTrackedItems,
      completedTrackedItems,
      completionRate,
      agendaCount: filteredAgendaItems.length,
      agendaDone,
      agendaInProgress,
      agendaPlanned,
      agendaPaused,
      agendaDurationSeconds,
      agendaCompletionRate,
      visitCount: filteredKunjunganItems.length,
      visitDone,
      visitRunning,
      visitPlanned,
      visitCanceled,
      visitDurationSeconds,
      visitCompletionRate,
    };
  }, [filteredAbsensiItems, filteredAgendaItems, filteredKunjunganItems]);

  const attendanceSummary = useMemo(() => {
    const presentDays = filteredAbsensiItems.length;
    const onTimeCount = filteredAbsensiItems.filter((item) => item.statusMasuk === "tepat").length;
    const lateCount = filteredAbsensiItems.filter((item) => item.statusMasuk === "terlambat").length;
    const onTimeCheckoutCount = filteredAbsensiItems.filter((item) => item.statusPulang === "tepat").length;
    const lateCheckoutCount = filteredAbsensiItems.filter((item) => item.statusPulang === "terlambat").length;
    const checkedOutCount = filteredAbsensiItems.filter((item) => item.jamPulang).length;
    const breakSessions = filteredAbsensiItems.reduce(
      (total, item) => total + item.breakSessions.length,
      0
    );
    const totalBreakSeconds = filteredAbsensiItems.reduce(
      (total, item) => total + Number(item.totalBreakSeconds || 0),
      0
    );
    const averageBreakSeconds = breakSessions ? totalBreakSeconds / breakSessions : 0;
    const overBreakCount = filteredAbsensiItems.filter(
      (item) => Number(item.totalBreakSeconds || 0) > OVER_BREAK_THRESHOLD_SECONDS
    ).length;

    let evaluatedLocationChecks = 0;
    let compliantLocationChecks = 0;

    for (const item of filteredAbsensiItems) {
      for (const value of [item.checkInCompliant, item.checkOutCompliant]) {
        if (value == null) continue;
        evaluatedLocationChecks += 1;
        if (value) compliantLocationChecks += 1;
      }
    }

    return {
      presentDays,
      onTimeCount,
      lateCount,
      onTimeRate: presentDays ? (onTimeCount / presentDays) * 100 : 0,
      onTimeCheckoutCount,
      lateCheckoutCount,
      checkedOutCount,
      breakSessions,
      totalBreakSeconds,
      averageBreakSeconds,
      overBreakCount,
      evaluatedLocationChecks,
      compliantLocationChecks,
      locationComplianceRate: evaluatedLocationChecks
        ? (compliantLocationChecks / evaluatedLocationChecks) * 100
        : 0,
    };
  }, [filteredAbsensiItems]);

  const revenueSummary = useMemo(() => {
    const totalRevenue = filteredRevenueItems.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
    const productCount = new Set(filteredRevenueItems.map((item) => item.productName).filter(Boolean)).size;
    const consultantCount = new Set(
      filteredRevenueItems.map((item) => item.matchedUserId || item.consultantName).filter(Boolean)
    ).size;

    return {
      totalRevenue,
      transactionCount: filteredRevenueItems.length,
      productCount,
      consultantCount,
      averageRevenue: filteredRevenueItems.length ? totalRevenue / filteredRevenueItems.length : 0,
    };
  }, [filteredRevenueItems]);

  const freelanceSupervisorRows = useMemo(() => {
    const rows = Array.isArray(freelanceWeeklySwr.data?.supervisors) ? freelanceWeeklySwr.data.supervisors : EMPTY;
    if (!selectedUserId) return rows;
    return rows.filter((group) => String(group?.supervisor?.id_user || "").trim() === selectedUserId);
  }, [freelanceWeeklySwr.data, selectedUserId]);

  const freelanceWeeklySummary = useMemo(() => {
    return summarizeFreelanceWeeklyRows(freelanceSupervisorRows);
  }, [freelanceSupervisorRows]);

  const leadsByConsultantSummary = useMemo(() => {
    return leadsByConsultantSwr.data?.summary || {
      total: 0,
      countryCount: 0,
      statusBreakdown: [],
      sourceBreakdown: [],
    };
  }, [leadsByConsultantSwr.data]);

  const leadsByConsultantMeta = useMemo(() => {
    return {
      query: leadsByConsultantSwr.data?.query || { name: "", normalized_query: "", range_date: "" },
      matchedConsultant: leadsByConsultantSwr.data?.matchedConsultant || null,
    };
  }, [leadsByConsultantSwr.data]);

  const leadsByConsultantRows = useMemo(() => {
    return Array.isArray(leadsByConsultantSwr.data?.data) ? leadsByConsultantSwr.data.data : EMPTY;
  }, [leadsByConsultantSwr.data]);

  const studentByConsultantSummary = useMemo(() => {
    return studentByConsultantSwr.data?.summary || {
      total: 0,
      programCount: 0,
      statusBreakdown: [],
    };
  }, [studentByConsultantSwr.data]);

  const studentByConsultantRows = useMemo(() => {
    return Array.isArray(studentByConsultantSwr.data?.data) ? studentByConsultantSwr.data.data : EMPTY;
  }, [studentByConsultantSwr.data]);

  const revenueByProduct = useMemo(() => {
    const map = new Map();

    for (const item of filteredRevenueItems) {
      const key = item.productName || "-";
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: key,
          totalRevenue: 0,
          totalTransactions: 0,
        });
      }

      const row = map.get(key);
      row.totalRevenue += Number(item.revenue || 0);
      row.totalTransactions += 1;
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.totalRevenue !== a.totalRevenue) return b.totalRevenue - a.totalRevenue;
      if (b.totalTransactions !== a.totalTransactions) return b.totalTransactions - a.totalTransactions;
      return a.label.localeCompare(b.label);
    });
  }, [filteredRevenueItems]);

  const timelineDays = useMemo(() => {
    const days = [];

    for (let index = 0; index < 7; index += 1) {
      const date = week.start.add(index, "day");
      const dateKey = date.format("YYYY-MM-DD");
      const agenda = filteredAgendaItems.filter((item) => item.dateKey === dateKey);
      const kunjungan = filteredKunjunganItems.filter((item) => item.dateKey === dateKey);
      const absensi = filteredAbsensiItems.filter((item) => item.dateKey === dateKey);

      days.push({
        dateKey,
        dayLabel: formatDateLabel(date.toDate(), { weekday: "short" }),
        dateLabel: formatDateLabel(date.toDate(), { day: "2-digit", month: "short" }),
        agendaCount: agenda.length,
        agendaDone: agenda.filter((item) => item.status === "selesai").length,
        agendaDurationSeconds: agenda.reduce((total, item) => total + Number(item.durationSeconds || 0), 0),
        visitCount: kunjungan.length,
        visitDone: kunjungan.filter((item) => item.status === "selesai").length,
        attendanceCount: absensi.length,
        onTimeAttendanceCount: absensi.filter((item) => item.statusMasuk === "tepat").length,
        breakSessions: absensi.reduce((total, item) => total + item.breakSessions.length, 0),
        breakSeconds: absensi.reduce((total, item) => total + Number(item.totalBreakSeconds || 0), 0),
        totalItems: agenda.length + kunjungan.length,
        completedItems:
          agenda.filter((item) => item.status === "selesai").length +
          kunjungan.filter((item) => item.status === "selesai").length,
      });
    }

    return days;
  }, [filteredAbsensiItems, filteredAgendaItems, filteredKunjunganItems, week.start]);

  const employeeRows = useMemo(() => {
    const map = new Map();

    const ensureRow = (item) => {
      const userId = item.userId || "tanpa-user";
      if (!map.has(userId)) {
        map.set(userId, {
          userId,
          user: item.user || usersById.get(userId) || null,
          agendaCount: 0,
          agendaDone: 0,
          agendaDurationSeconds: 0,
          visitCount: 0,
          visitDone: 0,
          attendanceDays: 0,
          onTimeCount: 0,
          lateCount: 0,
          breakSessions: 0,
          breakSeconds: 0,
          locationChecks: 0,
          compliantLocationChecks: 0,
          latestAt: null,
          days: {},
        });
      }
      return map.get(userId);
    };

    for (const item of filteredAgendaItems) {
      const row = ensureRow(item);
      row.agendaCount += 1;
      row.agendaDurationSeconds += Number(item.durationSeconds || 0);
      if (item.status === "selesai") row.agendaDone += 1;
      row.days[item.dateKey] = (row.days[item.dateKey] || 0) + 1;
      const startedAt = new Date(item.startedAt || item.endedAt || 0).getTime();
      if (Number.isFinite(startedAt) && (!row.latestAt || startedAt > row.latestAt)) row.latestAt = startedAt;
    }

    for (const item of filteredKunjunganItems) {
      const row = ensureRow(item);
      row.visitCount += 1;
      if (item.status === "selesai") row.visitDone += 1;
      row.days[item.dateKey] = (row.days[item.dateKey] || 0) + 1;
      const startedAt = new Date(item.startedAt || item.endedAt || 0).getTime();
      if (Number.isFinite(startedAt) && (!row.latestAt || startedAt > row.latestAt)) row.latestAt = startedAt;
    }

    for (const item of filteredAbsensiItems) {
      const row = ensureRow(item);
      row.attendanceDays += 1;
      if (item.statusMasuk === "tepat") row.onTimeCount += 1;
      if (item.statusMasuk === "terlambat") row.lateCount += 1;
      row.breakSessions += item.breakSessions.length;
      row.breakSeconds += Number(item.totalBreakSeconds || 0);

      for (const value of [item.checkInCompliant, item.checkOutCompliant]) {
        if (value == null) continue;
        row.locationChecks += 1;
        if (value) row.compliantLocationChecks += 1;
      }

      row.days[item.dateKey] = (row.days[item.dateKey] || 0) + 1;
      const startedAt = new Date(item.jamMasuk || item.jamPulang || item.tanggal || 0).getTime();
      if (Number.isFinite(startedAt) && (!row.latestAt || startedAt > row.latestAt)) row.latestAt = startedAt;
    }

    return Array.from(map.values())
      .map((row) => ({
        ...row,
        totalItems: row.agendaCount + row.visitCount,
        totalPerformanceRecords: row.agendaCount + row.visitCount + row.attendanceDays,
        locationComplianceRate: row.locationChecks
          ? (row.compliantLocationChecks / row.locationChecks) * 100
          : 0,
        productivityScore:
          row.agendaDone * 2 +
          row.visitDone * 2 +
          (row.agendaCount - row.agendaDone) +
          (row.visitCount - row.visitDone) +
          row.attendanceDays +
          row.onTimeCount,
      }))
      .sort((a, b) => {
        if (b.productivityScore !== a.productivityScore) {
          return b.productivityScore - a.productivityScore;
        }
        if (b.totalPerformanceRecords !== a.totalPerformanceRecords) {
          return b.totalPerformanceRecords - a.totalPerformanceRecords;
        }
        if (b.totalItems !== a.totalItems) return b.totalItems - a.totalItems;
        if (b.attendanceDays !== a.attendanceDays) return b.attendanceDays - a.attendanceDays;
        if (b.agendaDurationSeconds !== a.agendaDurationSeconds) {
          return b.agendaDurationSeconds - a.agendaDurationSeconds;
        }
        return String(a.user?.nama || "").localeCompare(String(b.user?.nama || ""));
      });
  }, [filteredAbsensiItems, filteredAgendaItems, filteredKunjunganItems, usersById]);

  const topProjects = useMemo(() => {
    return summarizeItemsByKey(
      filteredAgendaItems,
      (item) => item.projectName,
      (item) => item.projectName,
      (item) => item.durationSeconds
    ).slice(0, 5);
  }, [filteredAgendaItems]);

  const topVisitCategories = useMemo(() => {
    return summarizeItemsByKey(
      filteredKunjunganItems,
      (item) => item.categoryName,
      (item) => item.categoryName,
      (item) => item.durationSeconds
    ).slice(0, 5);
  }, [filteredKunjunganItems]);

  const outstandingAgenda = useMemo(() => {
    return filteredAgendaItems
      .filter((item) => item.status !== "selesai")
      .slice()
      .sort((a, b) => {
        const priority = { diproses: 0, ditunda: 1, teragenda: 2 };
        const left = priority[a.status] ?? 9;
        const right = priority[b.status] ?? 9;
        if (left !== right) return left - right;
        return new Date(a.startedAt || a.endedAt || 0).getTime() - new Date(b.startedAt || b.endedAt || 0).getTime();
      });
  }, [filteredAgendaItems]);

  const activeVisits = useMemo(() => {
    return filteredKunjunganItems
      .filter((item) => item.status !== "selesai")
      .slice()
      .sort((a, b) => new Date(a.startedAt || a.endedAt || 0).getTime() - new Date(b.startedAt || b.endedAt || 0).getTime());
  }, [filteredKunjunganItems]);

  const completedHighlights = useMemo(() => {
    return combinedFeed.filter((item) => item.status === "selesai").slice(0, 6);
  }, [combinedFeed]);

  const weeklyKpiRows = useMemo(() => {
    const rows = [];

    for (const plan of kpiPlans) {
      const userItems = combinedFeed.filter((item) => {
        if (item.userId !== plan.userId) return false;
        const itemYear = dayjs(item.dateKey || item.startedAt || item.endedAt).year();
        return itemYear === plan.tahun;
      });

      const weeksInYear = countFridayWeeksInYear(plan.tahun);

      for (const item of plan.items) {
        if (!item.namaKpi) continue;

        const targetTahunan = Number(item.targetTahunan || 0);
        const weeklyTargetRaw = targetTahunan > 0 ? targetTahunan / weeksInYear : 0;
        const weeklyTarget = weeklyTargetRaw > 0 ? Math.ceil(weeklyTargetRaw) : 0;
        const metricSource = resolveKpiMetricSource(item.namaKpi, item.satuan);

        let matchedItems = [];
        let actualWeekly = 0;
        let completedWeekly = 0;
        let detailEntries = [];

        if (metricSource === "revenue") {
          matchedItems = filteredRevenueItems;
          actualWeekly = filteredRevenueItems.reduce(
            (sum, entry) => sum + Number(entry?.revenue || 0),
            0
          );
          completedWeekly = actualWeekly;
          detailEntries = filteredRevenueItems.slice(0, 3).map((entry) => ({
            label: `${entry.productName || "Produk"} • ${formatCurrency(entry.revenue)}`,
            href: null,
          }));
        } else if (metricSource === "lead") {
          matchedItems = studentByConsultantRows;
          actualWeekly = Number(studentByConsultantSummary.total || studentByConsultantRows.length || 0);
          completedWeekly = actualWeekly;
          detailEntries = studentByConsultantRows.slice(0, 3).map((entry) => ({
            label:
              entry.nama && entry.nama !== "Tanpa Nama"
                ? entry.nama
                : entry.consultantName || selectedUserMeta?.nama || "Consultant API",
            href: null,
          }));
        } else {
          matchedItems = userItems.filter((entry) => isKpiMatchedByItem(item.namaKpi, entry));
          actualWeekly = matchedItems.length;
          completedWeekly = matchedItems.filter((entry) => entry.status === "selesai").length;
          detailEntries = matchedItems.slice(0, 3).map((entry) => ({
            label: entry.title || entry.projectName || entry.categoryName || "-",
            href: `#${getActivityAnchorId(entry.source, entry.id)}`,
          }));
        }

        if (detailEntries.length === 0 && actualWeekly > 0) {
          if (metricSource === "revenue") {
            detailEntries = [{ label: `Total revenue consultant ${formatCurrency(actualWeekly)}`, href: null }];
          } else if (metricSource === "lead") {
            detailEntries = [{ label: `${formatNumber(actualWeekly)} data dari consultant API`, href: null }];
          }
        }

        rows.push({
          key: `${plan.id}:${item.id || item.namaKpi}`,
          planId: plan.id,
          userId: plan.userId,
          userName: plan.namaKaryawan || usersById.get(plan.userId)?.nama || "-",
          userJabatan: plan.namaJabatan || usersById.get(plan.userId)?.jabatan || "-",
          tahun: plan.tahun,
          namaKpi: item.namaKpi,
          satuan: item.satuan || "item",
          targetTahunan,
          weeksInYear,
          weeklyTargetRaw,
          weeklyTarget,
          metricSource,
          actualWeekly,
          completedWeekly,
          achievementRate: weeklyTarget > 0 ? (actualWeekly / weeklyTarget) * 100 : 0,
          remainingToWeeklyTarget: Math.max(weeklyTarget - actualWeekly, 0),
          matchedItems,
          detailEntries,
          matchedLabels: detailEntries.map((entry) => entry.label),
        });
      }
    }

    return rows.sort((a, b) => {
      if (b.actualWeekly !== a.actualWeekly) return b.actualWeekly - a.actualWeekly;
      if (b.achievementRate !== a.achievementRate) return b.achievementRate - a.achievementRate;
      if (b.weeklyTarget !== a.weeklyTarget) return b.weeklyTarget - a.weeklyTarget;
      if (a.userName !== b.userName) return a.userName.localeCompare(b.userName);
      return a.namaKpi.localeCompare(b.namaKpi);
    });
  }, [
    combinedFeed,
    filteredRevenueItems,
    kpiPlans,
    selectedUserMeta?.nama,
    studentByConsultantRows,
    studentByConsultantSummary.total,
    usersById,
  ]);

  const kpiSummary = useMemo(() => {
    const totalWeeklyTarget = weeklyKpiRows.reduce((sum, row) => sum + row.weeklyTarget, 0);
    const totalActual = weeklyKpiRows.reduce((sum, row) => sum + row.actualWeekly, 0);
    const totalCompleted = weeklyKpiRows.reduce((sum, row) => sum + row.completedWeekly, 0);
    const matchedKpiCount = weeklyKpiRows.filter((row) => row.actualWeekly > 0).length;
    const achievedKpiCount = weeklyKpiRows.filter(
      (row) => row.weeklyTarget > 0 && row.actualWeekly >= row.weeklyTarget
    ).length;

    return {
      totalKpiItems: weeklyKpiRows.length,
      matchedKpiCount,
      achievedKpiCount,
      totalWeeklyTarget,
      totalActual,
      totalCompleted,
      achievementRate: totalWeeklyTarget > 0 ? (totalActual / totalWeeklyTarget) * 100 : 0,
    };
  }, [weeklyKpiRows]);

  const kpiChartByEmployee = useMemo(() => {
    const map = new Map();

    for (const row of weeklyKpiRows) {
      const key = row.userId || row.userName;
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: row.userName || "-",
          target: 0,
          actual: 0,
          completed: 0,
          progress: 0,
        });
      }

      const entry = map.get(key);
      entry.target += Number(row.weeklyTarget || 0);
      entry.actual += Number(row.actualWeekly || 0);
      entry.completed += Number(row.completedWeekly || 0);
    }

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        progress: item.target > 0 ? (item.actual / item.target) * 100 : 0,
      }))
      .sort((a, b) => {
        if (b.actual !== a.actual) return b.actual - a.actual;
        if (b.progress !== a.progress) return b.progress - a.progress;
        return a.label.localeCompare(b.label);
      })
      .slice(0, 8);
  }, [weeklyKpiRows]);

  const kpiChartByItem = useMemo(() => {
    return weeklyKpiRows
      .map((row) => ({
        key: row.key,
        label: `${row.userName} - ${row.namaKpi}`,
        shortLabel: row.namaKpi,
        target: Number(row.weeklyTarget || 0),
        actual: Number(row.actualWeekly || 0),
        progress: Number(row.achievementRate || 0),
      }))
      .sort((a, b) => {
        if (b.progress !== a.progress) return b.progress - a.progress;
        if (b.actual !== a.actual) return b.actual - a.actual;
        return a.label.localeCompare(b.label);
      })
      .slice(0, 10);
  }, [weeklyKpiRows]);

  const kpiProgressDonutData = useMemo(() => {
    const achieved = Math.min(kpiSummary.totalActual, kpiSummary.totalWeeklyTarget);
    const remaining = Math.max(kpiSummary.totalWeeklyTarget - kpiSummary.totalActual, 0);
    const exceeded = Math.max(kpiSummary.totalActual - kpiSummary.totalWeeklyTarget, 0);

    return [
      { key: "actual", name: "Aktual", value: achieved },
      { key: "remaining", name: "Sisa Target", value: remaining },
      { key: "exceeded", name: "Melebihi Target", value: exceeded },
    ].filter((item) => item.value > 0);
  }, [kpiSummary]);

  const kpiExecutionDonutData = useMemo(() => {
    const completed = kpiSummary.totalCompleted;
    const inProgress = Math.max(kpiSummary.totalActual - kpiSummary.totalCompleted, 0);
    const remaining = Math.max(kpiSummary.totalWeeklyTarget - kpiSummary.totalActual, 0);

    return [
      { key: "completed", name: "Selesai", value: completed },
      { key: "in-progress", name: "Belum Selesai", value: inProgress },
      { key: "remaining", name: "Sisa Target", value: remaining },
    ].filter((item) => item.value > 0);
  }, [kpiSummary]);

  const kpiHasCompletionDelta = useMemo(
    () => weeklyKpiRows.some((row) => row.actualWeekly !== row.completedWeekly),
    [weeklyKpiRows]
  );

  const showKpiExecutionChart = useMemo(() => {
    if (!kpiHasCompletionDelta) return false;
    return kpiExecutionDonutData.length > 1;
  }, [kpiExecutionDonutData, kpiHasCompletionDelta]);

  const detailedInsights = useMemo(() => {
    const busiestDay =
      timelineDays
        .slice()
        .sort((a, b) => {
          if (b.totalItems !== a.totalItems) return b.totalItems - a.totalItems;
          return b.agendaDurationSeconds - a.agendaDurationSeconds;
        })[0] || null;

    const topEmployee = employeeRows[0] || null;

    return {
      busiestDay,
      topEmployee,
      totalDurationSeconds: summary.agendaDurationSeconds + summary.visitDurationSeconds,
      avgAgendaDurationSeconds: summary.agendaCount ? summary.agendaDurationSeconds / summary.agendaCount : 0,
      avgVisitDurationSeconds: summary.visitCount ? summary.visitDurationSeconds / summary.visitCount : 0,
      avgBreakDurationSeconds: attendanceSummary.breakSessions
        ? attendanceSummary.totalBreakSeconds / attendanceSummary.breakSessions
        : 0,
    };
  }, [attendanceSummary, employeeRows, summary, timelineDays]);

  const dailyEmployeeMatrix = useMemo(() => {
    const dayKeys = timelineDays.map((day) => day.dateKey);
    return employeeRows.map((row) => ({
      ...row,
      dayValues: dayKeys.map((dayKey) => ({
        dateKey: dayKey,
        count: row.days?.[dayKey] || 0,
      })),
    }));
  }, [employeeRows, timelineDays]);

  const reportText = useMemo(() => {
    const hasPerformanceData =
      summary.agendaCount > 0 ||
      summary.visitCount > 0 ||
      attendanceSummary.presentDays > 0 ||
      freelanceWeeklySummary.total_forms > 0;

    if (!hasPerformanceData) {
      return `Belum ada data agenda kerja, kunjungan klien, absensi, atau freelance yang tercatat pada minggu ${week.label}.`;
    }

    const topEmployee = detailedInsights.topEmployee;
    const busiestDay = detailedInsights.busiestDay;
    const parts = [`Periode ${week.label} melibatkan ${summary.activeUserCount} karyawan.`];

    if (summary.totalTrackedItems > 0) {
      parts.push(
        `Total aktivitas operasional terdata ${summary.totalTrackedItems} item dengan tingkat penyelesaian ${formatPercent(summary.completionRate)}.`
      );
      parts.push(
        `Terdapat ${summary.agendaCount} item timesheet dan agenda kerja dengan total durasi ${formatDuration(summary.agendaDurationSeconds)}.`
      );
      parts.push(
        `${summary.agendaDone} selesai, ${summary.agendaInProgress} diproses, ${summary.agendaPlanned} teragenda, dan ${summary.agendaPaused} ditunda.`
      );
      parts.push(
        `Kunjungan klien berjumlah ${summary.visitCount} item; ${summary.visitDone} selesai, ${summary.visitRunning} berlangsung, ${summary.visitPlanned} teragenda, dan ${summary.visitCanceled} batal.`
      );
    }

    if (kpiSummary.totalKpiItems > 0) {
      parts.push(
        `Target KPI tahunan diterjemahkan menjadi target mingguan dengan formula target tahunan dibagi jumlah minggu laporan Jumat-Kamis dalam tahun berjalan lalu dibulatkan ke atas. Pada minggu ini target ideal mencapai ${formatNumber(kpiSummary.totalWeeklyTarget)} dan realisasi yang match ke KPI mencapai ${formatNumber(kpiSummary.totalActual)} atau ${formatPercent(kpiSummary.achievementRate)}.`
      );
    }

    if (attendanceSummary.presentDays > 0) {
      parts.push(
        `Absensi mencatat ${attendanceSummary.presentDays} hari hadir dengan tingkat ketepatan check-in ${formatPercent(attendanceSummary.onTimeRate)} dan kepatuhan lokasi ${formatPercent(attendanceSummary.locationComplianceRate)}.`
      );
    }

    if (freelanceWeeklySummary.total_forms > 0) {
      parts.push(
        `Laporan freelance minggu ini terdiri dari ${freelanceWeeklySummary.total_forms} form dari ${freelanceWeeklySummary.total_freelance} freelance yang terdistribusi ke ${freelanceWeeklySummary.total_supervisors} supervisor.`
      );
    }

    if (leadsByConsultantSummary.total > 0 && selectedUserMeta?.nama) {
      parts.push(
        `Lead consultant untuk ${selectedUserMeta.nama} berjumlah ${leadsByConsultantSummary.total} data dengan ${leadsByConsultantSummary.countryCount} negara tujuan teridentifikasi.`
      );
    }

    if (revenueSummary.totalRevenue > 0) {
      parts.push(
        `Revenue terhubung untuk periode ini mencapai ${formatCurrency(revenueSummary.totalRevenue)} dari ${revenueSummary.transactionCount} transaksi pada ${revenueSummary.productCount} produk.`
      );
    }

    if (attendanceSummary.breakSessions > 0) {
      parts.push(
        `Istirahat tercatat ${attendanceSummary.breakSessions} sesi dengan total durasi ${formatDuration(attendanceSummary.totalBreakSeconds)} dan rata-rata ${formatDuration(attendanceSummary.averageBreakSeconds)} per sesi.`
      );
    }

    if (topEmployee?.user?.nama) {
      parts.push(
        `Kontributor paling aktif adalah ${topEmployee.user.nama} dengan ${topEmployee.totalPerformanceRecords} rekaman kerja gabungan.`
      );
    }

    if (busiestDay?.dateLabel) {
      parts.push(
        `Hari terpadat terjadi pada ${busiestDay.dayLabel}, ${busiestDay.dateLabel} dengan ${busiestDay.totalItems} item aktivitas.`
      );
    }

    return parts.join(" ");
  }, [attendanceSummary, detailedInsights, freelanceWeeklySummary, kpiSummary, leadsByConsultantSummary, revenueSummary, selectedUserMeta, summary, week.label]);

  const narrativeBlocks = useMemo(() => {
    const hasPerformanceData =
      summary.totalTrackedItems > 0 ||
      attendanceSummary.presentDays > 0 ||
      freelanceWeeklySummary.total_forms > 0;

    if (!hasPerformanceData) {
      return [];
    }

    const blocks = [];

    if (summary.totalTrackedItems > 0) {
      blocks.push({
        title: "Produktivitas",
        text: `Tim menyelesaikan ${summary.completedTrackedItems} dari ${summary.totalTrackedItems} aktivitas minggu ini. Completion rate gabungan berada di ${formatPercent(summary.completionRate)} dengan rata-rata durasi timesheet ${formatDuration(detailedInsights.avgAgendaDurationSeconds)} per item.`,
      });
    }

    if (kpiSummary.totalKpiItems > 0) {
      blocks.push({
        title: "KPI Mingguan",
        text: `${kpiSummary.totalKpiItems} KPI aktif diterjemahkan ke target mingguan total ${formatNumber(kpiSummary.totalWeeklyTarget)} dengan pembulatan ke atas. Minggu ini ${kpiSummary.matchedKpiCount} KPI mendapat aktivitas yang match, dengan realisasi ${formatNumber(kpiSummary.totalActual)} atau ${formatPercent(kpiSummary.achievementRate)} terhadap target mingguan.`,
      });
    }

    if (topProjects[0]) {
      blocks.push({
        title: "Agenda Dominan",
        text: `Proyek/agenda paling aktif adalah ${topProjects[0].label} dengan ${topProjects[0].total} item dan durasi tercatat ${formatDuration(topProjects[0].durationSeconds)}.`,
      });
    }

    if (topVisitCategories[0]) {
      blocks.push({
        title: "Kunjungan Dominan",
        text: `Kategori kunjungan paling sering muncul adalah ${topVisitCategories[0].label} dengan ${topVisitCategories[0].total} kunjungan. Tingkat penyelesaian kunjungan minggu ini berada di ${formatPercent(summary.visitCompletionRate)}.`,
      });
    }

    if (outstandingAgenda[0] || activeVisits[0]) {
      blocks.push({
        title: "Perlu Tindak Lanjut",
        text: `${outstandingAgenda.length} agenda kerja dan ${activeVisits.length} kunjungan masih memerlukan follow up. Prioritas utama sebaiknya diarahkan ke item yang berstatus diproses atau berlangsung terlebih dahulu.`,
      });
    }

    if (attendanceSummary.presentDays > 0) {
      blocks.push({
        title: "Kehadiran",
        text: `${attendanceSummary.presentDays} hari hadir tercatat dengan ${attendanceSummary.onTimeCount} check-in tepat waktu dan ${attendanceSummary.lateCount} keterlambatan. Checkout tercatat pada ${attendanceSummary.checkedOutCount} hari dengan kepatuhan lokasi ${formatPercent(attendanceSummary.locationComplianceRate)}.`,
      });
    }

    if (attendanceSummary.breakSessions > 0) {
      blocks.push({
        title: "Istirahat",
        text: `Total istirahat minggu ini mencapai ${attendanceSummary.breakSessions} sesi dengan durasi ${formatDuration(attendanceSummary.totalBreakSeconds)}. Ada ${attendanceSummary.overBreakCount} hari yang melewati ambang 60 menit.`,
      });
    }

    if (freelanceWeeklySummary.total_forms > 0) {
      blocks.push({
        title: "Freelance",
        text: `${freelanceWeeklySummary.total_forms} form freelance masuk pada minggu ini, terdiri dari ${freelanceWeeklySummary.full_day} full day dan ${freelanceWeeklySummary.half_day} half day. Status approval saat ini: ${freelanceWeeklySummary.disetujui} disetujui, ${freelanceWeeklySummary.pending} pending, ${freelanceWeeklySummary.ditolak} ditolak.`,
      });
    }

    if (leadsByConsultantSummary.total > 0 && selectedUserMeta?.nama) {
      blocks.push({
        title: "Leads Consultant",
        text: `${selectedUserMeta.nama} memiliki ${leadsByConsultantSummary.total} lead pada integrasi consultant lead, dengan ${leadsByConsultantSummary.countryCount} negara tujuan dan status dominan ${leadsByConsultantSummary.statusBreakdown[0]?.label || "baru"}.`,
      });
    }

    if (revenueSummary.totalRevenue > 0) {
      blocks.push({
        title: "Revenue",
        text: `Revenue minggu ini mencapai ${formatCurrency(revenueSummary.totalRevenue)} dari ${revenueSummary.transactionCount} transaksi. Produk yang terjual mencakup ${revenueSummary.productCount} jenis dengan rata-rata ${formatCurrency(revenueSummary.averageRevenue)} per transaksi.`,
      });
    }

    return blocks;
  }, [
    activeVisits,
    attendanceSummary,
    detailedInsights.avgAgendaDurationSeconds,
    kpiSummary,
    outstandingAgenda,
    freelanceWeeklySummary,
    leadsByConsultantSummary,
    revenueSummary,
    selectedUserMeta,
    summary,
    topProjects,
    topVisitCategories,
  ]);

  const loading =
    usersSwr.isLoading ||
    agendaSwr.isLoading ||
    kunjunganSwr.isLoading ||
    absensiSwr.isLoading ||
    revenueSwr.isLoading;

  const error =
    usersSwr.error ||
    agendaSwr.error ||
    kunjunganSwr.error ||
    absensiSwr.error ||
    null;

  const refresh = useCallback(async () => {
    await Promise.all([
      usersSwr.mutate(),
      agendaSwr.mutate(),
      kunjunganSwr.mutate(),
      absensiSwr.mutate(),
      revenueSwr.mutate(),
      freelanceWeeklySwr.mutate(),
      leadsByConsultantSwr?.mutate?.(),
      studentByConsultantSwr?.mutate?.(),
      kpiPlansSwr.mutate(),
    ]);
  }, [absensiSwr, agendaSwr, freelanceWeeklySwr, kpiPlansSwr, kunjunganSwr, leadsByConsultantSwr, revenueSwr, studentByConsultantSwr, usersSwr]);

  const hasAnyData =
    combinedFeed.length > 0 ||
    filteredAbsensiItems.length > 0;

  return {
    week,
    weekStart,
    setWeekStart,
    selectedUserId,
    setSelectedUserId,
    selectedUserMeta,
    loading,
    error,
    refresh,
    karyawanOptions,
    agendaItems: filteredAgendaItems,
    kunjunganItems: filteredKunjunganItems,
    absensiItems: filteredAbsensiItems,
    combinedFeed,
    summary,
    attendanceSummary,
    revenueItems: filteredRevenueItems,
    revenueSummary,
    revenueByProduct,
    freelanceWeeklyLoading: freelanceWeeklySwr.isLoading,
    freelanceWeeklyError: freelanceWeeklySwr.error || null,
    freelanceWeeklySummary,
    freelanceSupervisorRows,
    leadsByConsultantLoading: leadsByConsultantSwr?.isLoading || false,
    leadsByConsultantError: leadsByConsultantSwr?.error || null,
    leadsByConsultantSummary,
    leadsByConsultantMeta,
    leadsByConsultantRows,
    kpiLoading: kpiPlansSwr.isLoading,
    kpiError: kpiPlansSwr.error || null,
    weeklyKpiRows,
    kpiSummary,
    kpiChartByEmployee,
    kpiChartByItem,
    kpiProgressDonutData,
    kpiExecutionDonutData,
    kpiHasCompletionDelta,
    showKpiExecutionChart,
    timelineDays,
    employeeRows,
    topProjects,
    topVisitCategories,
    outstandingAgenda,
    activeVisits,
    completedHighlights,
    detailedInsights,
    dailyEmployeeMatrix,
    reportText,
    narrativeBlocks,
    isEmpty: !loading && !hasAnyData,
    formatDateTime,
    formatDuration,
    formatPercent,
    formatNumber,
    formatCurrency,
  };
}
