"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

export default function useLogoutViewModel() {
  const router = useRouter();

  const onLogout = useCallback(() => {
    localStorage.removeItem("eh-token");
    localStorage.removeItem("eh-user");
    router.push("/auth/login");
  }, [router]);

  return { onLogout };
}
