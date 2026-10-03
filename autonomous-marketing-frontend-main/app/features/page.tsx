import { MarketingLayout } from "@/components/layout/marketing-layout";
import { CorePillarsSection } from "@/components/marketing/core-pillars-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { CTASection } from "@/components/marketing/cta-section";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "AI Features & Core Pillars - maeaco Autonomous Marketing",
  description:
    "Explore maeaco's 7 Core Pillars: Local SEO, Competitor Analysis, Daily Branded Posts, GMB Review Auto-Responder, and Organic Growth Engine.",
};

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      {/* FEATURES PAGE HERO HEADER */}
      <section className="bg-gradient-to-b from-[#110726] via-[#0D051E] to-[#14082D] py-16 lg:py-24 text-white text-center relative overflow-hidden">
        {/* Glow Blobs */}
        <div className="pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-purple-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-pink-600/25 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-950/60 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-purple-300 uppercase tracking-widest mb-6">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Complete AI Platform Capabilities</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            The Complete AI Marketing Workforce for Your Business
          </h1>

          <p className="mt-5 text-base sm:text-lg text-purple-200 font-normal leading-relaxed max-w-2xl mx-auto">
            Replace expensive agencies. maeaco AI analyzes competitors, designs daily branded posts with your logo, optimizes GMB listings, and auto-replies to reviews 24/7.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:scale-105"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/examples"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10"
            >
              <span>See Live Examples</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 1. THE 7 CORE PILLARS SECTION */}
      <CorePillarsSection />

      {/* 2. BENTO GRID & CENTRAL AI FLOW DIAGRAM SECTION */}
      <FeaturesSection />

      {/* 3. CTA BANNER */}
      <CTASection />
    </MarketingLayout>
  );
}
