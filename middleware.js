// middleware.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const CORS_ALLOWED_ORIGINS = new Set([
  "https://m-ehrm.onestepsolutionbali.com",
]);

function getAllowedOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  return CORS_ALLOWED_ORIGINS.has(origin) ? origin : null;
}

function applyCorsHeaders(res, origin) {
  if (!origin) return res;
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  return res;
}

// Hanya role ini yang boleh masuk area /home
const ALLOWED_ROLES = new Set(["HR", "DIREKTUR", "OPERASIONAL", "SUPERADMIN"]);

// Prefix yang boleh untuk OPERASIONAL
const OPS_PREFIX_ALLOW = [
  "/home/dashboard-operasional", // dashboard operasional
  "/home/kunjungan",  // + semua sub-route
  "/home/agenda",     // SELURUH folder agenda/*
];

function pathAllowedForOps(pathname) {
  return OPS_PREFIX_ALLOW.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api")) {
    const origin = getAllowedOrigin(req);

    if (req.method === "OPTIONS") {
      const res = new NextResponse(null, { status: 204 });
      return applyCorsHeaders(res, origin);
    }

    const res = NextResponse.next();
    return applyCorsHeaders(res, origin);
  }

  // Lindungi area /home
  if (!pathname.startsWith("/home")) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Belum login → ke login
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const role = token.role;

  // Role tak diizinkan → tolak
  if (!ALLOWED_ROLES.has(role)) {
    const url = new URL("/auth/login", req.url);
    url.searchParams.set("e", "forbidden");
    return NextResponse.redirect(url);
  }


  if (
    role !== "OPERASIONAL" &&
    (pathname === "/home/dashboard-operasional" || pathname.startsWith("/home/dashboard-operasional/"))
  ) {
    return NextResponse.redirect(new URL("/home/dashboard", req.url));
  }


  if (
    role === "OPERASIONAL" &&
    (pathname === "/home/dashboard" || pathname.startsWith("/home/dashboard/"))
  ) {
    return NextResponse.redirect(new URL("/home/dashboard-operasional", req.url));
  }

  // Gate prefix untuk OPERASIONAL
  if (role === "OPERASIONAL" && !pathAllowedForOps(pathname)) {
    return NextResponse.redirect(new URL("/home/dashboard-operasional", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/api/:path*"],
};
