import { HOME_SEO, type PageSeo } from "@/content/seo";

/**
 * Page registry. The sitemap, canonical URLs and metadata are generated from this list.
 *
 * To add a dedicated marketplace landing page later:
 *  1. write its unique content (never a re-skin of the home page: thin duplicates hurt SEO),
 *  2. add a PageSeo entry here,
 *  3. render it with <Calculator defaultMarketplace="..."> and the same engine.
 * Only the home page ships in v1.
 */
export const PAGES: PageSeo[] = [HOME_SEO];

export const ENABLED_MARKETPLACE_PAGES: string[] = [];
