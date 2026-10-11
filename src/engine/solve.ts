import { makeView } from "./calculate";
import { evaluate, prepare, priceBreakpoints, type Prepared } from "./model";
import * as R from "./rational";
import type { Rat } from "./rational";
import { set, type CalcInputs } from "./types";

/**
 * Break-even price and Find My Price.
 *
 * Profit is NOT assumed to be one straight line in price. Fee price-bands make
 * it piecewise: this solver splits the price axis at every band edge, solves
 * each segment exactly (profit is linear inside a segment), then checks the
 * answer against the same engine used for display.
 */

export type SolveTarget =
  | { kind: "breakeven" }
  /** Margin in basis points of revenue (2000 = 20%). */
  | { kind: "margin"; bps: bigint };

export type SolveProfitBasis = "contribution" | "operating";

export interface PriceRange {
  /** Lowest price in the range, paise. */
  from: bigint;
  /** Highest price in the range, paise. null = no upper limit. */
  to: bigint | null;
}

export type SolveResult =
  | {
      kind: "price";
      /** Lowest selling price (paise) that meets the target. */
      price: bigint;
      /** Every price range that meets the target (can be several when fee bands cause jumps). */
      ranges: PriceRange[];
      /** True when some costs were not entered, so the price excludes them. */
      excludesMissingCosts: boolean;
    }
  | { kind: "always"; excludesMissingCosts: boolean }
  | { kind: "unreachable"; reason: string }
  | { kind: "unavailable"; reason: "incomplete" | "no_kept_orders" | "operating_unavailable" };

const PLACEHOLDER_PRICE = 10000n;

interface Gfn {
  (price: bigint): Rat;
}

function buildG(p: Prepared, target: SolveTarget, basis: SolveProfitBasis): Gfn | null {
  const m = target.kind === "margin" ? R.fromBps(target.bps) : R.ZERO;
  let opex = R.ZERO;
  if (basis === "operating") {
    if (p.opex === null || !p.opexAnswered) return null;
    opex = p.opex;
  }
  return (price) => {
    const t = evaluate(p, price);
    return R.sub(R.sub(t.contribution, opex), R.mul(m, t.revenue));
  };
}

function mergeRanges(ranges: PriceRange[]): PriceRange[] {
  const out: PriceRange[] = [];
  for (const r of ranges) {
    const last = out[out.length - 1];
    if (last && last.to !== null && last.to + 1n >= r.from) {
      last.to = r.to === null ? null : last.to > r.to ? last.to : r.to;
    } else out.push({ ...r });
  }
  return out;
}

export function solvePrice(
  inputs: CalcInputs,
  target: SolveTarget,
  basis: SolveProfitBasis = "contribution",
): SolveResult {
  const probe: CalcInputs =
    inputs.sellingPrice.state === "set" ? inputs : { ...inputs, sellingPrice: set(PLACEHOLDER_PRICE) };
  const prep = prepare(probe);
  const p = prep.prepared;
  if (p === null) return { kind: "unavailable", reason: "incomplete" };
  if (R.sign(p.K) <= 0) return { kind: "unavailable", reason: "no_kept_orders" };
  const g = buildG(p, target, basis);
  if (g === null) return { kind: "unavailable", reason: "operating_unavailable" };
  const excludesMissingCosts = prep.missingCosts.length > 0;

  // Segment edges: P <= edge belongs to the lower segment.
  const edges = [...new Set(priceBreakpoints(p).map((x) => R.floor(x)))]
    .filter((e) => e >= 1n)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const segments: Array<{ lo: bigint; hi: bigint | null }> = [];
  let lo = 1n;
  for (const e of edges) {
    if (e >= lo) segments.push({ lo, hi: e });
    lo = e + 1n > lo ? e + 1n : lo;
  }
  segments.push({ lo, hi: null });

  const found: PriceRange[] = [];
  for (const seg of segments) {
    const g0 = g(seg.lo);
    const single = seg.hi !== null && seg.hi === seg.lo;
    if (single) {
      if (R.sign(g0) >= 0) found.push({ from: seg.lo, to: seg.lo });
      continue;
    }
    const a = R.sub(g(seg.lo + 1n), g0); // slope per paisa inside the segment
    const b = R.sub(g0, R.mul(a, R.rat(seg.lo))); // g(P) = a*P + b
    const s = R.sign(a);
    if (s > 0) {
      const from = R.ceil(R.neg(R.div(b, a)));
      const start = from > seg.lo ? from : seg.lo;
      if (seg.hi === null || start <= seg.hi) found.push({ from: start, to: seg.hi });
    } else if (s === 0) {
      if (R.sign(b) >= 0) found.push({ from: seg.lo, to: seg.hi });
    } else {
      const limit = R.floor(R.div(b, R.neg(a))); // largest P with g >= 0
      const end = seg.hi === null || limit < seg.hi ? limit : seg.hi;
      if (end >= seg.lo) found.push({ from: seg.lo, to: end });
    }
  }
  const ranges = mergeRanges(found);
  if (ranges.length === 0) {
    return {
      kind: "unreachable",
      reason: "No selling price reaches this target with the costs and fees entered.",
    };
  }

  // Break-even is also checked on the rounded figures the seller sees, so the
  // screen never shows a profit of minus one paisa at the "break-even" price.
  const first = ranges[0] as PriceRange;
  if (target.kind === "breakeven" && basis === "contribution") {
    let price = first.from;
    for (let i = 0; i < 20; i++) {
      const view = makeView(evaluate(p, price), p.K, null);
      if (view.contribution >= 0n) break;
      price += 1n;
    }
    if (first.to === null || price <= first.to) first.from = price;
  }

  if (first.from <= 1n && first.to === null) return { kind: "always", excludesMissingCosts };
  return { kind: "price", price: first.from, ranges, excludesMissingCosts };
}
