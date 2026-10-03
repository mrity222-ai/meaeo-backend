"use client";

import Link from "next/link";
import { Instagram, Facebook, Linkedin, Youtube, ArrowRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();

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
    <footer className="bg-[#FAF8FF] border-t border-purple-100 text-zinc-600">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          
          {/* Brand Info Column */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-3 font-bold text-zinc-900">
              <img
                src="/logo/app logo.png"
                alt="maeaco logo"
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg tracking-tight font-black">maeaco</span>
            </Link>

            <p className="mt-3 text-sm text-zinc-500 max-w-sm">
              Your autonomous AI marketing team.
            </p>

            {/* Social Icons */}
            <div className="mt-6 flex items-center gap-3 text-zinc-500">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-lg p-2 hover:bg-purple-100/70 hover:text-purple-600 transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-lg p-2 hover:bg-purple-100/70 hover:text-purple-600 transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="rounded-lg p-2 hover:bg-purple-100/70 hover:text-purple-600 transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="rounded-lg p-2 hover:bg-purple-100/70 hover:text-purple-600 transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="lg:col-span-2">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-900">Product</div>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/examples" className="hover:text-purple-600 font-semibold text-purple-700 transition-colors">
                  Examples & Showcase
                </Link>
              </li>
              <li>
                <Link
                  href="/features"
                  className="hover:text-purple-600 transition-colors"
                >
                  Features & AI Core
                </Link>
              </li>
              <li>
                <a
                  href="#pricing"
                  onClick={(e) => handleNavClick(e, "pricing")}
                  className="hover:text-purple-600 transition-colors cursor-pointer"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleNavClick(e, "how-it-works")}
                  className="hover:text-purple-600 transition-colors cursor-pointer"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleNavClick(e, "about")}
                  className="hover:text-purple-600 transition-colors cursor-pointer"
                >
                  About Platform
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="lg:col-span-2">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-900">Resources</div>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/contact" className="hover:text-purple-600 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-purple-600 transition-colors">
                  Guides & Support
                </Link>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleNavClick(e, "features")}
                  className="hover:text-purple-600 transition-colors cursor-pointer"
                >
                  AI Features
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Support Links */}
          <div className="lg:col-span-2">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-900">Legal & Support</div>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/privacy" className="hover:text-purple-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-purple-600 transition-colors">Terms of Service</Link></li>
              <li><Link href="/data-deletion" className="hover:text-purple-600 transition-colors">Data Deletion</Link></li>
              <li><Link href="/refund-policy" className="hover:text-purple-600 transition-colors">Refund Policy</Link></li>
              <li><Link href="/contact" className="hover:text-purple-600 transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Newsletter Subscribe */}
          <div className="lg:col-span-2">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-900">Stay updated</div>
            <p className="mt-2 text-xs text-zinc-500">
              Get the latest product updates and marketing tips.
            </p>

            <form onSubmit={(e) => e.preventDefault()} className="mt-4 flex items-center gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-purple-500 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-purple-100 pt-8 text-xs text-zinc-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} <strong>maeaco</strong>. A product of{" "}
            <a
              href="https://www.avedatechnologies.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-purple-700 hover:underline"
            >
              Aveda Technologies
            </a>
            . All rights reserved.
          </p>
          <p className="flex items-center gap-1">
            Built with <span className="text-purple-600">💜</span> for global businesses
          </p>
        </div>

      </div>
    </footer>
  );
}
