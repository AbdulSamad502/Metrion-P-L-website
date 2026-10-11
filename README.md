# Metrion Free Profit & Loss Calculator

A free, no-login, single-page ecommerce P&L calculator for Amazon, Flipkart and Meesho sellers in India. Light theme, SEO-first, runs entirely in the browser. Separate from the main Metrion repository.

## Run

```bash
npm install
npm run dev -- -p 3100   # http://localhost:3100
npm test                 # engine tests (exact arithmetic, solver, float ban)
npm run typecheck
npm run lint
npm run build
```

> The folder name must not contain `&` (npm scripts break on Windows), hence `metrion-pnl`.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_SITE_ENV` | `production` enables indexing. Anything else emits `noindex` and `Disallow: /` | not set (noindex) |
| `NEXT_PUBLIC_SITE_URL` | Absolute origin for canonical, sitemap, Open Graph | `http://localhost:3000` |
| `NEXT_PUBLIC_BASE_PATH` | Serve under a sub-path, e.g. `/tools/profit-loss-calculator` | none |
| `NEXT_PUBLIC_METRION_URL` | Destination of the "Try Metrion" links | `https://metrion.in` |

## Layout

- `src/engine/` — the only place arithmetic happens. Integer paise, basis points, BigInt rationals. See `docs/CALCULATION.md`.
- `src/lib/form.ts` — converts typed text to engine inputs (parsing only).
- `src/components/calculator/` — UI. Components never calculate; they call `calculate()` and `solvePrice()`.
- `src/content/` — page copy, FAQ, glossary, per-marketplace guides (no fee rates anywhere).
- `src/lib/pages.ts` — page registry used by the sitemap; the way to add marketplace landing pages later.
- `docs/BRAND.md`, `docs/CALCULATION.md`, `docs/LAUNCH.md`.

## Principles

1. No rate is ever assumed: the seller enters their own fees.
2. Empty is never zero: results are Incomplete, Provisional (profit before named missing costs) or Estimate.
3. Example numbers are always labelled "not real marketplace rates".
4. Every figure comes from the same tested engine.

See `docs/LAUNCH.md` for the gates that must pass before the site is set to production and indexed.
