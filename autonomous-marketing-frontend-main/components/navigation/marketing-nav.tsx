"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const navigation = [
  { label: "Pricing", targetId: "pricing" },
  { label: "Resources", targetId: "how-it-works" },
  { label: "About", targetId: "about" },
];

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/") {
      const targetSection = sessionStorage.getItem("targetSection");
      if (targetSection) {
        sessionStorage.removeItem("targetSection");
        setTimeout(() => {
          const element = document.getElementById(targetSection);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
            window.history.replaceState(null, "", "/");
          }
        }, 150);
      }
    }
  }, [pathname]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileOpen(false);

    if (pathname === "/") {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.history.replaceState(null, "", "/");
      }
    } else {
      sessionStorage.setItem("targetSection", targetId);
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl text-zinc-900 transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo: maeaco */}
        <Link
          href="/"
          className="flex items-center gap-3 transition-transform hover:scale-[1.01]"
          onClick={() => setMobileOpen(false)}
        >
          <img
            src="/logo/app logo.png"
            alt="maeaco logo"
            className="h-10 w-10 object-contain"
          />
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-zinc-950 leading-none">
              maeaco
            </span>
            <span className="text-[11px] font-medium text-zinc-500 tracking-tight mt-0.5">
              AI Marketing Platform
            </span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/features"
            className="text-sm font-semibold text-purple-600 transition-colors hover:text-purple-700"
          >
            Features & AI Core
          </Link>

          <Link
            href="/examples"
            className="text-sm font-medium text-zinc-700 transition-colors hover:text-purple-600"
          >
            Examples & Showcase
          </Link>

          {navigation.map((item) => (
            <a
              key={item.label}
              href={`#${item.targetId}`}
              onClick={(e) => handleNavClick(e, item.targetId)}
              className="text-sm font-medium text-zinc-700 transition-colors hover:text-purple-600 cursor-pointer"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-4 md:flex">
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
            <span>Start Free Trial</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-lg p-2 text-zinc-700 transition-colors hover:bg-zinc-100 md:hidden"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-zinc-200 bg-white px-6 py-6 md:hidden shadow-xl">
          <nav className="flex flex-col gap-3">
            <Link
              href="/features"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-bold text-purple-600 hover:bg-purple-50"
            >
              Features & AI Core
            </Link>

            <Link
              href="/examples"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium text-zinc-700 hover:bg-zinc-100 hover:text-purple-600"
            >
              Examples & Showcase
            </Link>

            {navigation.map((item) => (
              <a
                key={item.label}
                href={`#${item.targetId}`}
                onClick={(e) => handleNavClick(e, item.targetId)}
                className="rounded-lg px-3 py-2 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-purple-600 cursor-pointer"
              >
                {item.label}
              </a>
            ))}

            <div className="mt-4 flex flex-col gap-3 border-t border-zinc-200 pt-4">
              <Link
                href="/login"
                className="rounded-full border border-zinc-300 py-2.5 text-center text-sm font-medium text-zinc-800"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>

              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6929E8] via-[#8527D6] to-[#D925A3] py-2.5 text-center text-sm font-semibold text-white shadow-md"
                onClick={() => setMobileOpen(false)}
              >
                <span>Start Free Trial</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
