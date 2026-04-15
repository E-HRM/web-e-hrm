"use client";

import { useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_ROUTE_PREFIXES = [
  "/",
  "/auth/resetpass",
  "/freelance/form",
];

function isPublicRoute(pathname = "/") {
  return PUBLIC_ROUTE_PREFIXES.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export default function AuthWrapper({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const shouldProtect = useMemo(() => {
    return !isPublicRoute(pathname || "/");
  }, [pathname]);

  useEffect(() => {
    if (status === "loading") return;
    if (shouldProtect && !session) {
      router.push("/");
    }
  }, [session, status, router, shouldProtect]);

  return <>{children}</>;
}
