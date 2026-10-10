import { marketingMetadata } from "@/lib/marketing-metadata";
import { MarketingPageHero } from "@/components/marketing/marketing-page-hero";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { CorePillarsSection } from "@/components/marketing/core-pillars-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { CTASection } from "@/components/marketing/cta-section";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = marketingMetadata("/features", "AI Features & Core Pillars - maeaco Autonomous Marketing", "Explore maeaco's 7 Core Pillars: Local SEO, Competitor Analysis, Daily Branded Posts, GMB Review Auto-Responder, and Organic Growth Engine.");

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <MarketingPageHero label="Features & AI Core" title="Your marketing workflow, connected." description="Research, branded content, scheduling and available analytics — built around your business, catalogue and connected accounts.">
        <Link href="/signup" className="marketing-action-primary">Get Started <ArrowRight className="h-4 w-4" /></Link>
        <Link href="/examples" className="marketing-action-secondary">Explore Examples</Link>
      </MarketingPageHero>

      {/* 1. THE 7 CORE PILLARS SECTION */}
      <CorePillarsSection />

      {/* 2. BENTO GRID & CENTRAL AI FLOW DIAGRAM SECTION */}
      <FeaturesSection />

      {/* 3. CTA BANNER */}
      <CTASection />
    </MarketingLayout>
  );
}
