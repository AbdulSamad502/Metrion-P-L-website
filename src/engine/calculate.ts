import { evaluate, prepare, type ExactTotals, type Prepared } from "./model";
import * as R from "./rational";
import type { Rat } from "./rational";
import type { CalcInputs, CalcResult, LineGroup, Metrics, View } from "./types";

const FEE_GROUPS: ReadonlySet<LineGroup> = new Set<LineGroup>([
  "commission",
  "shipping",
  "fulfilment",
  "other_fee",
  "fee_gst",
  "fee_refund",
]);

const toBps = (ratio: Rat): bigint => R.roundHalfUp(R.mul(ratio, R.rat(10000n)));

/** Round every line to the paisa, then derive profit from the rounded lines so the screen always adds up. */
export function makeView(totals: ExactTotals, divisor: Rat, opex: Rat | null): View {
  const rd = (x: Rat) => R.roundHalfUp(R.div(x, divisor));
  const revenue = rd(totals.revenue);
  const lines = totals.lines.map((l) => ({ id: l.id, label: l.label, group: l.group, amount: rd(l.amount) }));
  const contribution = lines.reduce((acc, l) => acc - l.amount, revenue);
  const view: View = { revenue, lines, contribution };
  if (opex !== null) {
    const ox = rd(opex);
    view.operatingExpenses = ox;
    view.operatingProfit = contribution - ox;
  }
  return view;
}

function computeMetrics(p: Prepared, t: ExactTotals, price: bigint): Metrics {
  const ratioBps = (num: Rat, den: Rat): bigint | null => (R.sign(den) > 0 ? toBps(R.div(num, den)) : null);
  const opexExact = p.opex;
  const feeCosts = R.sum(t.lines.filter((l) => FEE_GROUPS.has(l.group)).map((l) => l.amount));
  const salesInclGst = R.mul(p.K, R.rat(price));

  const f = p.itc ? R.div(R.ONE, R.add(R.ONE, p.servicesGst)) : R.ONE;
  const cmBeforeAdsOnSales = R.sign(salesInclGst) > 0 ? R.div(t.contributionBeforeAds, salesInclGst) : R.ZERO;
  const perKeptBeforeAds = R.div(t.contributionBeforeAds, p.K);

  const adsKnown = p.ads !== null && R.sign(p.ads) > 0;
  const adRevKnown = p.adRevenue !== null && R.sign(p.adRevenue) > 0;

  return {
    contributionMarginBps: ratioBps(t.contribution, t.revenue),
    operatingMarginBps: opexExact !== null && p.opexAnswered ? ratioBps(R.sub(t.contribution, opexExact), t.revenue) : null,
    effectiveFeeBps: ratioBps(feeCosts, t.revenue),
    acosBps: adsKnown && adRevKnown ? ratioBps(p.ads as Rat, p.adRevenue as Rat) : null,
    tacosBps: adsKnown ? ratioBps(p.ads as Rat, salesInclGst) : null,
    roasBps: adsKnown && adRevKnown ? ratioBps(p.adRevenue as Rat, p.ads as Rat) : null,
    breakEvenRoasBps: p.ads !== null && R.sign(cmBeforeAdsOnSales) > 0 ? toBps(R.div(f, cmBeforeAdsOnSales)) : null,
    maxCacPaise: p.ads !== null && R.sign(perKeptBeforeAds) > 0 ? R.roundHalfUp(R.div(perKeptBeforeAds, f)) : null,
    gstRecoveredPerKept: p.itc ? R.roundHalfUp(R.div(t.itcRecovered, p.K)) : null,
    gstRecoveredMonthly: p.itc && p.hasMonthlyOrders ? R.roundHalfUp(t.itcRecovered) : null,
  };
}

/** The single entry point for every figure shown on screen, in What-if and in print. */
export function calculate(inputs: CalcInputs): CalcResult {
  const prep = prepare(inputs);
  const base = {
    issues: prep.issues,
    missingCosts: prep.missingCosts,
    assumptions: prep.assumptions,
    scopeNote: prep.scopeNote,
    isExample: inputs.isExample,
  };
  const p = prep.prepared;
  if (p === null || inputs.sellingPrice.state !== "set") {
    return {
      ...base,
      status: "incomplete",
      orders: null,
      noKeptOrders: false,
      perKept: null,
      perPlaced: null,
      monthly: null,
      metrics: null,
    };
  }

  const totals = evaluate(p, inputs.sellingPrice.value);
  const noKeptOrders = R.sign(p.K) <= 0;
  const opex = p.opexAnswered ? p.opex : null;

  return {
    ...base,
    status: prep.missingCosts.length > 0 ? "provisional" : "estimate",
    orders: { placed: p.N, kept: p.K, rto: p.rto, returned: p.returned },
    noKeptOrders,
    perKept: noKeptOrders ? null : makeView(totals, p.K, opex),
    perPlaced: makeView(totals, p.N, opex),
    monthly: p.hasMonthlyOrders ? makeView(totals, R.ONE, opex) : null,
    metrics: noKeptOrders ? null : computeMetrics(p, totals, inputs.sellingPrice.value),
  };
}
