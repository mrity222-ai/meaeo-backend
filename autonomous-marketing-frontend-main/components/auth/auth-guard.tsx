"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    (pathname ? pathname.startsWith("/admin") : false);

  const [isAuthorized, setIsAuthorized] = useState<boolean>(isPublicRoute);

  useEffect(() => {
    if (isPublicRoute) {
      setIsAuthorized(true);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setIsAuthorized(false);
      router.replace("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, isPublicRoute, router]);

  // If user is not authorized and trying to access a protected page, show loading spinner while redirecting
  if (!isAuthorized && !isPublicRoute) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9FF] text-zinc-900 font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-sm font-semibold text-zinc-500">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
