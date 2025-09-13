"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HomeOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UserOutlined,
  DownOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

const MENU = [
  { href: "/home/dashboard", label: "Home", icon: HomeOutlined },
  { href: "/home/absensi", match: ["/home/absensi", "/absensi-karyawan"], label: "Absensi Karyawan", icon: CalendarOutlined },
  { href: "/home/kunjungan", match: ["/kunjungan", "/home/kunjungan"], label: "Kunjungan", icon: UserOutlined },
  { href: "/pengajuan-cuti", match: ["/pengajuan-cuti", "/home/pengajuan-cuti"], label: "Pengajuan Cuti", icon: FileTextOutlined },
  { href: "/home/lokasi", match: ["/home/lokasi"], label: "Lokasi", icon: EnvironmentOutlined },
  {
    key: "karyawan",
    href: "/karyawan",
    match: ["/karyawan"],
    label: "Karyawan",
    icon: TeamOutlined,
    hasCaret: true,
    children: [
      { href: "/home/departement", match: ["/home/departement"], label: "Data Karyawan" },
      { href: "/home/shift", match: ["/home/shift"], label: "Penjadwalan Shift" },
      { href: "/karyawan/piket", match: ["/karyawan/piket"], label: "Jadwal Piket & Story" },
      { href: "/karyawan/libur", match: ["/karyawan/libur"], label: "Pengajuan Hari Libur" },
    ],
  },
  {
    key: "agenda",
    href: "/home/agenda-kerja",
    match: ["/home/agenda-kerja", "/agenda-kerja"],
    label: "Agenda Kerja",
    icon: FileTextOutlined,
    hasCaret: true,
    children: [
      { href: "/home/agenda-kerja/aktivitas", match: ["/home/agenda-kerja/aktivitas", "/agenda-kerja/aktivitas"], label: "Aktivitas" },
      { href: "/home/agenda-kerja/proyek", match: ["/home/agenda-kerja/proyek", "/agenda-kerja/proyek"], label: "Proyek" },
      { href: "/home/agenda-kerja/proyek", match: ["/home/agenda-kerja/proyek", "/agenda-kerja/proyek"], label: "Agenda Kerja" },
    ],
  },
];

const LS_OPEN_SECTIONS = "oss.sidebar.openSections";

export default function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_OPEN_SECTIONS);
      if (saved) setOpenSections(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_OPEN_SECTIONS, JSON.stringify(openSections));
    } catch {}
  }, [openSections]);

  const isActive = (item) => {
    const prefixes = item.match?.length ? item.match : [item.href];
    return prefixes.some((p) => pathname === p || (pathname && pathname.startsWith(`${p}/`)));
  };
  const isExactActive = (item) => {
    const prefixes = item.match?.length ? item.match : [item.href];
    return prefixes.some((p) => pathname === p);
  };

  useEffect(() => {
    const groups = MENU.filter((m) => m.children?.length);
    let needUpdate = false;
    const next = { ...openSections };
    groups.forEach((g) => {
      const anyChildActive = g.children.some((c) => isActive(c));
      if (anyChildActive && !next[g.key]) {
        next[g.key] = true;
        needUpdate = true;
      }
    });
    if (needUpdate) setOpenSections(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const baseItem =
    "group flex items-center justify-between gap-3 mx-3 my-2 px-4 py-3 rounded-2xl text-white/80 transition w-[calc(100%-24px)] hover:!bg-[#155163] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";
  const activeItem = "!bg-[#155163] !text-white";
  const subItem =
    "group flex items-center gap-3 mx-3 mt-1 ml-7 px-3.5 py-2.5 rounded-xl text-white/85 transition hover:!bg-[#155163] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";
  const subActive = "!bg-[#155163] !text-white";
  const iconCls = "text-[18px] leading-none";
  const iconBox = "w-6 shrink-0 flex items-center justify-center"; // << fixed width untuk semua ikon/strip
  const rightSlot = "w-3 flex items-center justify-center";        // << lebar kanan konsisten

  const StripBullet = () => (
    <span aria-hidden="true" className="block w-3 h-[2px] rounded-full bg-white/70 group-hover:!bg-white" />
  );

  return (
    <aside className="flex flex-col h-full bg-[#0A3848] text-white">
      <nav className="flex-1 py-6">
        <ul className="space-y-1">
          {MENU.map((m) => {
            const Icon = m.icon;

            if (m.children?.length) {
              const key = m.key;
              const anyChildActive = m.children.some((c) => isActive(c));
              const selfExactActive = isExactActive(m);
              const highlightParent = selfExactActive && !anyChildActive;
              const opened = !!openSections[key] || anyChildActive;

              return (
                <li key={m.href}>
                  <button
                    type="button"
                    onClick={() => setOpenSections((s) => ({ ...s, [key]: !opened }))}
                    className={[baseItem, highlightParent ? activeItem : ""].join(" ")}
                    aria-expanded={opened}
                  >
                    <span className="flex items-center gap-3">
                      <span className={iconBox}>
                        <Icon className={iconCls + " group-hover:!text-white"} />
                      </span>
                      <span className="leading-none group-hover:!text-white">{m.label}</span>
                    </span>
                    <span className={rightSlot}>
                      <DownOutlined
                        className={[
                          "text-xs opacity-80 transition-transform",
                          opened ? "rotate-180 opacity-100" : "rotate-0",
                        ].join(" ")}
                      />
                    </span>
                  </button>

                  <div
                    className={[
                      "overflow-hidden transition-[max-height] duration-200 ease-in-out",
                      opened ? "max-h-96" : "max-h-0",
                    ].join(" ")}
                  >
                    <ul className="mt-0">
                      {m.children.map((c) => {
                        const active = isActive(c);
                        return (
                          <li key={c.href}>
                            <Link
                              href={c.href}
                              className={[subItem, active ? subActive : ""].join(" ")}
                              aria-current={active ? "page" : undefined}
                            >
                              <span className={iconBox}>
                                <StripBullet />
                              </span>
                              <span className="leading-none group-hover:!text-white">{c.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            }

            const active = isActive(m);
            return (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className={[baseItem, active ? activeItem : ""].join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="flex items-center gap-3">
                    <span className={iconBox}>
                      <Icon className={iconCls + " group-hover:!text-white"} />
                    </span>
                    <span className="leading-none group-hover:!text-white">{m.label}</span>
                  </span>
                  <span className={rightSlot} aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
