export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/jwt";
import { authenticateRequest } from "@/app/utils/auth/authUtils";

const DEFAULT_REPORT_URL = "https://faktur.onestepsolutionbali.com/api/reports/sales/weekly";

async function ensureAuth(request) {
  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    try {
      verifyAuthToken(auth.slice(7));
      return true;
    } catch (_) {}
  }

  const sessionOrResponse = await authenticateRequest();
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;
  return true;
}

function buildUrl(from, to) {
  const base = process.env.REPORT_WEEKLY_SALES_API_URL || DEFAULT_REPORT_URL;
  const url = new URL(base);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  return url.toString();
}

export async function GET(request) {
  const authResult = await ensureAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const from = String(searchParams.get("from") || "").trim();
    const to = String(searchParams.get("to") || "").trim();

    if (!from || !to) {
      return NextResponse.json(
        { message: "Query from dan to wajib diisi." },
        { status: 400 }
      );
    }

    const apiKey = String(process.env.REPORT_WEEKLY_SALES_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json(
        { message: "REPORT_WEEKLY_SALES_API_KEY belum diset di server." },
        { status: 503 }
      );
    }

    const upstream = await fetch(buildUrl(from, to), {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
    });

    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        {
          message:
            payload?.message ||
            `Gagal mengambil revenue weekly sales. Status upstream ${upstream.status}.`,
        },
        { status: upstream.status || 502 }
      );
    }

    return NextResponse.json({
      basis_day: payload?.basis_day || "Friday",
      range: payload?.range || { from, to },
      data: Array.isArray(payload?.data) ? payload.data : [],
    });
  } catch (error) {
    console.error("GET /api/admin/reports/sales-weekly error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil revenue weekly sales." },
      { status: 500 }
    );
  }
}
