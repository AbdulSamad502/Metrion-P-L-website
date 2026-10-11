/** Page-level SEO copy. Each page in the registry supplies its own entry (see src/lib/seo.ts). */
export interface PageSeo {
  path: string;
  title: string;
  description: string;
  h1: string;
  keywords: string[];
}

export const HOME_SEO: PageSeo = {
  path: "/",
  title: "Ecommerce Profit Calculator India: Amazon, Flipkart, Meesho",
  description:
    "Free profit & loss calculator for Amazon, Flipkart and Meesho sellers in India. See profit per order after fees, GST, RTO and returns. No signup.",
  h1: "Ecommerce profit & loss calculator for Amazon, Flipkart and Meesho sellers",
  keywords: [
    "ecommerce profit calculator",
    "ecom P&L calculator",
    "Amazon seller profit calculator India",
    "Flipkart profit loss calculator",
    "Meesho profit calculator",
    "marketplace profit calculator with GST",
    "RTO loss calculator",
  ],
};
