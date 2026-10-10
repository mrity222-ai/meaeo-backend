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
    <header className="sticky top-0 z-30 flex min-h-16 w-full flex-wrap items-center justify-between gap-2 border-b border-border bg-card/95 px-4 py-2 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Mobile menu toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="ui-button-secondary flex h-11 w-11 items-center justify-center border border-border text-muted-foreground md:hidden"
        >
          <Menu size={18} />
        </button>

        {title ? (
          <div>
            <h1 className="text-sm font-bold text-foreground sm:text-base leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden text-[11px] text-muted-foreground sm:block leading-tight">
                {subtitle}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 md:hidden">
            <img
              src="/logo/app logo.png"
              alt="maeaco logo"
              className="h-7 w-7 rounded-lg object-contain"
            />
            <span className="text-base font-bold tracking-tight text-foreground">maeaco</span>
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
