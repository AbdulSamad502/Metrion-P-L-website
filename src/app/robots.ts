import type { MetadataRoute } from "next";
import { pageUrl, SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!SITE.isProduction) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${pageUrl("/")}/sitemap.xml`,
  };
}
