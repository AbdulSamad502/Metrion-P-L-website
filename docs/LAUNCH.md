# Launch gates

The site ships with `NEXT_PUBLIC_SITE_ENV` unset, so it is `noindex` everywhere. Set it to `production` only when every gate below is ticked.

| # | Gate | Status |
|---|---|---|
| 1 | Engine tests green (unit, solver, exhaustive-scan property test, float ban) | Done — `npm test` |
| 2 | Hand checks per marketplace to the paisa (≥3 each) in `CALCULATION.md` | Partial — Amazon-style fixtures A1/A2 and GST variants done; add Flipkart and Meesho scenarios checked by a person |
| 3 | GST/ITC wording and the "no ITC on written-off stock" treatment reviewed by a chartered accountant | **Open** |
| 4 | Real-seller validation: 3–5 sellers compare with their own settlement records; log in `docs/VALIDATION.md` (tolerance: within ₹1 per order or 1%, after explained assumptions) | **Open** |
| 5 | Honesty checks: disclaimer visible, example data labelled, Provisional/Incomplete states exercised | Done in build; re-check after copy edits |
| 6 | Lighthouse ≥ 95 (mobile) in all four categories; axe: no serious issues; cross-browser | **Open** — not run yet |
| 7 | JSON-LD and Open Graph validated in Google Rich Results Test / social debuggers | **Open** (output inspected locally) |
| 8 | Domain and brand confirmed; "Try Metrion" destination set; no claim about unlaunched Metrion features | **Open** |

## After launch
Search Console and Bing Webmaster verification, submit `sitemap.xml`, link from the main Metrion site (ideally `metrion.in/tools/...` via a rewrite with `NEXT_PUBLIC_BASE_PATH`), earn a few quality links from seller communities. Rankings take weeks to months and are never guaranteed.

## Adding marketplace landing pages later
Add unique content under `src/content/marketplaces/`, a `PageSeo` entry in `src/lib/pages.ts`, and a route that renders `<Calculator defaultMarketplace="…">`. Do not publish thin duplicates of the home page.
