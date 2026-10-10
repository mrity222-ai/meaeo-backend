import { marketingMetadata } from "@/lib/marketing-metadata";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { HeroSection } from "@/components/marketing/hero-section";
import { PlatformsSection } from "@/components/marketing/platforms-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { AIPreviewSection } from "@/components/marketing/ai-preview-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { CTASection } from "@/components/marketing/cta-section";
import { AboutSection } from "@/components/marketing/about-section";

export const metadata = marketingMetadata("/", "maeaco | AI Marketing for Your Business", "Plan campaigns, create branded catalogue posts, review content, publish to connected channels and track available analytics. Premium starts at ₹999/month.");

export default function HomePage() {
  return (
    <MarketingLayout>
      {/* Position 1: Hero Header & Headline */}
      <HeroSection />

      {/* Position 2: Supported Platforms Marquee */}
      <PlatformsSection />

      {/* Position 3: Interactive Live AI Post Demo */}
      <AIPreviewSection />

      {/* Position 4: Workflow Steps */}
      <HowItWorksSection />

      {/* Position 5: Dual Currency Pricing */}

      {/* Position 6: Bento Grid & Central AI Flow Diagram */}
      <FeaturesSection />
      <AboutSection />

      {/* Position 7: Testimonials */}
      <TestimonialsSection />
      <PricingSection />

      {/* Position 8: FAQ Accordion */}
      <FAQSection />

      {/* Position 9: Final CTA Banner */}
      <CTASection />
    </MarketingLayout>
  );
}
