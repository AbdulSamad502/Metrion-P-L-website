# Calculation specification

Single source of truth for every figure on screen, in What-if and in print: `src/engine/calculate.ts` (display), `model.ts` (arithmetic), `solve.ts` (break-even / Find My Price). Components contain no arithmetic.

## Arithmetic
- Money = integer paise (`bigint`). Percentages = integer basis points (1 bp = 0.01%). Intermediates are exact BigInt rationals (`rational.ts`). **No floating point** (enforced by `noFloat.test.ts`).
- Rounding: half away from zero, to the paisa, **per displayed line**. A view's profit is revenue minus its rounded lines, so the screen always adds up. Margins are computed from exact totals.
- Selling price is what the customer pays per unit, including GST. There is no separate discount field; enter the price after any seller-funded discount.

## Orders (per month)
`N` placed, `RTO = N·rto%`, `Returned = N·return%`, `K = N − RTO − Returned` (delivered and kept). `RTO% + return% ≤ 100%`. Fractional counts are kept exact.
Views: **per kept order** (`÷K`), **per order placed** (`÷N`), **monthly** (totals). Monthly figures come from rational totals, not per-order × K. If `monthlyOrders` is empty, one order is used for per-order figures and the monthly view and monthly costs are unavailable.

## Revenue and GST
- Registered (with or without ITC): revenue per kept order = `P ÷ (1 + GST)`. Output GST is not income.
- Not registered: revenue = `P`; no ITC; costs and fees are as paid.
- Costs are entered as paid including GST. Marketplace fees are entered **excluding** GST; GST on services (default 18%, editable) is added.
- With ITC: product cost, packaging, advertising and GST on fees are shown net, and the GST is reported as "GST recovered". Without ITC: GST on fees is its own cost line; product, packaging and ads are as paid.
- **Assumption (CA review item):** no ITC is taken on stock written off through returns/RTO; those units lose their gross cost.
- Composition-scheme sellers are not supported. TCS/TDS are cash items and are not in profit.

## Cost lines (monthly totals)
- Product cost = `K × net cost per unit`.
- Stock lost = per RTO and per returned unit: `lost% × gross cost + damaged% × (gross cost − salvage% × net cost)`; resold units cost nothing. Quick mode default: 80% resold, rest lost (flagged assumed).
- Packaging = `N × net packaging`.
- Each fee field is charged on shipped orders (`N`), kept orders (`K`) or returned/RTO orders. Percent fees apply to the selling price incl. GST (default, changeable per fee) or excl. GST. Optional price bands are `whole` (the band's rate applies to the whole price) or `marginal` (progressive, percent only). `refund%` is the share refunded on returned/RTO orders (default 0%, flagged assumed); refunds appear as a credit line.
- Advertising = monthly spend (net of ITC), not scaled with order outcomes.

**Contribution profit** = revenue − product − stock lost − packaging − fees (net of refunds, plus non-recoverable GST) − advertising.
**Operating profit** = contribution − operating expenses (as incurred). Shown only when operating expenses are entered or marked N/A. Never called "net profit".

## Result status
Each input is empty / value / not-applicable. Empty is never zero.
- `incomplete`: price, GST rate (if registered) or product cost missing/invalid, outcome rates over 100%, invalid tiers. No profit figure.
- `provisional`: required inputs present, but a material input is empty (main fees, shipping, packaging in Detailed, advertising in Detailed, RTO and return rates, return handling fee when returns > 0). Shown as "profit before: …".
- `estimate`: all material inputs entered or N/A. Quick mode omits packaging, advertising, operating costs and return handling (stated in `scopeNote`).
- Zero kept orders: per-kept figures and margins are not applicable; monthly loss and loss per order placed are shown; break-even and Find My Price are unavailable.

## Metrics
Effective fee % = fee lines ÷ revenue. ACOS = ad spend ÷ ad-attributed revenue (both incl. GST). TACoS = ad spend ÷ (K × price incl. GST). ROAS = ad revenue ÷ ad spend. Break-even ROAS = (net cost of ₹1 of ads) ÷ (contribution-before-ads ÷ sales incl. GST). Max CAC = contribution before ads per kept order ÷ net-cost factor.

## Solvers
Profit is piecewise linear in price (fee bands). `solvePrice` splits the price axis at every band edge (mapping excl-GST bases onto the price axis), solves each segment exactly (`a·P + b ≥ target`), merges feasible integer-paise ranges, returns the lowest price and all ranges, `always`, `unreachable` or `unavailable`. Break-even is also checked against the rounded figures the seller sees. Assumes order volume does not change with price. Verified against an exhaustive paisa scan (`solve.test.ts`).

## Hand-checked fixtures (see `calculate.test.ts`)
- A1: price ₹1,180 (18% GST, ITC), cost ₹354, packaging ₹23.60, referral 10%, closing ₹20, shipping ₹50, no returns → revenue ₹1,000, contribution **₹492.00** per kept order (49.20%), GST recovered ₹91.44.
- A2: A1 with 10% RTO, 10% returns, recovery/salvage as in the test → monthly contribution **₹31,960**, **₹399.50** per kept order (39.95%), ₹319.60 per order placed.
- Unregistered: contribution ₹580.56. Registered without ITC: ₹400.56.
- Break-even for the Flipkart example in `solve.test.ts` is ₹140.14; 20% target margin price is ₹181.24.

All example numbers are fictional test inputs, not marketplace rates.
