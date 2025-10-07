// middleware.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Hanya role ini yang boleh masuk area /home
const ALLOWED_ROLES = new Set(["HR", "DIREKTUR", "OPERASIONAL"]);

// Prefix yang boleh untuk OPERASIONAL
const OPS_PREFIX_ALLOW = [
  "/home/dashboard2", // dashboard operasional
  "/home/kunjungan",  // + semua sub-route
  "/home/agenda",     // SELURUH folder agenda/*
];

function pathAllowedForOps(pathname) {
  return OPS_PREFIX_ALLOW.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

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

  // Non-OPERASIONAL dilarang ke /home/dashboard2
  if (
    role !== "OPERASIONAL" &&
    (pathname === "/home/dashboard2" || pathname.startsWith("/home/dashboard2/"))
  ) {
    return NextResponse.redirect(new URL("/home/dashboard", req.url));
  }

  // OPERASIONAL yang masuk ke /home/dashboard (HR) → paksa ke /home/dashboard2
  if (
    role === "OPERASIONAL" &&
    (pathname === "/home/dashboard" || pathname.startsWith("/home/dashboard/"))
  ) {
    return NextResponse.redirect(new URL("/home/dashboard2", req.url));
  }

  // Gate prefix untuk OPERASIONAL
  if (role === "OPERASIONAL" && !pathAllowedForOps(pathname)) {
    return NextResponse.redirect(new URL("/home/dashboard2", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*"],
};
