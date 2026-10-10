import type { Metadata } from "next";

// Set SITE_URL to the public production origin in deployment, never to the API origin.
export const siteUrl = new URL(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
export const publicPaths = ["/", "/features", "/examples", "/contact", "/privacy", "/terms", "/refund-policy", "/data-deletion"];
export function marketingMetadata(path: string, title: string, description: string): Metadata {
  return {
    title, description, metadataBase: siteUrl,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: "maeaco", type: "website", images: [{ url: "/logo/app%20logo.png", alt: "maeaco AI Marketing" }] },
    twitter: { card: "summary", title, description, images: ["/logo/app%20logo.png"] },
  };
}
