"use client";
import { BusinessAvatar } from "@/components/profile/business-avatar";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  CreditCard,
  Headphones,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { clearAuth, getUserMeta, getTenantId } from "@/lib/auth";

export function UserAccountMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [userMeta, setUserMeta] = useState<{ name: string; email: string }>({
    name: "",
    email: "",
  });
  const [tenantId, setTenantId] = useState("");

  useEffect(() => {
    setUserMeta(getUserMeta());
    setTenantId(getTenantId() || "Default Workspace");
  }, []);

  // Close desktop dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleButtonClick = () => {
    // If on mobile screen (< 768px), navigate directly to /profile page!
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      router.push("/profile");
      return;
    }
    // On desktop, toggle dropdown
    setOpen((prev) => !prev);
  };

  const handleLogout = () => {
    setOpen(false);
    clearAuth();
    router.replace("/login");
  };

  const displayName = userMeta.name || "My Account";
  const displayEmail = userMeta.email || "user@marketingsystem.com";
  const initials = (userMeta.name ? userMeta.name.slice(0, 2) : "US").toUpperCase();

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button (Top-Right): Navigates to /profile on mobile, opens dropdown on desktop */}
      <button
        type="button"
        onClick={handleButtonClick}
        aria-label="Open User Account"
        className="ui-button-secondary flex items-center gap-2 border border-border/90 p-1 pl-1.5 pr-2.5 transition hover:border-neutral-300 active:scale-95 focus:outline-none"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-bold text-white shadow-xs">
          <BusinessAvatar initials={initials} className="h-full w-full" />
        </div>

        <div className="hidden text-left sm:block">
          <p className="truncate text-xs font-semibold text-neutral-900 leading-tight max-w-[120px]">
            {displayName}
          </p>
          <p className="truncate text-[10px] text-muted-foreground max-w-[120px]">
            {displayEmail}
          </p>
        </div>

        <ChevronDown
          size={14}
          className={`hidden sm:block text-neutral-400 transition-transform duration-200 ${
            open ? "rotate-180 text-neutral-900" : ""
          }`}
        />
      </button>

      {/* DESKTOP VIEW: Sleek Floating Dropdown Menu (Hidden on mobile) */}
      {open && (
        <div className="hidden md:block absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-2xl border border-border bg-card p-2 shadow-xl animate-in fade-in zoom-in-95">
          {/* User Details Header */}
          <div className="border-b border-neutral-100 p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-xs font-bold text-white">
                <BusinessAvatar initials={initials} className="h-full w-full" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-neutral-900">
                  {displayName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {displayEmail}
                </p>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between rounded-lg bg-neutral-50 px-2 py-1 text-[10px] text-neutral-600">
              <span className="font-medium text-muted-foreground">Workspace:</span>
              <span className="font-semibold text-neutral-800 truncate max-w-[130px]">
                {tenantId}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/profile?tab=profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-foreground"
            >
              <User size={15} className="text-muted-foreground" />
              <span>My Profile</span>
            </Link>

            <Link
              href="/profile?tab=settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-foreground"
            >
              <Settings size={15} className="text-muted-foreground" />
              <span>Settings</span>
            </Link>

            <Link
              href="/profile?tab=subscription"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-foreground"
            >
              <CreditCard size={15} className="text-muted-foreground" />
              <span>Subscription & Billing</span>
            </Link>

            <Link
              href="/profile?tab=support"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-foreground"
            >
              <Headphones size={15} className="text-muted-foreground" />
              <span>Help & Support</span>
            </Link>
          </div>

          {/* Sign Out Action */}
          <div className="border-t border-neutral-100 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
