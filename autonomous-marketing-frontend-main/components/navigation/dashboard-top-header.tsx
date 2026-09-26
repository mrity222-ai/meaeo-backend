"use client";

import { ReactNode } from "react";
import { Menu, Sparkles } from "lucide-react";
import { UserAccountMenu } from "./user-account-menu";

interface DashboardTopHeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
  actions?: ReactNode;
}

export function DashboardTopHeader({
  title,
  subtitle,
  onMenuClick = () => {},
  actions,
}: DashboardTopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-neutral-200/90 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Mobile menu toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 md:hidden"
        >
          <Menu size={18} />
        </button>

        {title ? (
          <div>
            <h1 className="text-sm font-bold text-neutral-950 sm:text-base leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden text-[11px] text-neutral-500 sm:block leading-tight">
                {subtitle}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 md:hidden">
            <img
              src="/logo/app logo.png"
              alt="meaeco logo"
              className="h-7 w-7 rounded-lg object-contain"
            />
            <span className="text-base font-bold tracking-tight text-neutral-950">meaeco</span>
          </div>
        )}
      </div>

      {/* Right Side: Page Actions + My Account (Top-Right) */}
      <div className="flex items-center gap-3">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* My Account Profile Dropdown (Right Side) */}
        <UserAccountMenu />
      </div>
    </header>
  );
}
