import type { ReactNode } from "react";
import { MarketingNav } from "@/components/navigation/marketing-nav";
import { Footer } from "@/components/marketing/footer";
import { MarketingMotion } from "@/components/marketing/marketing-motion";

interface MarketingLayoutProps {
  children: ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <MarketingMotion><div className="flex min-h-screen flex-col bg-white text-zinc-900 antialiased selection:bg-purple-600 selection:text-white">
      <a href="#marketing-main" className="marketing-skip-link">Skip to content</a>
      <MarketingNav />
      <main id="marketing-main" tabIndex={-1} className="flex-1">{children}</main>
      <Footer />
    </div></MarketingMotion>
  );
}
