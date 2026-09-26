import { MarketingLayout } from "@/components/layout/marketing-layout";
import { HeroSection } from "@/components/marketing/hero-section";
import { PlatformsSection } from "@/components/marketing/platforms-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { CTASection } from "@/components/marketing/cta-section";

export default function HomePage() {
  return (
    <MarketingLayout>
      {/* Position 1 */}
      <HeroSection />

      {/* Position 2 */}
      <PlatformsSection />

      {/* Position 3 */}
      <HowItWorksSection />

      {/* Position 4: Dual Currency Pricing */}
      <PricingSection />

      {/* Position 5 */}
      <FeaturesSection />

      {/* Position 6 */}
      <TestimonialsSection />

      {/* Position 7 */}
      <CTASection />
    </MarketingLayout>
  );
}
