import { MarketingLayout } from "@/components/layout/marketing-layout";
import { ExamplesGallery } from "@/components/marketing/examples-gallery";

export const metadata = {
  title: "Examples & Showcase - maeaco AI Marketing",
  description:
    "Explore real reels, posts, and marketing campaigns created by maeaco AI for businesses across 20+ industries.",
};

export default function ExamplesPage() {
  return (
    <MarketingLayout>
      <ExamplesGallery />
    </MarketingLayout>
  );
}
