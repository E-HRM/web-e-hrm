"use client";

import React, { useMemo, useState } from "react";
import { Button, Dropdown, Badge, Tabs, Empty, Modal } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";

/* ======= Notifikasi (opsional) ======= */
function NotificationBell() {
  const [items, setItems] = useState([
    {
      id: "n1",
      title: "Persetujuan Absensi",
      desc: "Andi mengajukan approval absensi masuk.",
      time: new Date(Date.now() - 2 * 60 * 1000),
      read: false,
      type: "absensi",
    },
    {
      id: "n2",
      title: "Perubahan Jadwal",
      desc: "Shift Rina (Rabu) diubah ke Pola A.",
      time: new Date(Date.now() - 45 * 60 * 1000),
      read: false,
      type: "shift",
    },
    {
      id: "n3",
      title: "Pengumuman",
      desc: "Maintenance sistem Jumat 21:00–22:00.",
      time: new Date(Date.now() - 6 * 60 * 60 * 1000),
      read: true,
      type: "info",
    },
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
    const icon =
      it.type === "absensi" ? <CheckCircleOutlined /> :
      it.type === "shift" ? <ExclamationCircleOutlined /> :
      <ClockCircleOutlined />;

    return (
      <button
        key={it.id}
        onClick={() => markOneRead(it.id)}
        className={`w-full text-left px-3 py-2 rounded-xl transition
        ${it.read ? "bg-white hover:bg-slate-50" : "bg-amber-50 hover:bg-amber-100"}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full
            ${it.type === "absensi" ? "bg-emerald-100 text-emerald-700"
              : it.type === "shift" ? "bg-sky-100 text-sky-700"
              : "bg-slate-100 text-slate-700"}`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-slate-800 line-clamp-1">{it.title}</div>
            <div className="text-xs text-slate-600 line-clamp-2">{it.desc}</div>
            <div className="text-[11px] text-slate-400 mt-1">{formatRelTime(it.time)}</div>
          </div>
          {!it.read && <span className="ml-auto mt-1 inline-block h-2 w-2 rounded-full bg-red-500" />}
        </div>
      </button>
    );
  };

  const [activeKey, setActiveKey] = useState("all");
  const filtered = activeKey === "unread" ? items.filter((i) => !i.read) : items;

  const dropdownWithTabs = (
    <div
      className="rounded-2xl border border-slate-200 bg-white shadow-xl"
      style={{ width: 360, overflow: "hidden" }}
    >
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white/60 backdrop-blur">
        <div>
          <div className="font-semibold text-slate-800">Notifikasi</div>
          <div className="text-xs text-slate-500">{unreadCount} belum dibaca</div>
        </div>
        <Button size="small" onClick={markAllRead}>Tandai semua dibaca</Button>
      </div>

      <div className="px-2 pt-2">
        <Tabs
          size="small"
          activeKey={activeKey}
          onChange={setActiveKey}
          items={[
            { key: "all", label: "Semua" },
            { key: "unread", label: "Belum Dibaca" },
          ]}
          tabBarGutter={12}
          animated
          destroyInactiveTabPane
        />
      </div>

      {filtered?.length ? (
        <div className="px-2 pb-2 max-h-[60vh] overflow-auto space-y-2">
          {filtered.map(renderItem)}
        </div>
      ) : (
        <div className="px-4 py-8">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span className="text-slate-500 text-sm">{activeKey === "unread" ? "Tidak ada notifikasi baru" : "Tidak ada notifikasi"}</span>}
          />
        </div>
      )}

      <div className="px-3 py-2 border-t border-slate-200 bg-slate-50/50 text-right">
        <Link href="/home/notifikasi" className="text-sm text-slate-700 hover:text-slate-900">
          Lihat semua →
        </Link>
      </div>
    </div>
  );

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      dropdownRender={() => dropdownWithTabs}
      overlayStyle={{ padding: 0 }}
    >
      <Badge
        count={unreadCount}
        overflowCount={99}
        offset={[-2, 2]}
        style={{ backgroundColor: "#ef4444", boxShadow: "0 0 0 1.5px #fff inset" }}
      >
        <Button type="text" aria-label="Notifikasi" icon={<BellOutlined />} className="hover:!bg-amber-50" />
      </Badge>
    </Dropdown>
  );
}

/* ======= AppHeader ======= */
export default function AppHeader({
  collapsed = false,
  onToggleSider,
  userName = "Admin",
  avatarSrc = "/logo-burung.png",
  onLogout,
}) {
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

  return (
    <div
      role="banner"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        height: 64,
        display: "flex",
        alignItems: "center",
        gap: 12,
        paddingInline: 16,
        background: "#ffffff",
        borderBottom: "1px solid #ECEEF1",
        flexShrink: 0,
      }}
    >
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggleSider}
      />

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        {/* Aktifkan bila ingin lonceng notifikasi */}
        {/* <NotificationBell /> */}

        <span className="hidden md:inline text-sm text-gray-700 max-w-[220px] truncate">
          {userName}
        </span>

        <div className="relative w-8 h-8">
          <Image
            src={avatarSrc}
            alt={userName}
            fill
            className="rounded-full ring-1 ring-gray-200 object-cover"
            priority
          />
        </div>

        <Button
          type="text"
          title="Logout"
          aria-label="Logout"
          icon={<LogoutOutlined style={{ color: "#ef4444" }} />}
          onClick={confirmLogout}
        />
      </div>
    </div>
  );
}
