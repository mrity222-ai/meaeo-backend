"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Sparkles, X } from "lucide-react";
import { adminNavigationGroups } from "@/lib/admin/admin-navigation";

type AdminSidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export function AdminSidebar({ open = false, onClose = () => {} }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard" || pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col",
          "border-r border-neutral-200 bg-neutral-950 text-white",
          "transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        ].join(" ")}
      >
        {/* Admin Brand */}
        <div className="flex h-[62px] items-center justify-between border-b border-neutral-800 px-5">
          <Link
            href="/admin/dashboard"
            onClick={onClose}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30">
              <ShieldCheck size={18} strokeWidth={2.2} />
            </div>

            <div>
              <span className="text-sm font-bold tracking-tight text-white block">
                Admin Console
              </span>
              <span className="text-[10px] font-mono text-purple-400 block -mt-0.5">
                v1.0 System Control
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {adminNavigationGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {group.title}
              </p>

              <nav className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={[
                        "flex h-9 items-center gap-3 rounded-xl px-3 text-xs font-medium transition-all",
                        active
                          ? "bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/20"
                          : "text-neutral-300 hover:bg-neutral-900 hover:text-white",
                      ].join(" ")}
                    >
                      <Icon size={16} strokeWidth={1.8} />
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom System Status */}
        <div className="border-t border-neutral-800 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-neutral-900 p-3 border border-neutral-800">
            <div className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-neutral-200">System Healthy</p>
              <p className="truncate text-[10px] text-neutral-400">FastAPI & Workers Online</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
