"use client";

import { useEffect, useState } from "react";
import { App as AntdApp } from "antd";          
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function useLoginViewModel() {
  const router = useRouter();
  const { notification: apiNotification } = AntdApp.useApp(); 
  const [loading, setLoading] = useState(false);

  const redirectByRole = (role) => {
    switch (role) {
      case "HR":
        router.push("/home/dashboard");
        break;
      case "DIREKTUR":
        router.push("/home/dashboard");
        break;
      case "OPERASIONAL":
        router.push("/home/dashboard");
        break;
      default:
        router.push("/home/dashboard");
        break;
    }
  };

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

      const sRes = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await sRes.json();

      redirectByRole(session?.user?.role);

      apiNotification.success({
        message: "Login Berhasil",
        description: "Anda berhasil masuk ke sistem.",
        placement: "topRight",
      });
    } catch (err) {
      apiNotification.error({
        message: "Login Gagal",
        description: err?.message || "Terjadi kesalahan saat login.",
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const session = await res.json();
        if (!cancelled && session?.user?.role) {
          redirectByRole(session.user.role);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return { onFinish, loading };
}
