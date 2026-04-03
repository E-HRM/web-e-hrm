import { NextResponse } from "next/server";
import { authenticateRequest } from "@/app/utils/auth/authUtils";
import db from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

async function ensureAuth(req) {
  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    try {
      return { claims: verifyAuthToken(auth.slice(7)) };
    } catch {}
  }
  const sessionOrRes = await authenticateRequest();
  if (sessionOrRes instanceof NextResponse) return sessionOrRes;
  return { session: sessionOrRes };
}

function resolveRole(auth) {
  return String(
    auth?.claims?.role ||
      auth?.session?.user?.role ||
      ""
  )
    .trim()
    .toUpperCase();
}

export async function GET(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const role = resolveRole(auth);
  if (!["HR", "DIREKTUR", "OPERASIONAL", "SUPERADMIN"].includes(role)) {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const from = (searchParams.get("from") || "").trim();
    const to = (searchParams.get("to") || "").trim();
    const userId = (searchParams.get("userId") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(1000, Math.max(1, parseInt(searchParams.get("pageSize") || searchParams.get("perPage") || "200", 10)));

    const start = from ? new Date(`${from}T00:00:00`) : null;
    const endExclusive = to ? new Date(new Date(`${to}T00:00:00`).getTime() + 24 * 60 * 60 * 1000) : null;

    const where = {
      deleted_at: null,
      ...(userId ? { id_user: userId } : {}),
      ...(start || endExclusive
        ? {
            tanggal: {
              ...(start ? { gte: start } : {}),
              ...(endExclusive ? { lt: endExclusive } : {}),
            },
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      db.lembur.count({ where }),
      db.lembur.findMany({
        where,
        orderBy: [{ tanggal: "desc" }, { jam_mulai: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id_user: true,
              nama_pengguna: true,
              email: true,
              role: true,
              foto_profil_user: true,
              jabatan: { select: { id_jabatan: true, nama_jabatan: true } },
              departement: { select: { id_departement: true, nama_departement: true } },
            },
          },
          approvals: {
            where: { deleted_at: null },
            orderBy: [{ level: "asc" }],
            select: {
              id_lembur_approval: true,
              level: true,
              approver_user_id: true,
              approver_role: true,
              decision: true,
              decided_at: true,
              note: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      data: items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        from: from || null,
        to: to || null,
      },
    });
  } catch (error) {
    console.error("lembur list error:", error);
    return NextResponse.json({ ok: false, message: "Terjadi kesalahan ketika mengambil data lembur." }, { status: 500 });
  }
}
