"use client";

import { Bell, Menu, Search, Sparkles } from "lucide-react";
import { AdminBreadcrumbs } from "./admin-breadcrumbs";
import { AdminUserMenu } from "./admin-user-menu";

type AdminHeaderProps = {
  onOpenMobileNav: () => void;
};

export function AdminHeader({ onOpenMobileNav }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[62px] items-center justify-between border-b border-neutral-200 bg-white/95 px-4 backdrop-blur sm:px-6 md:pl-[280px]">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          aria-label="Open mobile navigation"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 md:hidden"
        >
          <Menu size={18} />
        </button>

        <AdminBreadcrumbs />
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Search Input */}
        <div className="relative hidden sm:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search users, businesses, campaigns..."
            className="h-9 w-64 rounded-xl border border-neutral-200 bg-neutral-50/50 pl-9 pr-4 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-purple-600 focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Notifications Icon */}
        <button
          aria-label="Admin Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition"
        >
          <Bell size={17} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-purple-600 ring-2 ring-white" />
        </button>

        <div className="h-4 w-px bg-neutral-200" />

        {/* User Menu Dropdown */}
        <AdminUserMenu />
      </div>
    </header>
  );
}
