"use client";

import React, { useEffect, useState } from "react";
import { Layout, Button, Grid, ConfigProvider } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "../../components/dashboard/Sidebar";
import useLogoutViewModel from "../auth/logout/useLogoutViewModel";

const { Header, Sider, Content, Footer } = Layout;
const { useBreakpoint } = Grid;

const LS_COLLAPSED_KEY = "oss.sider.collapsed";

// ======= THEME GLOBAL =======
const THEME = {
  token: {
    colorPrimary: "#D9A96F",
    colorPrimaryHover: "#C89B63",
    colorPrimaryActive: "#B98953",
    colorLink: "#D9A96F",
    colorLinkHover: "#C89B63",
    colorLinkActive: "#B98953",
    controlOutline: "rgba(217,169,111,0.25)",
  },
  components: {
    Button: {
      defaultHoverBorderColor: "#D9A96F",
      defaultActiveBorderColor: "#B98953",
      primaryShadow: "0 0 0 2px rgba(217,169,111,0.18)",
      linkHoverBg: "rgba(217,169,111,0.08)",
    },
    Input: { hoverBorderColor: "#D9A96F", activeBorderColor: "#D9A96F" },
    Select: {
      hoverBorderColor: "#D9A96F",
      activeBorderColor: "#D9A96F",
      optionSelectedBg: "rgba(217,169,111,0.10)",
      optionSelectedColor: "#3a2c17",
    },
    Pagination: { itemActiveBg: "#D9A96F" },
    Modal: { contentBg: "#ffffff" },
  },
};

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
            backgroundColor: "#0A3848",
            height: "100vh",
            position: "sticky",
            top: 0,
            left: 0,
            bottom: 0,
            overflow: "hidden",
            zIndex: 100,
          }}
        >
          {/* HEADER SIDER — logo kiri sejajar menu */}
          <div
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",      // ⬅️ kiri, bukan center
              paddingInline: 16,
              paddingLeft: 28,                    // ⬅️ sejajar dengan margin+padding item menu
              borderBottom: "1px solid rgba(255,255,255,.15)",
              flexShrink: 0,
            }}
          >
            <Link href="/home/dashboard" className="block">
              <div className="relative h-8 w-[160px] shrink-0">
                <Image
                  src="/loogo.png"                 // ganti ke /logoo.png kalau itu nama filenya
                  alt="E-HRM"
                  fill
                  className="object-contain object-left"  // ⬅️ anchor ke kiri
                  priority
                />
              </div>
            </Link>
          </div>

          {/* area menu yang scroll; 64 = tinggi header di atas */}
          <div className="h-[calc(100vh-64px)] overflow-y-auto sider-scroll pr-1">
            <Sidebar />
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
            style={{
              background: "#F6F7F9",
              padding: screens.md ? 24 : 16,
              flex: 1,
              minHeight: 0,
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
