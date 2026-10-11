import type { MetadataRoute } from "next";
import { PAGES } from "@/lib/pages";
import { pageUrl, SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({
    url: pageUrl(p.path),
    lastModified: SITE.updated,
    changeFrequency: "monthly",
    priority: p.path === "/" ? 1 : 0.8,
  }));
}
