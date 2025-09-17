"use client";

import Image from "next/image";
import { ConfigProvider, App as AntdApp } from "antd";
import LoginForm from "../../../components/common/LoginForm";
import useLoginViewModel from "./useLoginViewModel";

const BRAND = {
  primary: "#0A3848",
  primaryHover: "#0D4A5E",
  primaryActive: "#072B37",
  accent: "#D9A96F",
  accentHover: "#C08C55",
  accentActive: "#A97C3E",
};

export default function LoginContent() {
  const { onFinish, loading } = useLoginViewModel();

  return (
    <div className="relative min-h-dvh bg-white">
      {/* === BG FULL: gambar + overlay putih (bukan opacity di gambarnya) === */}
      <div className="absolute inset-0 z-10">
        <Image
          src="/bglogin.png"
          alt=""
          fill
          className="object-cover"   // jangan pakai opacity di sini
          priority
        />
        {/* overlay putih 50% → efek bening/terang */}
        <div className="absolute inset-0 bg-white/30 pointer-events-none" />
        {/*
          Ingin lebih/kurang bening?
          - bg-white/30  => lebih tembus
          - bg-white/60  => lebih terang
        */}
      </div>

      {/* Card center */}
      <div className="relative z-10 flex min-h-dvh items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 grid grid-cols-1 md:grid-cols-2">
          {/* KIRI: gambar statis */}
          <div className="relative hidden md:block">
            <Image
              src="/kirilogo.png"
              alt="Login Illustration"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* KANAN: form */}
          <div className="p-6 md:p-8 lg:p-10">
            <h1 className="mb-6 text-2xl font-semibold text-gray-900">Login</h1>

            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: BRAND.primary,
                  colorPrimaryHover: BRAND.primaryHover,
                  colorPrimaryActive: BRAND.primaryActive,
                  colorLink: BRAND.accent,
                  colorLinkHover: BRAND.accentHover,
                  colorLinkActive: BRAND.accentActive,
                  borderRadius: 10,
                  fontSize: 13,
                },
                components: {
                  Button: { controlHeight: 40 },
                  Input: { controlHeight: 40 },
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
    </div>
  );
}
