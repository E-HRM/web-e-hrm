"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Button,
  Grid,
  ConfigProvider,
  Dropdown,
  Badge,
  Tabs,
  Empty,
} from "antd";
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
import Sidebar from "../../components/dashboard/Sidebar";
import useLogoutViewModel from "../auth/logout/useLogoutViewModel";

const { Header, Sider, Content, Footer } = Layout;
const { useBreakpoint } = Grid;

const LS_COLLAPSED_KEY = "oss.sider.collapsed";

const THEME = {
  token: {
    colorPrimary: "#003A6F",
    colorPrimaryHover: "#C89B63",
    colorPrimaryActive: "#B98953",
    colorLink: "#003A6F",
    colorLinkHover: "#C89B63",
    colorLinkActive: "#B98953",
    controlOutline: "rgba(217,169,111,0.25)",
  },
  components: {
    Button: {
      defaultHoverBorderColor: "#003A6F",
      defaultActiveBorderColor: "#B98953",
      primaryShadow: "0 0 0 2px rgba(217,169,111,0.18)",
      linkHoverBg: "rgba(217,169,111,0.08)",
    },
    Input: { hoverBorderColor: "#003A6F", activeBorderColor: "#003A6F" },
    Select: {
      hoverBorderColor: "#003A6F",
      activeBorderColor: "#003A6F",
      optionSelectedBg: "rgba(217,169,111,0.10)",
      optionSelectedColor: "#3a2c17",
    },
    Pagination: { itemActiveBg: "#003A6F" },
    Modal: { contentBg: "#ffffff" },
    Badge: {},
  },
};

/* ======= Notifikasi ======= */
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

  const filtered = (tabKey) => (tabKey === "unread" ? items.filter((i) => !i.read) : items);

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

      <TabContent
        items={filtered(activeKey)}
        renderItem={renderItem}
        emptyText={activeKey === "unread" ? "Tidak ada notifikasi baru" : "Tidak ada notifikasi"}
      />

      <div className="px-3 py-2 border-t border-slate-200 bg-slate-50/50 text-right">
        <Link href="/home/notifikasi" className="text-sm text-slate-700 hover:text-slate-900">
          Lihat semua →
        </Link>
      </div>
    </div>
  );

  return (
    <Dropdown trigger={["click"]} placement="bottomRight" dropdownRender={() => dropdownWithTabs} overlayStyle={{ padding: 0 }}>
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

function TabContent({ items, renderItem, emptyText }) {
  if (!items?.length) {
    return (
      <div className="px-4 py-8">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-slate-500 text-sm">{emptyText}</span>} />
      </div>
    );
  }
  return (
    <div className="px-2 pb-2 max-h-[60vh] overflow-auto space-y-2">
      {items.map(renderItem)}
    </div>
  );
}

/* ======= Layout ======= */
export default function ViewLayout({ children }) {
  const screens = useBreakpoint();
  const { onLogout } = useLogoutViewModel();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LS_COLLAPSED_KEY) : null;
    if (saved !== null) setCollapsed(saved === "1");
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_COLLAPSED_KEY, collapsed ? "1" : "0");
    }
  }, [collapsed]);

  return (
    <ConfigProvider theme={THEME}>
      <Layout style={{ minHeight: "100vh" }}>
        {/* SIDER */}
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          collapsedWidth={0}
          breakpoint="lg"
          width={256}
          theme="dark"
          trigger={null}
          style={{
            backgroundColor: "#003A6F",      
            height: "100vh",
            position: "sticky",
            top: 0,
            left: 0,
            bottom: 0,
            overflow: "hidden",
            zIndex: 100,
          }}
        >
          {/* HEADER SIDER */}
          <div
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingInline: 16,
              paddingLeft: 28,
              backgroundColor: "transparent", 
              borderBottom: "1px solid rgba(255,255,255,.18)",
              flexShrink: 0,
            }}
          >
            <Link href="/home/dashboard" className="block">
              <div className="relative h-8 w-[160px] shrink-0">
                <Image
                  src="/loogo3.png"
                  alt="E-HRM"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* AREA MENU SCROLL */}
          <div className="h-[calc(100vh-64px)] relative">
            {/* fade hint atas & bawah (opsional, estetis) */}
            <div
              className="absolute inset-x-0 top-0 h-3 pointer-events-none"
              style={{ background: "linear-gradient(180deg, rgba(0,74,159,0.6), rgba(0,74,159,0))" }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-3 pointer-events-none"
              style={{ background: "linear-gradient(0deg, rgba(0,74,159,0.6), rgba(0,74,159,0))" }}
            />

            <div className="h-full overflow-y-auto sider-scroll pr-1">
              <Sidebar />
            </div>
          </div>
        </Sider>

        {/* MAIN */}
        <Layout style={{ minHeight: "100vh", display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Header
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
              onClick={() => setCollapsed(!collapsed)}
            />

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
              <NotificationBell />
              <span className="hidden md:inline text-sm text-gray-600">Admin</span>
              <div className="relative w-8 h-8">
                <Image
                  src="/logo-burung.png"
                  alt="Avatar"
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
                onClick={onLogout}
              />
            </div>
          </Header>

          <Content
            className="content-scroll"
            style={{
              background: "#F0F4F8",
              padding: screens.md ? 24 : 16,
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
            }}
          >
            {children}
          </Content>

          <Footer
            style={{
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              borderTop: "1px solid #ECEEF1",
              marginTop: "auto",
            }}
          >
            <span className="text-xs text-gray-500">OSS © {new Date().getFullYear()}</span>
          </Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
