/**
 * Site-wide configuration. Everything deployment-specific comes from env vars so the
 * calculator can move (e.g. to metrion.in/tools/profit-loss-calculator) without code changes.
 *
 *  NEXT_PUBLIC_SITE_URL    absolute origin, e.g. https://metrion.in        (default: http://localhost:3000)
 *  NEXT_PUBLIC_BASE_PATH   path the site is served under, e.g. /tools/profit-loss-calculator (also set in next.config.ts)
 *  NEXT_PUBLIC_SITE_ENV    "production" enables indexing; anything else emits noindex
 *  NEXT_PUBLIC_METRION_URL where the "Try Metrion" links point
 */
const stripSlash = (s: string) => s.replace(/\/+$/, "");

export const SITE = {
  name: "Metrion",
  tool: "Metrion Profit & Loss Calculator",
  origin: stripSlash(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  basePath: stripSlash(process.env.NEXT_PUBLIC_BASE_PATH ?? ""),
  isProduction: process.env.NEXT_PUBLIC_SITE_ENV === "production",
  metrionUrl: process.env.NEXT_PUBLIC_METRION_URL ?? "https://metrion.in",
  updated: "2026-10-11",
} as const;

/** Absolute URL of a page path inside this site (path starts with "/"). */
export function pageUrl(path = "/"): string {
  const p = path === "/" ? "" : path;
  return `${SITE.origin}${SITE.basePath}${p}` || SITE.origin;
}
