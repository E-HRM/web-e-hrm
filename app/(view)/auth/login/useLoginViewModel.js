"use client";

import { useState, useEffect } from "react";
import { App as AntdApp } from "antd";
import { useRouter } from "next/navigation";

export default function useLoginViewModel() {
  const router = useRouter();
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
  
      await new Promise((r) => setTimeout(r, 500));
      localStorage.setItem("eh-token", "dummy-token");
      localStorage.setItem("eh-user", values?.email || "User");
      message.success("Login success");

      router.push("/home/dashboard");
    } catch (err) {
      message.error(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

 
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("eh-token")) {
      router.replace("/home/dashboard");
    }
  }, [router]);

  return { onFinish, loading };
}
