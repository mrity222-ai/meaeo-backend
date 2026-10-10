import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/marketing-metadata";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/dashboard", "/campaigns", "/catalogue", "/connections", "/analytics", "/calendar", "/content", "/profile", "/onboarding", "/subscription", "/google-business", "/oauth/"] }, sitemap: new URL("/sitemap.xml", siteUrl).href };
}
