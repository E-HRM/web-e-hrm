"use client";

import { useCallback } from "react";
import { signOut } from "next-auth/react";

export default function useLogoutViewModel() {
  const onLogout = useCallback(() => {
  
    signOut({ redirect: true, callbackUrl: "/auth/login" });
  }, []);

  return { onLogout };
}
