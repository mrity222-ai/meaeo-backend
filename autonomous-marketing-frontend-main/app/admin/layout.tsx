"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setAuthorized(true);
      return;
    }

    const token = localStorage.getItem("admin_token");
    if (!token) {
      setAuthorized(false);
      router.replace("/admin/login");
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  // Exclude AdminShell layout for login route
  if (pathname === "/admin/login") {
    return (
      <div className="min-h-screen bg-neutral-950 text-white font-sans">
        {children}
      </div>
    );
  }

  // If checking authorization, display loader and prevent children render
  if (!authorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-sm text-neutral-400 font-medium">
            Verifying Super Admin Authorization...
          </p>
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
