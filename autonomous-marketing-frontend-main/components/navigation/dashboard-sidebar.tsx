"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  CreditCard,
  FileCheck,
  Headphones,
  ImageIcon,
  LayoutDashboard,
  Link2,
  LogOut,
  Megaphone,
  Settings,
  Sparkles,
  Store,
  User,
  X,
} from "lucide-react";
import { clearAuth, getUserMeta } from "@/lib/auth";
import { MobileBottomNav } from "./mobile-bottom-nav";

type DashboardSidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

const primaryNavigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Campaigns",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    label: "Google Business",
    href: "/google-business",
    icon: Store,
  },
  {
    label: "Connections",
    href: "/connections",
    icon: Link2,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
];


const manageNavigation = [
  {
    label: "Catalogue",
    href: "/catalogue",
    icon: ImageIcon,
  },
  {
    label: "Content Review",
    href: "/content",
    icon: FileCheck,
  },
  {
    label: "Content Calendar",
    href: "/calendar",
    icon: CalendarDays,
  },
];

export function DashboardSidebar({
  open = false,
  onClose = () => {},
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [userMeta, setUserMeta] = useState<{ name: string; email: string }>({
    name: "",
    email: "",
  });

  useEffect(() => {
    setUserMeta(getUserMeta());
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  const displayName = userMeta.name || "My Account";
  const displayEmail = userMeta.email || "Active Workspace";
  const initials = (userMeta.name ? userMeta.name.slice(0, 2) : "US").toUpperCase();

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[230px] flex-col",
          "border-r border-purple-100 bg-white/92 backdrop-blur-xl shadow-xl shadow-purple-500/5",
          "transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        ].join(" ")}
      >
        {/* Brand */}
        <div className="flex h-[62px] items-center justify-between border-b border-purple-100/80 px-5">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2.5"
          >
            <img
              src="/logo/app logo.png"
              alt="meaeco logo"
              className="h-8 w-8 rounded-lg object-contain shadow-xs"
            />

            <span className="text-lg font-bold tracking-tight text-slate-900">
              meaeco
            </span>
          </Link>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-slate-500 hover:bg-purple-50 md:hidden"
          >
            <X size={18} />
          </button>
        </div>


        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-purple-600">
            Workspace
          </p>

          {/* Workspace selector */}
          <button className="mb-4 flex h-9 w-full items-center justify-between rounded-xl btn-purple-gradient px-3 text-left text-xs font-semibold text-white">
            <span className="truncate">Your workspace</span>

            <ChevronDown
              size={14}
              className="shrink-0 text-white/80"
            />
          </button>

          {/* Primary navigation */}
          <nav className="space-y-1">
            {primaryNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={[
                    "flex h-9 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-all duration-200",
                    active
                      ? "active-purple-slider"
                      : "text-slate-600 hover:bg-purple-50/80 hover:text-purple-700",
                  ].join(" ")}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <p className="mb-2 mt-6 px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-purple-600">
            Manage
          </p>

          {/* Manage navigation */}
          <nav className="space-y-1">
            {manageNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={[
                    "flex h-9 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-all duration-200",
                    active
                      ? "active-purple-slider"
                      : "text-slate-600 hover:bg-purple-50/80 hover:text-purple-700",
                  ].join(" ")}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom */}
        <div className="border-t border-purple-100 p-3">
          <Link
            href="/profile"
            onClick={onClose}
            className={[
              "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200",
              isActive("/profile")
                ? "active-purple-slider"
                : "text-slate-600 hover:bg-purple-50 hover:text-purple-700",
            ].join(" ")}
          >
            <span className="flex items-center gap-2">
              <User size={15} strokeWidth={2} />
              My Profile
            </span>
            <span className="rounded-md bg-purple-100/70 px-1.5 py-0.5 text-[10px] font-bold text-purple-800">
              Hub
            </span>
          </Link>
        </div>
      </aside>

      {/* Mobile 5-Tab Persistent Bottom Navigation Bar */}
      <MobileBottomNav />
    </>
  );
}