"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { Loader2 } from "lucide-react";

const PUBLIC_ROUTES = [
  "/",
  "/features",
  "/examples",
  "/login",
  "/signup",
  "/forgot-password",
  "/privacy",
  "/terms",
  "/data-deletion",
  "/refund-policy",
  "/contact",
  "/support",
  "/admin/login",
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = Boolean(
    pathname &&
      (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/admin/login"))
  );

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
  if (!isPublicRoute && !isAuthorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9FF] text-zinc-900 font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-sm font-semibold text-zinc-500">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
