"use client";

import { Bell, Menu, Search, Sparkles } from "lucide-react";
import { AdminBreadcrumbs } from "./admin-breadcrumbs";
import { AdminUserMenu } from "./admin-user-menu";

type AdminHeaderProps = {
  onOpenMobileNav: () => void;
};

export function AdminHeader({ onOpenMobileNav }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[62px] flex-wrap items-center justify-between border-b border-border bg-card/95 gap-3 px-4 py-2 backdrop-blur sm:px-6 md:pl-[280px]">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          aria-label="Open mobile navigation"
          className="ui-button-secondary flex h-9 w-9 items-center justify-center border border-border md:hidden"
        >
          <Menu size={18} />
        </button>

        <AdminBreadcrumbs />
      </div>

      <div className="flex items-center gap-3">
        {/* User Menu Dropdown */}
        <AdminUserMenu />
      </div>
    </header>
  );
}
