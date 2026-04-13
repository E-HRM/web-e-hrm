export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dayjs from "dayjs";
import db from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";
import { authenticateRequest } from "@/app/utils/auth/authUtils";

function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

async function ensureAuth(request) {
  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    try {
      const payload = verifyAuthToken(auth.slice(7));
      return {
        actor: {
          id: payload?.sub || payload?.id_user || payload?.userId || null,
          role: payload?.role || null,
          source: "bearer",
        },
      };
    } catch (_) {}
  }

  const sessionOrResponse = await authenticateRequest();
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;

  return {
    actor: {
      id: sessionOrResponse?.user?.id || null,
      role: sessionOrResponse?.user?.role || null,
      source: "session",
    },
  };
}

function canRead(actor) {
  return ["HR", "DIREKTUR", "OPERASIONAL", "SUPERADMIN", "SUPERVISOR"].includes(normalizeRole(actor?.role));
}

function normalizeTodoItems(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch (_) {}

    return trimmed
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function buildEmptySummary() {
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

function accumulateSummary(summary, item) {
  summary.total_forms += 1;
  if (item?.status_hari_kerja === "FULL_DAY") summary.full_day += 1;
  if (item?.status_hari_kerja === "HALF_DAY") summary.half_day += 1;

  const decision = String(item?.decision || "pending").toLowerCase();
  if (decision === "disetujui") summary.disetujui += 1;
  else if (decision === "ditolak") summary.ditolak += 1;
  else summary.pending += 1;
}

function serializeEntry(record) {
  const todoItems = normalizeTodoItems(record?.todo_list);
  return {
    id_form_freelance: record?.id_form_freelance,
    tanggal_kerja: record?.tanggal_kerja,
    status_hari_kerja: record?.status_hari_kerja,
    decision: record?.decision || "pending",
    note: record?.note || null,
    decided_at: record?.decided_at || null,
    created_at: record?.created_at || null,
    updated_at: record?.updated_at || null,
    todo_items: todoItems,
    total_todo_items: todoItems.length,
  };
}

export async function GET(request) {
  const authResult = await ensureAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  if (!canRead(authResult.actor)) {
    return NextResponse.json(
      { message: "Forbidden: tidak memiliki akses melihat laporan freelance mingguan." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const from = String(searchParams.get("from") || "").trim();
    const to = String(searchParams.get("to") || "").trim();

    if (!from || !to) {
      return NextResponse.json({ message: "Query from dan to wajib diisi." }, { status: 400 });
    }

    const fromDate = dayjs(from).startOf("day");
    const toDate = dayjs(to).endOf("day");
    if (!fromDate.isValid() || !toDate.isValid()) {
      return NextResponse.json({ message: "Format tanggal from/to tidak valid." }, { status: 400 });
    }

    const rows = await db.formFreelance.findMany({
      where: {
        deleted_at: null,
        tanggal_kerja: {
          gte: fromDate.toDate(),
          lte: toDate.toDate(),
        },
        freelance: {
          deleted_at: null,
        },
      },
      orderBy: [{ tanggal_kerja: "desc" }, { updated_at: "desc" }],
      select: {
        id_form_freelance: true,
        tanggal_kerja: true,
        status_hari_kerja: true,
        todo_list: true,
        decision: true,
        note: true,
        decided_at: true,
        created_at: true,
        updated_at: true,
        freelance: {
          select: {
            id_freelance: true,
            nama: true,
            email: true,
            kontak: true,
            id_supervisor: true,
            supervisor: {
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

    const groups = new Map();
    const summary = buildEmptySummary();
    const freelanceSet = new Set();

    for (const row of rows) {
      const supervisor = row?.freelance?.supervisor || null;
      const groupKey = supervisor?.id_user || "tanpa-supervisor";
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          supervisor: supervisor
            ? {
                id_user: supervisor.id_user,
                nama_pengguna: supervisor.nama_pengguna,
                email: supervisor.email,
              }
            : {
                id_user: null,
                nama_pengguna: "Tanpa Supervisor",
                email: null,
              },
          summary: {
            total_freelance: 0,
            total_forms: 0,
            full_day: 0,
            half_day: 0,
            pending: 0,
            disetujui: 0,
            ditolak: 0,
          },
          freelancersMap: new Map(),
        });
      }

      const group = groups.get(groupKey);
      const freelance = row.freelance;
      const freelanceKey = freelance.id_freelance;
      if (!group.freelancersMap.has(freelanceKey)) {
        group.freelancersMap.set(freelanceKey, {
          id_freelance: freelance.id_freelance,
          nama: freelance.nama,
          email: freelance.email,
          kontak: freelance.kontak,
          summary: {
            total_forms: 0,
            full_day: 0,
            half_day: 0,
            pending: 0,
            disetujui: 0,
            ditolak: 0,
          },
          entries: [],
        });
        group.summary.total_freelance += 1;
        freelanceSet.add(freelanceKey);
      }

      const entry = serializeEntry(row);
      const freelanceRow = group.freelancersMap.get(freelanceKey);
      freelanceRow.entries.push(entry);
      accumulateSummary(freelanceRow.summary, entry);
      accumulateSummary(group.summary, entry);
      accumulateSummary(summary, entry);
    }

    const supervisors = Array.from(groups.values())
      .map((group) => ({
        key: group.key,
        supervisor: group.supervisor,
        summary: group.summary,
        freelancers: Array.from(group.freelancersMap.values())
          .map((freelance) => ({
            ...freelance,
            entries: freelance.entries.sort((a, b) => {
              const left = new Date(a.tanggal_kerja || a.created_at || 0).getTime();
              const right = new Date(b.tanggal_kerja || b.created_at || 0).getTime();
              return right - left;
            }),
          }))
          .sort((a, b) => {
            if (b.summary.total_forms !== a.summary.total_forms) {
              return b.summary.total_forms - a.summary.total_forms;
            }
            return String(a.nama || "").localeCompare(String(b.nama || ""));
          }),
      }))
      .sort((a, b) => {
        if (b.summary.total_forms !== a.summary.total_forms) {
          return b.summary.total_forms - a.summary.total_forms;
        }
        return String(a.supervisor?.nama_pengguna || "").localeCompare(
          String(b.supervisor?.nama_pengguna || "")
        );
      });

    summary.total_supervisors = supervisors.length;
    summary.total_freelance = freelanceSet.size;

    return NextResponse.json({
      range: {
        from: fromDate.format("YYYY-MM-DD"),
        to: toDate.format("YYYY-MM-DD"),
      },
      summary,
      supervisors,
    });
  } catch (error) {
    console.error("GET /api/admin/reports/freelance-weekly error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil laporan freelance mingguan." },
      { status: 500 }
    );
  }
}
