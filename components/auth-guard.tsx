"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);

  return <>{children}</>;
}
