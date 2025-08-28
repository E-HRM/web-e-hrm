"use client";

import React, { useState } from "react";
import { Layout, Button, Grid } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "../../components/dashboard/Sidebar";
import useLogoutViewModel from "../auth/logout/useLogoutViewModel";

const { Header, Sider, Content, Footer } = Layout;
const { useBreakpoint } = Grid;

export default function ViewLayout({ children }) {
  const screens = useBreakpoint();
  const { onLogout } = useLogoutViewModel();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* SIDER */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsedWidth={screens.lg ? 72 : 0}
        breakpoint="lg"
        width={256}
        theme="dark"
        trigger={null}
        style={{
          backgroundColor: "#0A3848",
        }}
      >
        {/* Brand (logo + tulisan) */}
        <div
          style={{
            height: 96, // lebih tinggi agar muat padding
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: 12, // padding atas biar lebih turun
            gap: 6,
            borderBottom: "1px solid rgba(255,255,255,.15)",
          }}
        >
          <Link href="/home/dashboard" className="grid place-items-center">
            <div className="relative h-12 w-12 rounded-full ring-2 ring-white/20 overflow-hidden">
              <Image
                src="/logo-oss.png"
                alt="OSS"
                fill
                className="object-contain bg-white/5"
                priority
              />
            </div>
          </Link>
          <p className="text-[11px] tracking-wide text-white">
            ONE STEP SOLUTION
          </p>
        </div>

        {/* Sidebar custom kamu (tanpa scrollbar terpisah) */}
        <div className="h-[calc(100vh-96px)]">
          <Sidebar />
        </div>
      </Sider>

      {/* MAIN */}
      <Layout>
        {/* HEADER */}
        <Header
        style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingInline: 16,
            background: "#ffffff", // ✅ putih
            borderBottom: "1px solid #ECEEF1", // garis tipis bawah
        }}
        >
        <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
        />
        <div
            style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            }}
        >
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

        {/* CONTENT */}
        <Content
          style={{
            background: "#F6F7F9",
            padding: screens.md ? 24 : 16,
            minHeight: "calc(100vh - 64px - 56px)", 
          }}
        >
          {children}
        </Content>

        {/* FOOTER */}
        <Footer
        style={{
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff", // ✅ putih
            borderTop: "1px solid #ECEEF1", // garis tipis atas
        }}
        >
        <span className="text-xs text-gray-500">
            OSS © {new Date().getFullYear()}
        </span>
        </Footer>
      </Layout>
    </Layout>
  );
}
