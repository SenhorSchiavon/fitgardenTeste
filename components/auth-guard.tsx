"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/hooks/api";
import { canAccess, firstAllowedPath, getStoredUser, screenForPath } from "@/lib/auth-permissions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const storedUser = getStoredUser();
    const screen = screenForPath(pathname);
    if (screen && !canAccess(storedUser, screen.key)) {
      router.replace(firstAllowedPath(storedUser));
      return;
    }

    apiFetch(`${API_URL}/usuarios-sistema/me`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          const currentScreen = screenForPath(pathname);
          if (currentScreen && !canAccess(data.user, currentScreen.key)) {
            router.replace(firstAllowedPath(data.user));
          }
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      });
  }, [router, pathname]);

  return <>{children}</>;
}
