import { marketingMetadata } from "@/lib/marketing-metadata";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { ExamplesGallery } from "@/components/marketing/examples-gallery";

export const metadata = marketingMetadata("/examples", "Examples & Showcase - maeaco AI Marketing", "Explore illustrative marketing image posts, captions and layout formats across business categories.");

export default function ExamplesPage() {
  return (
    <MarketingLayout>
      <ExamplesGallery />
    </MarketingLayout>
  );
}
