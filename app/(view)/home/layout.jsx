"use client";

import React, { useEffect, useState } from "react";
import { Layout, Grid, ConfigProvider } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

import Sidebar from "@/app/components/dashboard/Sidebar";
import AppHeader from "@/app/components/dashboard/Appheader"; // perbaiki case-nya
import useLogoutViewModel from "../auth/logout/useLogoutViewModel";

const { Sider, Content, Footer } = Layout;
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

export default function ViewLayout({ children }) {
  const screens = useBreakpoint();
  const { onLogout } = useLogoutViewModel();
  const { data: session } = useSession();

  const user = session?.user ?? null;
  const userName = user?.name ?? "User";
  const userRole = user?.jabatan_name ?? user?.role ?? "-";
  const userDepartment = user?.departement_name ?? "-";
  const avatarSrc =
    user?.image || user?.foto_profil_user || user?.avatarUrl || "/logo-burung.png";

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
          <AppHeader
            collapsed={collapsed}
            onToggleSider={() => setCollapsed((v) => !v)}
            userName={userName}
            userRole={userRole}
            userDepartment={userDepartment}
            avatarSrc={avatarSrc}
            onLogout={onLogout}
          />

          <Content
            className="content-scroll"
            style={{
              background: "rgba(152, 213, 255, 0.3)",
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
