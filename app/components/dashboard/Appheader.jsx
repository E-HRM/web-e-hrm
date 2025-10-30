"use client";

import React, { useMemo, useState } from "react";
import { Button, Dropdown, Badge, Tabs, Empty, Modal, Avatar } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  BellOutlined,
  UserOutlined,
  // SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DownOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useSession } from "next-auth/react";

/* ======= Notifikasi (opsional) ======= */
function NotificationBell() {
  const [items, setItems] = useState([
    { id: "n1", title: "Persetujuan Absensi", desc: "Andi mengajukan approval absensi masuk.", time: new Date(Date.now() - 2 * 60 * 1000), read: false, type: "absensi" },
    { id: "n2", title: "Perubahan Jadwal", desc: "Shift Rina (Rabu) diubah ke Pola A.", time: new Date(Date.now() - 45 * 60 * 1000), read: false, type: "shift" },
    { id: "n3", title: "Pengumuman", desc: "Maintenance sistem Jumat 21:00–22:00.", time: new Date(Date.now() - 6 * 60 * 60 * 1000), read: true, type: "info" },
  ]);

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items]);

  const formatRelTime = (d) => {
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return `${Math.floor(diff / 86400)}h lalu`;
  };

  const markAllRead = () => setItems((arr) => arr.map((it) => ({ ...it, read: true })));
  const markOneRead = (id) => setItems((arr) => arr.map((it) => (it.id === id ? { ...it, read: true } : it)));

  const renderItem = (it) => {
    const icon = it.type === "absensi" ? <CheckCircleOutlined /> : it.type === "shift" ? <ExclamationCircleOutlined /> : <ClockCircleOutlined />;
    return (
      <button
        key={it.id}
        onClick={() => markOneRead(it.id)}
        className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 ${
          it.read ? "bg-white hover:bg-gray-50" : "bg-amber-50 hover:bg-amber-100 border border-amber-200"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-1 flex-shrink-0 h-7 w-7 grid place-items-center rounded-full ${
            it.type === "absensi" ? "bg-emerald-100 text-emerald-700"
            : it.type === "shift" ? "bg-blue-100 text-blue-700"
            : "bg-gray-100 text-gray-700"
          }`}>{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm line-clamp-1">{it.title}</div>
            <div className="text-gray-600 text-xs line-clamp-2 mt-1">{it.desc}</div>
            <div className="text-gray-400 text-[11px] mt-2">{formatRelTime(it.time)}</div>
          </div>
          {!it.read && <span className="inline-block h-2 w-2 rounded-full bg-red-500 mt-1" />}
        </div>
      </button>
    );
  };

  const [activeKey, setActiveKey] = useState("all");
  const filtered = activeKey === "unread" ? items.filter((i) => !i.read) : items;

  const dropdownWithTabs = (
    <div className="rounded-xl border border-gray-200 bg-white shadow-xl w-80 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-gray-900">Notifikasi</div>
            <div className="text-gray-500 text-xs">{unreadCount} belum dibaca</div>
          </div>
          <Button size="small" type="link" onClick={markAllRead} className="text-blue-600 hover:text-blue-800">Tandai semua</Button>
        </div>
      </div>

      <div className="px-3 pt-2">
        <Tabs
          size="small"
          activeKey={activeKey}
          onChange={setActiveKey}
          items={[{ key: "all", label: "Semua" }, { key: "unread", label: "Belum Dibaca" }]}
          tabBarStyle={{ marginBottom: 8 }}
        />
      </div>

      <div className="max-h-96 overflow-auto">
        {filtered.length > 0 ? <div className="px-2 pb-2 space-y-1">{filtered.map(renderItem)}</div> : (
          <div className="px-4 py-8">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-gray-500 text-sm">
              {activeKey === "unread" ? "Tidak ada notifikasi baru" : "Tidak ada notifikasi"}</span>}
            />
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <Link href="/home/notifikasi" className="text-blue-600 hover:text-blue-800 text-sm font-medium float-right">Lihat semua →</Link>
      </div>
    </div>
  );

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      // ganti dropdownRender -> popupRender (yang baru di AntD)
      popupRender={() => dropdownWithTabs}
      overlayStyle={{ padding: 0 }}
    >
      <Badge
        count={unreadCount}
        overflowCount={99}
        offset={[-4, 4]}
        className="[&_.ant-badge-count]:bg-red-500 [&_.ant-badge-count]:text-white"
      >
        <Button
          type="text"
          aria-label="Notifikasi"
          icon={<BellOutlined className="text-gray-600" />}
          className="hover:bg-gray-100 w-10 h-10 flex items-center justify-center rounded-lg border border-transparent hover:border-gray-200 transition-all duration-200"
        />
      </Badge>
    </Dropdown>
  );
}

/* ======= Profile Dropdown (tanpa hover tooltip) ======= */
function ProfileDropdown({ onLogout }) {
  const { data: session } = useSession();

  const userId =
    session?.user?.id ||
    session?.user?.id_user ||
    session?.user?.idUser ||
    null;

  const userName = session?.user?.name ?? "User";
  const userRole = session?.user?.jabatan_name ?? session?.user?.role ?? "-";
  const userDepartment = session?.user?.departement_name ?? session?.user?.divisi ?? "-";
  const avatarSrc = session?.user?.image ?? session?.user?.foto_profil_user ?? null;

  const confirmLogout = () => {
    Modal.confirm({
      title: "Keluar dari akun?",
      content: "Anda akan keluar dari sesi saat ini.",
      okText: "Logout",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: onLogout,
    });
  };

  // Pakai id user yang login; fallback ke /home/profile jika belum tersedia
  const profileHref = userId
    ? `/home/kelola_karyawan/karyawan/${encodeURIComponent(userId)}`
    : `/home/profile`;

  const menuItems = [
    {
      key: "profile",
      icon: <UserOutlined className="text-gray-600" />,
      label: (
        <Link
          href={profileHref}
          className="flex items-center gap-3 text-gray-700 hover:text-gray-900"
        >
          Profil Saya
        </Link>
      ),
    },
    // {
    //   key: "settings",
    //   icon: <SettingOutlined className="text-gray-600" />,
    //   label: <Link href="/home/settings" className="flex items-center gap-3 text-gray-700 hover:text-gray-900">Pengaturan</Link>,
    // },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined className="text-red-500" />,
      label: <span className="text-red-600">Keluar</span>,
      onClick: confirmLogout,
    },
  ];

  return (
    <Dropdown
      menu={{ items: menuItems, className: "rounded-xl shadow-lg border border-gray-200 py-2" }}
      trigger={["click"]}
      placement="bottomRight"
      overlayStyle={{ width: 240 }}
    >
      <button
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200"
        aria-label="Buka menu pengguna"
      >
        <div className="relative">
          <Avatar
            size={40}
            src={avatarSrc || undefined}
            alt={userName}
            className="border-2 border-white shadow-sm"
            icon={<UserOutlined />}
          />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </div>

        <div className="hidden lg:block text-left">
          <div className="font-semibold text-gray-900 text-sm leading-tight">{userName}</div>
          <div className="text-gray-500 text-xs leading-tight">
            {userRole} <span className="text-gray-400">|</span> {userDepartment}
          </div>
        </div>

        <DownOutlined className="text-gray-400 text-xs" />
      </button>
    </Dropdown>
  );
}

/* ======= AppHeader ======= */
export default function AppHeader({
  collapsed = false,
  onToggleSider,
  onLogout,
  showBell = true,
}) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 h-16">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggleSider}
            className="hover:bg-gray-100 w-10 h-10 flex items-center justify-center rounded-lg border border-transparent hover:border-gray-200 transition-all duration-200"
          />
        </div>

        <div className="flex items-center gap-3">
          {showBell && <NotificationBell />}
          <div className="h-6 w-px bg-gray-300 hidden sm:block" />
          <ProfileDropdown onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
