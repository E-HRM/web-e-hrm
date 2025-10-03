"use client";

import Image from "next/image";
import { ConfigProvider, App as AntdApp } from "antd";
import ResetPasswordPanel from "../../../components/common/ResetPasswordPanel";
import { useRouter } from "next/navigation";

const BRAND = {
  primary: "#003A6F",
  primaryHover: "#003E86",
  primaryActive: "#00366F",
  accent: "#98D5FF",
  accentHover: "#6FC0FF",
  accentActive: "#4AAEFF",
};

export default function ResetPasswordContent() {
  const router = useRouter();
  const onBackToLogin = () => router.replace("/auth/login");

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
              controlOutline: BRAND.primary,
              colorBorder: "#E5E7EB",
              colorBorderSecondary: "#E5E7EB",
              borderRadius: 10,
              fontSize: 13,
            },
            components: {
              Button: { controlHeight: 40 },
              Input: {
                controlHeight: 40,
                // 20% alpha untuk efek fokus halus (selaras login)
                activeShadow: `0 0 0 2px ${BRAND.accent}33`,
              },
            },
          }}
        >
          <AntdApp>
            <div className="w-full">
              <ResetPasswordPanel onBackToLogin={onBackToLogin} />
            </div>
          </AntdApp>
        </ConfigProvider>
      </section>

      {/* Kanan: latar sama seperti login (gambar + overlay putih tipis) */}
      <section className="relative">
        <Image src="/bglogin2.jpg" alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-white/40 pointer-events-none" />
        <div className="relative min-h-svh flex flex-col items-center justify-center px-8 md:px-10 text-center">
          <Image
            src="/logo-oss.png"
            alt="OSS Mark"
            width={260}
            height={260}
            className="mt-6 w-56 h-56 md:w-64 md:h-64 lg:w-[18rem] lg:h-[18rem] object-contain"
            priority
          />
          <div className="mt-4">
            <p className="text-2xl md:text-3xl font-extrabold tracking-wide text-[#003A6F]">
              ONE STEP SOLUTION
            </p>
            <p className="mt-0 text-lg md:text-xl text-[#003A6F]/80">Make You Priority</p>
          </div>
        </div>
      </section>
    </div>
  );
}
