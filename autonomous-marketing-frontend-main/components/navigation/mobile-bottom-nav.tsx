"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Link2,
  Megaphone,
  Store,
} from "lucide-react";

const mobileNavItems = [
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
    label: "Connections",
    href: "/connections",
    icon: Link2,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Google Biz",
    href: "/google-business",
    icon: Store,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-neutral-200/90 bg-white/95 backdrop-blur-md shadow-lg"
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto px-1 items-center">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex flex-col items-center justify-center gap-1 h-full py-1 text-center transition-all select-none active:scale-95",
                isActive
                  ? "text-neutral-950 font-bold"
                  : "text-neutral-500 hover:text-neutral-800",
              ].join(" ")}
            >
              <div
                className={[
                  "relative flex items-center justify-center rounded-xl transition-all",
                  isActive
                    ? "text-neutral-950"
                    : "text-neutral-500",
                ].join(" ")}
              >
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.3 : 1.8}
                />
                {isActive && (
                  <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-neutral-950" />
                )}
              </div>

              <span
                className={[
                  "text-[10px] tracking-tight leading-none truncate max-w-[62px]",
                  isActive ? "font-bold text-neutral-950" : "font-medium text-neutral-500",
                ].join(" ")}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
