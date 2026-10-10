"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";


const navigation = [
  { label: "Pricing", targetId: "pricing" },
  { label: "How it works", targetId: "how-it-works" },
  { label: "About", targetId: "about" },
];

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-card/90 backdrop-blur-xl text-foreground transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo: maeaco */}
        <Link
          href="/"
          aria-label="maeaco home"
          className="flex shrink-0 items-center transition-transform hover:scale-[1.01]"
          onClick={() => setMobileOpen(false)}
        >
          <img
            src="/logo/website logo.png"
            alt="maeaco logo"
            width={2170}
            height={725}
            className="h-auto w-[140px] object-contain sm:w-[155px] lg:w-[165px]"
          />

        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-5 lg:gap-7 xl:gap-8 min-[1100px]:flex">
          <Link
            href="/features"
            aria-current={pathname === "/features" ? "page" : undefined}
            className={`marketing-nav-link text-sm font-medium transition-colors ${pathname === "/features" ? "text-purple-700" : "text-zinc-700"}`}
          >
            Features & AI Core
          </Link>

          <Link
            href="/examples"
            aria-current={pathname === "/examples" ? "page" : undefined}
            className={`marketing-nav-link text-sm font-medium transition-colors ${pathname === "/examples" ? "text-purple-700" : "text-zinc-700"}`}
          >
            Examples & Showcase
          </Link>

          {navigation.map((item) => (
            <a
              key={item.label}
              href={`/#${item.targetId}`}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-zinc-700 transition-colors hover:text-purple-600 cursor-pointer"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-4 min-[1100px]:flex">
          <Link
            href="/login"
            className="px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-950"
          >
            Sign in
          </Link>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6929E8] via-[#8527D6] to-[#D925A3] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-600/25 transition-all hover:opacity-95 hover:shadow-lg hover:shadow-purple-600/35 hover:scale-[1.02]"
          >
            <span>Get Started</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="marketing-mobile-menu"
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-lg p-2 text-zinc-700 transition-colors hover:bg-zinc-100 min-[1100px]:hidden"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="marketing-mobile-menu" className="border-t border-border bg-card px-6 py-6 min-[1100px]:hidden shadow-xl">
          <nav className="flex flex-col gap-3">
            <Link
              href="/features"
              onClick={() => setMobileOpen(false)}
              aria-current={pathname === "/features" ? "page" : undefined}
              className={`marketing-nav-link rounded-lg px-3 py-2 text-base font-medium ${pathname === "/features" ? "bg-purple-50 text-purple-700" : "text-zinc-700"}`}
            >
              Features & AI Core
            </Link>

            <Link
              href="/examples"
              onClick={() => setMobileOpen(false)}
              aria-current={pathname === "/examples" ? "page" : undefined}
              className={`marketing-nav-link rounded-lg px-3 py-2 text-base font-medium ${pathname === "/examples" ? "bg-purple-50 text-purple-700" : "text-zinc-700"}`}
            >
              Examples & Showcase
            </Link>

            {navigation.map((item) => (
              <a
                key={item.label}
                href={`/#${item.targetId}`}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-purple-600 cursor-pointer"
              >
                {item.label}
              </a>
            ))}

            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
              <Link
                href="/login"
                className="ui-button-secondary border border-zinc-300 py-2.5 text-center text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>

              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6929E8] via-[#8527D6] to-[#D925A3] py-2.5 text-center text-sm font-semibold text-white shadow-md"
                onClick={() => setMobileOpen(false)}
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
