"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HomeOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UserOutlined,
  DownOutlined,
  AimOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

const MENU = [
  { href: "/home/dashboard", label: "Home", icon: HomeOutlined },
  { href: "/absensi-karyawan", label: "Absensi Karyawan", icon: CalendarOutlined },
  { href: "/kunjungan", label: "Kunjungan", icon: UserOutlined },
  { href: "/agenda-kerja", label: "Agenda Kerja", icon: FileTextOutlined },
  { href: "/pengajuan-cuti", label: "Pengajuan Cuti", icon: FileTextOutlined },
  { href: "/home/lokasi", label: "Lokasi", icon: EnvironmentOutlined },
  {
    href: "/karyawan",
    label: "Karyawan",
    icon: TeamOutlined,
    hasCaret: true,
    children: [
      { href: "/home/departement", label: "Data Karyawan", icon: FileTextOutlined },
      { href: "/home/shift", label: "Penjadwalan Shift", icon: CalendarOutlined },
      { href: "/karyawan/piket", label: "Jadwal Piket & Story", icon: CalendarOutlined },
      { href: "/karyawan/libur", label: "Pengajuan Hari Libur", icon: CalendarOutlined },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [openKaryawan, setOpenKaryawan] = useState(() => pathname?.startsWith("/karyawan") ?? false);
  useEffect(() => {
    setOpenKaryawan(pathname?.startsWith("/karyawan") ?? false);
  }, [pathname]);

  const isActive = (href) => {
    if (href === "/home/dashboard") return pathname?.startsWith("/");
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  
  if (!mounted) {
    return <aside className="sidebar hidden md:flex w-64 min-h-dvh flex-col bg-[#0A3848]" />;
  }

  return (
    <aside className="sidebar hidden md:flex w-64 min-h-dvh flex-col bg-[#0A3848] text-white">
      {/* Menu */}
      <nav className="flex-1 py-6">
        <ul className="space-y-2">
          {MENU.map((m) => {
            const Icon = m.icon;
            const active = isActive(m.href);

            if (m.children?.length) {
              const caretActive = openKaryawan || active;
              return (
                <li key={m.href}>
                  <button
                    type="button"
                    onClick={() => setOpenKaryawan((s) => !s)}
                    className={`sidebar-link w-full text-left ${caretActive ? "is-active" : ""}`}
                    aria-expanded={openKaryawan}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="text-inherit text-lg" />
                      <span className="leading-none">{m.label}</span>
                    </span>
                    <DownOutlined
                      className={`text-inherit transition-transform ${caretActive ? "rotate-180" : "rotate-0"}`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-[max-height] duration-200 ease-in-out ${
                      openKaryawan ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    <ul className="mt-0">
                      {m.children.map((c) => {
                        const SubIcon = c.icon;
                        const subActive = isActive(c.href);
                        return (
                          <li key={c.href}>
                            <Link
                              href={c.href}
                              className={`sidebar-sublink ${subActive ? "is-active" : ""}`}
                              aria-current={subActive ? "page" : undefined}
                            >
                              <span className="flex items-center gap-3">
                                <SubIcon className="text-inherit text-lg" />
                                <span className="leading-none">{c.label}</span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            }

            return (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className={`sidebar-link ${active ? "is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="text-inherit text-lg" />
                    <span className="leading-none">{m.label}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
