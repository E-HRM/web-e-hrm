// app/api/notifications/recent/route.js

import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";
import { authenticateRequest } from "@/app/utils/auth/authUtils";

// Ambil userId dari Bearer token (mobile) atau session (web)
async function resolveUserId(request) {
  const authHeader = request.headers.get("authorization") || "";

  // 1) Bearer token
  if (authHeader.startsWith("Bearer ")) {
    const rawToken = authHeader.slice(7).trim();
    try {
      const payload = verifyAuthToken(rawToken);
      const userId =
        payload?.id_user ||
        payload?.sub ||
        payload?.userId ||
        payload?.id ||
        payload?.user_id;

      if (userId) {
        return { userId, source: "bearer" };
      }
    } catch (error) {
      console.warn(
        "Invalid bearer token for /api/notifications/recent:",
        error
      );
    }
  }

  // 2) Fallback: session (NextAuth / custom)
  const sessionOrResponse = await authenticateRequest();
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  const sessionUserId =
    sessionOrResponse?.user?.id || sessionOrResponse?.user?.id_user;
  if (!sessionUserId) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  return { userId: sessionUserId, source: "session", session: sessionOrResponse };
}

// GET /api/notifications/recent
export async function GET(request) {
  const authResult = await resolveUserId(request);
  if (authResult instanceof NextResponse) return authResult;

  const { userId } = authResult;

  try {
    const { searchParams } = new URL(request.url);

    // param days: default 7, min 1, max 30
    const rawDays = parseInt(searchParams.get("days") || "7", 10);
    const days = Number.isNaN(rawDays)
      ? 7
      : Math.min(Math.max(rawDays, 1), 30);

    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // param types: "pengajuan_cuti,izin_tukar_hari,..."
    const typesParam = (searchParams.get("types") || "").trim();
    const typeList = typesParam
      ? typesParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const where = {
      id_user: userId,          // notifikasi milik user/admin ini
      deleted_at: null,
      created_at: { gte: cutoff },
    };

    if (typeList.length > 0) {
      where.related_table = { in: typeList };
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 200, // limit safety
    });

    return NextResponse.json({ data: notifications });
  } catch (error) {
    console.error("Failed to fetch recent notifications:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
