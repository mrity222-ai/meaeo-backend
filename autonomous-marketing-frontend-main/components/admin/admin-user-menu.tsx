"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, ShieldCheck, User, Settings, ChevronDown } from "lucide-react";

export function AdminUserMenu() {
  const [open, setOpen] = useState(false);
  const [adminUser, setAdminUser] = useState({
    name: "Super Administrator",
    email: "admin@marketingsystem.com",
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("admin_user");
      if (stored) {
        setAdminUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    window.location.href = "/admin/login";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white p-1.5 pr-3 text-left transition hover:bg-neutral-50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-950 font-bold text-xs text-white">
          SA
        </div>
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-xs font-semibold text-neutral-900">{adminUser.name}</p>
          <p className="truncate text-[10px] font-medium text-purple-700 uppercase tracking-wide">
            Super Admin
          </p>
        </div>
        <ChevronDown size={14} className="text-neutral-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="border-b border-neutral-100 p-3">
              <p className="text-xs font-semibold text-neutral-950">{adminUser.name}</p>
              <p className="text-xs text-neutral-500">{adminUser.email}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                <ShieldCheck size={12} />
                Full System Control
              </span>
            </div>

            <div className="py-1">
              <Link
                href="/admin/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50"
              >
                <Settings size={15} />
                System Settings
              </Link>
            </div>

            <div className="border-t border-neutral-100 pt-1">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left"
              >
                <LogOut size={15} />
                Sign Out Admin
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
