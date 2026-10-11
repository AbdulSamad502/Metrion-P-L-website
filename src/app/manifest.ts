import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.tool,
    short_name: "Metrion P&L",
    description: "Free profit and loss calculator for Amazon, Flipkart and Meesho sellers in India.",
    start_url: SITE.basePath || "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [{ src: "icon.png", sizes: "512x512", type: "image/png" }],
  };
}
