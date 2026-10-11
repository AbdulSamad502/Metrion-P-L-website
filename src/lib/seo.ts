import type { Metadata } from "next";
import type { PageSeo } from "@/content/seo";
import { FAQS } from "@/content/faq";
import { pageUrl, SITE } from "./site";

export function buildMetadata(page: PageSeo): Metadata {
  const url = pageUrl(page.path);
  return {
    metadataBase: new URL(SITE.origin),
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: url },
    // Non-production builds are never indexed, so an unvalidated build cannot rank.
    robots: SITE.isProduction ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url,
      siteName: SITE.name,
      title: page.title,
      description: page.description,
    },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
  };
}

export function buildJsonLd(page: PageSeo): object {
  const url = pageUrl(page.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.origin}/#organization`,
        name: SITE.name,
        url: SITE.metrionUrl,
        logo: `${pageUrl("/")}/metrion-mark-160.png`,
      },
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: SITE.tool,
        url,
        description: page.description,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript",
        inLanguage: "en-IN",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        publisher: { "@id": `${SITE.origin}/#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}
