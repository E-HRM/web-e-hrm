// app/components/dashboard/Sidebar.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UserOutlined,
  DownOutlined,
  EnvironmentOutlined,
  FieldTimeOutlined,
  ScheduleOutlined,
  ProductOutlined,
  NotificationOutlined,
} from "@ant-design/icons";

/** ===== MENU dasar ===== */
const MENU = [
  { href: "/home/dashboard", label: "Dashboard", icon: ProductOutlined },
  { href: "/home/absensi", match: ["/home/absensi", "/absensi-karyawan"], label: "Absensi Karyawan", icon: CalendarOutlined },
  // { href: "/home/approve_absensi", match: ["/home/approve_absensi"], label: "Aprrove", icon: ScheduleOutlined },
  { href: "/home/lokasi", match: ["/home/lokasi"], label: "Lokasi", icon: EnvironmentOutlined },
  { href: "/home/pola/shift", match: ["/home/pola/shift"], label: "Pola Kerja", icon: FieldTimeOutlined },
  {
    key: "karyawan",
    href: "/karyawan",
    match: ["/karyawan"],
    label: "Kelola Karyawan",
    icon: TeamOutlined,
    hasCaret: true,
    children: [
      { href: "/home/kelola_karyawan/departement", match: ["/home/kelola_karyawan/departement"], label: "Divisi" },
      { href: "/home/kelola_karyawan/jabatan", match: ["/home/kelola_karyawan/jabatan"], label: "Jabatan" },
      { href: "/home/kelola_karyawan/karyawan", match: ["/home/kelola_karyawan/karyawan"], label: "Karyawan" },
      { href: "/home/kelola_karyawan/shift_schedule", match: ["/home/kelola_karyawan/shift_schedule"], label: "Penjadwalan Shift" },
    ],
  },
  {
    key: "kunjungan",
    href: "/home/kunjungan",
    match: ["/home/kunjungan", "/kunjungan"],
    label: "Kunjungan Klien",
    icon: UserOutlined,
    hasCaret: true,
    children: [
      { href: "/home/kunjungan/kunjungan_rekapan", match: ["/home/kunjungan/kunjungan_rekapan"], label: "Review Kunjungan" },
      { href: "/home/kunjungan/kategori_kunjungan", match: ["/home/kunjungan/kategori_kunjungan"], label: "Kategori" },
      { href: "/home/kunjungan/kunjungan_kalender", match: ["/home/kunjungan/kunjungan_kalender"], label: "Kalender" },
    ],
  },
  {
    key: "agenda",
    href: "/home/agenda-kerja",                   // parent/landing
    match: ["/home/agenda-kerja", "/agenda-kerja"],
    label: "Time Sheet",
    icon: FileTextOutlined,
    hasCaret: true,
    children: [
      { href: "/home/agenda/proyek", match: ["/home/agenda/proyek"], label: "Proyek" },
      { href: "/home/agenda/aktivitas", match: ["/home/agenda/aktivitas"], label: "Aktivitas" },
      { href: "/home/agenda/agenda_kerja", match: ["/home/agenda/agenda_kerja"], label: "Agenda Kerja" },
      { href: "/home/agenda/agenda_calendar", match: ["/home/agenda/agenda_calendar"], label: "Kalender Agenda" },
    ],
  },
  { href: "/home/broadcast", match: ["/home/broadcast"], label: "Broadcast", icon: NotificationOutlined },
];

/** ===== RBAC Sidebar ===== */
const ALLOWED_ROLES = new Set(["HR", "DIREKTUR", "OPERASIONAL"]);

// Remap satu item "Dashboard" → href per role (ikon & label tetap)
function roleAwareDashboard(menu, role) {
  return menu.map((item) => {
    if (item.label !== "Dashboard") return item;
    return role === "OPERASIONAL"
      ? { ...item, href: "/home/dashboard2", match: ["/home/dashboard2"] }
      : { ...item, href: "/home/dashboard",  match: ["/home/dashboard"]  };
  });
}

// OPERASIONAL boleh semua anak /home/agenda/* dan /home/kunjungan/*
const OPS_CHILD_PREFIX_ALLOW = ["/home/agenda/", "/home/kunjungan/"];
const OPS_PARENT_ALLOW = new Set([
  "/home/dashboard2",
  "/home/kunjungan",
  // parent agenda kita render sebagai group button; parent href tidak dipakai untuk Link
]);

function isChildAllowedForOps(href) {
  if (!href) return false;
  return OPS_CHILD_PREFIX_ALLOW.some((p) => href.startsWith(p));
}

function filterMenuForRole(menu, role) {
  if (role !== "OPERASIONAL") return menu; // HR/DIREKTUR: tampilkan semua

  return menu
    .map((it) => {
      if (it.children?.length) {
        const children = it.children.filter((c) => isChildAllowedForOps(c.href));
        const parentAllowed = OPS_PARENT_ALLOW.has(it.href);
        if (children.length || parentAllowed) return { ...it, children };
        return null;
      }
      return OPS_PARENT_ALLOW.has(it.href) ? it : null;
    })
    .filter(Boolean);
}

const LS_OPEN_SECTIONS = "oss.sidebar.openSections";
const LS_SCROLL_TOP = "oss.sidebar.scrollTop";

export default function Sidebar() {
  const pathname = usePathname();
  const scrollRef = useRef(null);
  const { data } = useSession();
  const rawRole = data?.user?.role;
  const role = ALLOWED_ROLES.has(rawRole) ? rawRole : "GUEST";

  // Remap Dashboard dulu, baru filter RBAC
  const menuRoleAware = roleAwareDashboard(MENU, role);
  const MENU_FOR_ROLE = filterMenuForRole(menuRoleAware, role);

  const [openSections, setOpenSections] = useState({});

  const isActive = (item) => {
    const prefixes = item.match?.length ? item.match : [item.href];
    return prefixes.some((p) => pathname === p || (pathname && pathname.startsWith(`${p}/`)));
  };
  const isExactActive = (item) => {
    const prefixes = item.match?.length ? item.match : [item.href];
    return prefixes.some((p) => pathname === p);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_OPEN_SECTIONS);
      if (saved) {
        setOpenSections(JSON.parse(saved));
        return;
      }
      const groups = MENU_FOR_ROLE.filter((m) => m.children?.length);
      const init = {};
      groups.forEach((g) => {
        const anyChildActive = g.children.some((c) => isActive(c));
        if (anyChildActive) init[g.key] = true;
      });
      setOpenSections(init);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_OPEN_SECTIONS, JSON.stringify(openSections));
    } catch {}
  }, [openSections]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    try {
      const saved = localStorage.getItem(LS_SCROLL_TOP);
      if (saved) el.scrollTop = parseInt(saved, 10) || 0;
    } catch {}
    const onScroll = () => {
      try {
        localStorage.setItem(LS_SCROLL_TOP, String(el.scrollTop));
      } catch {}
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // ===== tokens UI =====
  const baseItem =
    "group flex items-center justify-between gap-3 w-full px-4 py-3 rounded-lg text-white/80 transition-colors duration-200 hover:!bg-[#FFFFFF] hover:!text-[#003A6F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";
  const activeItem = "!bg-[#FFFFFF] !text-[#003A6F]";
  const subItem =
    "group flex items-center gap-3 w-full pl-10 pr-4 py-2.5 rounded-lg text-white/80 transition-colors duration-200 hover:!bg-[#FFFFFF] hover:!text-[#003A6F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";
  const subActive = "!bg-[#FFFFFF] !text-[#003A6F]";

  const iconCls = "menu-icon text-xl leading-none";
  const iconBox = "w-6 shrink-0 flex items-center justify-center";
  const rightSlot = "w-4 flex items-center justify-center";

  const StripBullet = ({ active = false }) => (
    <span
      aria-hidden="true"
      className={[
        "block w-2 h-2 rounded-full transition-colors",
        active ? "bg-[#003A6F]" : "bg-white/70",
        "group-hover:!bg-[#003A6F]",
      ].join(" ")}
    />
  );

  const toggleGroup = (key) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  return (
    <aside className="flex flex-col h-full bg-[#003A6F] text-white">
      <nav ref={scrollRef} className="flex-1 py-4 px-3 sider-scroll overflow-y-auto">
        <ul className="space-y-1">
          {MENU_FOR_ROLE.map((m) => {
            const Icon = m.icon;

            if (m.children?.length) {
              const key = m.key;
              const selfExactActive = isExactActive(m);
              const anyChildActive = m.children.some((c) => isActive(c));
              const displayOpen = (openSections[key] ?? anyChildActive) === true;
              const highlightParent = selfExactActive && !anyChildActive;

              return (
                <li key={m.href}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(key)}
                    className={[baseItem, highlightParent ? activeItem : ""].join(" ")}
                    aria-expanded={displayOpen}
                    aria-controls={`submenu-${key}`}
                  >
                    <span className="flex items-center gap-4">
                      <span className={iconBox}>
                        <Icon className={iconCls} />
                      </span>
                      <span className="leading-none transition-colors font-semibold">{m.label}</span>
                    </span>
                    <span className={rightSlot}>
                      <DownOutlined
                        className={[
                          "text-xs opacity-80 transition-all",
                          displayOpen ? "rotate-180 opacity-100" : "rotate-0",
                        ].join(" ")}
                      />
                    </span>
                  </button>

                  <div
                    id={`submenu-${key}`}
                    className={[
                      "overflow-hidden transition-[max-height] duration-200 ease-in-out",
                      displayOpen ? "max-h-96" : "max-h-0",
                    ].join(" ")}
                  >
                    <ul className="pt-1 space-y-1">
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
                                <StripBullet active={active} />
                              </span>
                              <span className="leading-none transition-colors font-semibold">{c.label}</span>
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
                  <span className="flex items-center gap-4">
                    <span className={iconBox}>
                      <m.icon className={iconCls} />
                    </span>
                    <span className="leading-none transition-colors font-semibold">{m.label}</span>
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
