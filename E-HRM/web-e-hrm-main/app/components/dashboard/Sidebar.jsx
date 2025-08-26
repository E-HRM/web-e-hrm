"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  HomeOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UserOutlined,
  DownOutlined,
} from "@ant-design/icons";

const MENU = [
  { href: "/home/dashboard", label: "Home", icon: HomeOutlined },
  { href: "/absensi-karyawan", label: "Absensi Karyawan", icon: CalendarOutlined },
  { href: "/kunjungan", label: "Kunjungan", icon: UserOutlined },
  { href: "/agenda-kerja", label: "Agenda Kerja", icon: FileTextOutlined },
  { href: "/pengajuan-cuti", label: "Pengajuan Cuti", icon: FileTextOutlined },
  { href: "/karyawan", label: "Karyawan", icon: TeamOutlined, hasCaret: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href) =>
    pathname === href || (href !== "/home/dashboard" && pathname.startsWith(href));

  return (
    <aside className="hidden md:flex w-64 min-h-dvh flex-col bg-[#0A3848] text-white">
      <div className="h-24 flex flex-col items-center justify-center gap-3 border-b border-white/10">
        <div className="relative h-12 w-12 rounded-full ring-2 ring-white/20 overflow-hidden">
          <Image
            src="/logo-oss.png"
            alt="OSS"
            fill
            className="object-contain bg-white/5"
            priority
          />
        </div>
        <p className="text-[11px] tracking-wide opacity-80">ONE STEP SOLUTION</p>
      </div>

      <nav className="flex-1 py-6">
        <ul className="space-y-2">
          {MENU.map((m) => {
            const active = isActive(m.href);
            const Icon = m.icon;
            return (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className={[
                    "mx-3 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[15px] transition-colors",
                    active
                      ? "bg-[#155163] text-white"
                      : "text-white/80 hover:bg-[#114C5C] hover:text-white",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="text-inherit text-lg" />
                    <span className="leading-none">{m.label}</span>
                  </span>

                  {m.hasCaret ? (
                    <DownOutlined
                      className={`text-inherit ${active ? "opacity-100" : "opacity-70"}`}
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <footer className="px-5 py-4 text-xs text-white/60">
        OSS © {new Date().getFullYear()}
      </footer>
    </aside>
  );
}
