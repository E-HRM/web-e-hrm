// app/(view)/auth/login/useLoginViewModel.js
"use client";

import { useState } from "react";
import { App as AntdApp } from "antd";
import { useRouter } from "next/navigation";
import { signIn, signOut } from "next-auth/react";

const DASHBOARD_BY_ROLE = {
  HR: "/home/dashboard",
  DIREKTUR: "/home/dashboard",
  OPERASIONAL: "/home/dashboard2",
};

const ALLOWED_ROLES = new Set(["HR", "DIREKTUR", "OPERASIONAL"]);

export default function useLoginViewModel() {
  const router = useRouter();
  const { notification } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);

      const res = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (!res || res.error) {
        throw new Error(res?.error || "Email atau password salah.");
      }

      // cek role dari session
      const sRes = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await sRes.json();
      const role = session?.user?.role;

      // tolak selain HR/DIREKTUR/OPERASIONAL
      if (!ALLOWED_ROLES.has(role)) {
        notification.error({
          message: "Akses Ditolak",
          description: "Role Anda tidak diizinkan mengakses panel ini.",
          placement: "topRight",
        });
        await signOut({ redirect: true, callbackUrl: "/auth/login?e=forbidden" });
        return;
      }

      const dest = DASHBOARD_BY_ROLE[role];
      router.push(dest);

      notification.success({
        message: "Login Berhasil",
        description: "Anda berhasil masuk ke sistem.",
        placement: "topRight",
      });
    } catch (err) {
      notification.error({
        message: "Login Gagal",
        description: err?.message || "Terjadi kesalahan saat login.",
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };

  return { onFinish, loading };
}
