import * as R from "./rational";
import type { Rat } from "./rational";
import type { Line, View } from "./types";

/** Presentation helpers that still involve numbers. They live here so components contain no arithmetic. */

export interface CostShare {
  line: Line;
  /** Share of revenue in basis points (can exceed 10000 when costs exceed revenue). */
  shareBps: bigint;
}

/** Cost lines (credits excluded) ranked largest first, with their share of revenue. */
export function rankCosts(view: View): CostShare[] {
  const rev = view.revenue;
  return view.lines
    .filter((l) => l.amount > 0n)
    .map((line) => ({ line, shareBps: rev > 0n ? (line.amount * 10000n + rev / 2n) / rev : 0n }))
    .sort((a, b) => (a.line.amount === b.line.amount ? 0 : a.line.amount < b.line.amount ? 1 : -1));
}

/** Difference b - a in paise. */
export const diff = (a: bigint, b: bigint): bigint => b - a;

/** Width of a bar as a whole percent (0-100) of the track, for CSS. */
export function barPercent(amount: bigint, scale: bigint): bigint {
  if (scale <= 0n || amount <= 0n) return 0n;
  const pct = (amount * 100n) / scale;
  return pct > 100n ? 100n : pct;
}

/** "435" or "435.5" — order counts can be fractional. */
export function formatCount(r: Rat): string {
  const hundredths = R.roundHalfUp(R.mul(r, R.rat(100n)));
  const whole = hundredths / 100n;
  const frac = hundredths % 100n;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(2, "0").replace(/0$/, "")}`;
}

export interface PieSlice {
  id: string;
  label: string;
  amount: bigint;
  /** Share of the whole pie in basis points. */
  bps: bigint;
  isProfit: boolean;
}

/**
 * Slices for the "where each rupee goes" chart: every cost line plus profit when positive.
 * The whole is revenue when profitable, otherwise total costs (a loss has no profit slice).
 */
export function pieSlices(view: View): PieSlice[] {
  const costs = view.lines.filter((l) => l.amount > 0n);
  const costTotal = costs.reduce((a, l) => a + l.amount, 0n);
  const whole = view.contribution > 0n ? costTotal + view.contribution : costTotal;
  if (whole <= 0n) return [];
  const share = (x: bigint) => (x * 10000n + whole / 2n) / whole;
  const slices: PieSlice[] = costs
    .sort((a, b) => (a.amount === b.amount ? 0 : a.amount < b.amount ? 1 : -1))
    .map((l) => ({ id: l.id, label: l.label, amount: l.amount, bps: share(l.amount), isProfit: false }));
  if (view.contribution > 0n) {
    slices.push({ id: "profit", label: "Profit", amount: view.contribution, bps: share(view.contribution), isProfit: true });
  }
  return slices;
}
