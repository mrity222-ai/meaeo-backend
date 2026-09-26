"use client";

import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      {/* Sidebar for Desktop & Mobile */}
      <AdminSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Top Header */}
      <AdminHeader onOpenMobileNav={() => setMobileNavOpen(true)} />

      {/* Page Content Body */}
      <main className="min-h-[calc(100vh-62px)] md:pl-[260px]">
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
