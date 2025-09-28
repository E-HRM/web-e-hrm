"use client";

import Image from "next/image";
import { ConfigProvider, App as AntdApp } from "antd";
import LoginForm from "../../../components/common/LoginForm";
import useLoginViewModel from "./useLoginViewModel";

const BRAND = {
  primary: "#003A6F",
  primaryHover: "#003E86",
  primaryActive: "#00366F",
  accent: "#98D5FF",
  accentHover: "#6FC0FF",
  accentActive: "#4AAEFF",
};

export default function LoginContent() {
  const { onFinish, loading } = useLoginViewModel();

  return (
    <div className="relative min-h-dvh bg-white">
      {/* === BG FULL: gambar + overlay putih === */}
      <div className="absolute inset-0 z-10">
        <Image src="/bglogin2.jpg" alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-white/40 pointer-events-none" />
      </div>

      {/* Card center */}
      <div className="relative z-10 flex min-h-dvh items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 grid grid-cols-1 md:grid-cols-2">
          {/* KIRI: gambar statis */}
          <div className="relative hidden md:block">
            <Image src="/kirilogo2.png" alt="Login Illustration" fill className="object-cover" priority />
          </div>

          {/* KANAN: form */}
          <div className="p-6 md:p-8 lg:p-10 login-card">
            <h1 className="mb-6 text-2xl font-semibold text-gray-900">Login</h1>

            <ConfigProvider
              theme={{
                token: {
                  // tombol primer + fokus kontrol
                  colorPrimary: BRAND.primary,
                  colorPrimaryHover: BRAND.primaryHover,
                  colorPrimaryActive: BRAND.primaryActive,
                  // warna link (Typography.Link, Anchor Antd, dsb.)
                  colorLink: BRAND.accent,
                  colorLinkHover: BRAND.accentHover,
                  colorLinkActive: BRAND.accentActive,
                  // sentuhan kecil biar konsisten
                  controlOutline: BRAND.primary, // outline fokus
                  colorBorder: "#E5E7EB",
                  colorBorderSecondary: "#E5E7EB",
                  borderRadius: 10,
                  fontSize: 13,
                },
                components: {
                  Button: { controlHeight: 40 },
                  Input: {
                    controlHeight: 40,
                    activeShadow: `0 0 0 2px ${BRAND.accent}33`, // 20% alpha
                  },
                },
              }}
            >
              <AntdApp>
                <div className="mx-auto w-full max-w-sm">
                  <LoginForm onFinish={onFinish} loading={loading} />
                </div>
              </AntdApp>
            </ConfigProvider>
          </div>
        </div>
      </div>

      {/* Scope CSS untuk anchor biasa di dalam kartu login */}
      <style jsx global>{`
        .login-card a {
          color: ${BRAND.accent};
          text-underline-offset: 2px;
          transition: color 120ms ease;
        }
        .login-card a:hover {
          color: ${BRAND.accentHover};
        }
        .login-card a:active {
          color: ${BRAND.accentActive};
        }
        /* tombol primer custom feel saat hover/active (kalau ada className khusus) */
        .login-card .ant-btn-primary:not([disabled]) {
          box-shadow: 0 2px 0 rgba(0, 0, 0, 0.02);
        }
        .login-card .ant-btn-primary:not([disabled]):hover {
          background: ${BRAND.primaryHover};
          border-color: ${BRAND.primaryHover};
        }
        .login-card .ant-btn-primary:not([disabled]):active {
          background: ${BRAND.primaryActive};
          border-color: ${BRAND.primaryActive};
        }
        /* input fokus halus */
        .login-card .ant-input:focus,
        .login-card .ant-input-focused,
        .login-card .ant-input-affix-wrapper-focused {
          border-color: ${BRAND.primary};
          box-shadow: 0 0 0 2px ${BRAND.accent}33; /* 20% alpha */
        }
      `}</style>
    </div>
  );
}
