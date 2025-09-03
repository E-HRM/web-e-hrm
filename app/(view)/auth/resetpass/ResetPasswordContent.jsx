"use client";

import Image from "next/image";
import { ConfigProvider, App as AntdApp } from "antd";
import ResetPasswordPanel from "../../../components/common/ResetPasswordPanel";
import useResetPasswordViewModel from "./useResetPasswordViewModel";

const BRAND = {
  primary: "#0A3848",
  primaryHover: "#0D4A5E",
  primaryActive: "#072B37",
  accent: "#D9A96F",
  accentHover: "#C08C55",
  accentActive: "#A97C3E",
};

export default function ResetPasswordContent() {
  const { onBackToLogin } = useResetPasswordViewModel();

  return (
    <div className="grid min-h-dvh grid-cols-1 md:grid-cols-2 bg-white">
      {/* Kiri: panel reset password */}
      <section className="flex items-center bg-white">
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: BRAND.primary,
              colorPrimaryHover: BRAND.primaryHover,
              colorPrimaryActive: BRAND.primaryActive,
              colorLink: BRAND.accent,
              colorLinkHover: BRAND.accentHover,
              colorLinkActive: BRAND.accentActive,
              borderRadius: 8,
              fontSize: 14,
            },
            components: {
              Button: { controlHeight: 44 },
              Input: { controlHeight: 44 },
            },
          }}
        >
          <AntdApp>
            <ResetPasswordPanel onBackToLogin={onBackToLogin} />
          </AntdApp>
        </ConfigProvider>
      </section>

      {/* Kanan: sama seperti login */}
      <section className="relative bg-gradient-to-b from-[#0E2A2E] to-[#0B1F22] text-white">
        <div className="absolute inset-0 pointer-events-none ring-1 ring-white/10" />
        <div className="relative min-h-svh flex flex-col items-center justify-center px-8 md:px-10 text-center pt-16 md:pt-20">
          <h2 className="whitespace-nowrap text-3xl font-extrabold leading-none tracking-wide">
            E-HR MANAGEMENT
          </h2>
          <Image
            src="/logo-oss.png"
            alt="OSS Mark"
            width={260}
            height={260}
            className="mt-6 w-56 h-56 md:w-64 md:h-64 lg:w-[18rem] lg:h-[18rem] object-contain"
            priority
          />
          <div className="mt-4">
            <p className="text-2xl md:text-3xl font-extrabold tracking-wide text-[#E7B97A]">
              ONE STEP SOLUTION
            </p>
            <p className="mt-0 text-lg md:text-xl text-white/90">Make You Priority</p>
          </div>
        </div>
      </section>
    </div>
  );
}
