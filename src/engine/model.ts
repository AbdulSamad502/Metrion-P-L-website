import { activeFields, type FeeFieldDef } from "./marketplaces";
import * as R from "./rational";
import type { Rat } from "./rational";
import type {
  Assumption,
  CalcInputs,
  Entry,
  FeeAmount,
  FeeInput,
  Issue,
  LineGroup,
  PriceBasis,
  Recovery,
} from "./types";

/* ------------------------------------------------------------------ */
/* Input preparation: validation, missing-input tracking, assumptions  */
/* ------------------------------------------------------------------ */

export interface PreparedFee {
  def: FeeFieldDef;
  amount: FeeAmount;
  refund: Rat;
  basis: PriceBasis;
}

interface RecoveryShares {
  sellable: Rat;
  damaged: Rat;
  lost: Rat;
}

export interface Prepared {
  registered: boolean;
  itc: boolean;
  /** Product GST as a fraction (0 when unregistered). */
  gst: Rat;
  purchaseGst: Rat;
  servicesGst: Rat;
  cost: Rat; // product cost per unit as paid, paise
  packaging: Rat | null; // null = not entered/excluded
  fees: PreparedFee[];
  /** Order counts. When monthly orders is missing a single order is used so per-order figures still exist. */
  N: Rat;
  rto: Rat;
  returned: Rat;
  K: Rat;
  hasMonthlyOrders: boolean;
  rtoRec: RecoveryShares;
  retRec: RecoveryShares;
  salvage: Rat;
  ads: Rat | null;
  adRevenue: Rat | null;
  opex: Rat | null;
  opexAnswered: boolean;
}

export interface PrepareOutput {
  prepared: Prepared | null;
  issues: Issue[];
  missingCosts: string[];
  assumptions: Assumption[];
  scopeNote: string | null;
}

const HUNDRED_PERCENT = 10000n;
const DEFAULT_RECOVERY_BPS = 8000n;
const DEFAULT_SERVICES_GST_BPS = 1800n;

export function prepare(inputs: CalcInputs): PrepareOutput {
  const issues: Issue[] = [];
  const missingCosts: string[] = [];
  const assumptions: Assumption[] = [];
  const quick = inputs.mode === "quick";

  const block = (code: string, message: string, field?: string) =>
    issues.push({ code, severity: "blocking", message, ...(field ? { field } : {}) });
  const missing = (code: string, name: string, field?: string) => {
    issues.push({ code, severity: "missing", message: `${name} not entered`, ...(field ? { field } : {}) });
    missingCosts.push(name);
  };
  const invalid = (e: Entry<unknown>, label: string, field: string): boolean => {
    if (e.state === "invalid") {
      block(`invalid_${field}`, `${label}: ${e.reason}`, field);
      return true;
    }
    return false;
  };

  const registered = inputs.gstStatus !== "unregistered";
  const itc = inputs.gstStatus === "registered_itc";

  /* ---- Required inputs ---- */
  let price: bigint | null = null;
  if (inputs.sellingPrice.state === "set") {
    if (inputs.sellingPrice.value > 0n) price = inputs.sellingPrice.value;
    else block("price_zero", "Selling price must be above zero", "sellingPrice");
  } else if (!invalid(inputs.sellingPrice, "Selling price", "sellingPrice")) {
    block("price_missing", "Enter the selling price", "sellingPrice");
  }

  let gstBps = 0n;
  if (registered) {
    if (inputs.gstRateBps.state === "set") gstBps = inputs.gstRateBps.value;
    else if (inputs.gstRateBps.state === "na") gstBps = 0n;
    else if (!invalid(inputs.gstRateBps, "GST rate", "gstRateBps")) {
      block("gst_missing", "Choose the product GST rate", "gstRateBps");
    }
  }

  let cost = 0n;
  if (inputs.productCost.state === "set") cost = inputs.productCost.value;
  else if (inputs.productCost.state === "na") cost = 0n;
  else if (!invalid(inputs.productCost, "Product cost", "productCost")) {
    block("cost_missing", "Enter the product cost per unit", "productCost");
  }

  /* ---- Optional GST rates ---- */
  let purchaseGstBps = gstBps;
  if (registered && inputs.purchaseGstRateBps.state === "set") purchaseGstBps = inputs.purchaseGstRateBps.value;
  else if (registered && inputs.purchaseGstRateBps.state === "empty") {
    if (itc) assumptions.push({ code: "purchase_gst_default", label: "Purchase GST assumed equal to the product GST rate" });
  } else invalid(inputs.purchaseGstRateBps, "Purchase GST rate", "purchaseGstRateBps");

  let servicesGstBps = DEFAULT_SERVICES_GST_BPS;
  if (inputs.servicesGstRateBps.state === "set") servicesGstBps = inputs.servicesGstRateBps.value;
  else if (inputs.servicesGstRateBps.state === "na") servicesGstBps = 0n;
  else if (!invalid(inputs.servicesGstRateBps, "GST on services", "servicesGstRateBps")) {
    assumptions.push({ code: "services_gst_default", label: "18% GST assumed on marketplace charges, packaging and advertising" });
  }

  /* ---- Order outcomes ---- */
  let rtoBps = 0n;
  let retBps = 0n;
  const rate = (e: Entry<bigint>, label: string, field: string, name: string): bigint => {
    if (e.state === "set") return e.value;
    if (e.state === "na") return 0n;
    if (e.state === "invalid") {
      invalid(e, label, field);
      return 0n;
    }
    missing(`missing_${field}`, name, field);
    return 0n;
  };
  rtoBps = rate(inputs.rtoBps, "RTO %", "rtoBps", "RTO rate (losses from RTO orders)");
  retBps = rate(inputs.returnBps, "Return %", "returnBps", "Customer return rate (losses from returns)");
  if (rtoBps + retBps > HUNDRED_PERCENT) {
    block("outcomes_exceed", "RTO % and return % together cannot be more than 100%", "rtoBps");
  }

  let N: Rat = R.ONE;
  let hasMonthlyOrders = false;
  if (inputs.monthlyOrders.state === "set") {
    N = R.rat(inputs.monthlyOrders.value);
    hasMonthlyOrders = inputs.monthlyOrders.value > 0n;
    if (!hasMonthlyOrders) N = R.ONE;
  } else invalid(inputs.monthlyOrders, "Monthly orders", "monthlyOrders");

  const rto = R.mul(N, R.fromBps(rtoBps));
  const returned = R.mul(N, R.fromBps(retBps));
  const K = R.sub(N, R.add(rto, returned));

  /* ---- Return recovery ---- */
  const shares = (rec: Recovery, field: string): RecoveryShares => {
    let sellable: bigint;
    let damaged = 0n;
    if (rec.sellableBps.state === "set") sellable = rec.sellableBps.value;
    else if (rec.sellableBps.state === "na") sellable = 0n;
    else {
      invalid(rec.sellableBps, "Share resold", `${field}.sellable`);
      sellable = DEFAULT_RECOVERY_BPS;
    }
    if (rec.damagedBps.state === "set") damaged = rec.damagedBps.value;
    else invalid(rec.damagedBps, "Share damaged", `${field}.damaged`);
    if (sellable + damaged > HUNDRED_PERCENT) {
      block(`recovery_exceeds_${field}`, "Resold + damaged share cannot be more than 100%", field);
    }
    const lost = HUNDRED_PERCENT - sellable - damaged;
    return {
      sellable: R.fromBps(sellable),
      damaged: R.fromBps(damaged),
      lost: R.fromBps(lost < 0n ? 0n : lost),
    };
  };
  const usesDefaultRecovery =
    (rtoBps > 0n && inputs.rtoRecovery.sellableBps.state === "empty") ||
    (retBps > 0n && inputs.returnRecovery.sellableBps.state === "empty");
  const effRto: Recovery =
    inputs.rtoRecovery.sellableBps.state === "empty"
      ? { ...inputs.rtoRecovery, sellableBps: { state: "set", value: DEFAULT_RECOVERY_BPS } }
      : inputs.rtoRecovery;
  const effRet: Recovery =
    inputs.returnRecovery.sellableBps.state === "empty"
      ? { ...inputs.returnRecovery, sellableBps: { state: "set", value: DEFAULT_RECOVERY_BPS } }
      : inputs.returnRecovery;
  const rtoRec = shares(effRto, "rto");
  const retRec = shares(effRet, "return");
  if (usesDefaultRecovery) {
    assumptions.push({
      code: "recovery_default",
      label: "80% of returned and RTO units assumed resellable; the rest treated as lost",
    });
  }
  let salvageBps = 0n;
  if (inputs.salvageBps.state === "set") salvageBps = inputs.salvageBps.value;
  else invalid(inputs.salvageBps, "Salvage value", "salvageBps");

  /* ---- Packaging, advertising, operating expenses ---- */
  let packaging: Rat | null = null;
  if (inputs.packagingCost.state === "set") packaging = R.rat(inputs.packagingCost.value);
  else if (inputs.packagingCost.state === "na") packaging = R.ZERO;
  else if (!invalid(inputs.packagingCost, "Packaging", "packagingCost") && !quick) {
    missing("missing_packaging", "Packaging cost", "packagingCost");
  }

  let ads: Rat | null = null;
  if (inputs.adSpend.state === "set") ads = R.rat(inputs.adSpend.value);
  else if (inputs.adSpend.state === "na") ads = R.ZERO;
  else if (!invalid(inputs.adSpend, "Advertising spend", "adSpend") && !quick) {
    missing("missing_ads", "Advertising spend", "adSpend");
  }
  if (ads !== null && !R.isZero(ads) && !hasMonthlyOrders) {
    ads = null;
    missing("ads_need_orders", "Advertising spend (needs monthly orders to allocate)", "adSpend");
  }

  let adRevenue: Rat | null = null;
  if (inputs.adRevenue.state === "set") adRevenue = R.rat(inputs.adRevenue.value);
  else invalid(inputs.adRevenue, "Ad-attributed revenue", "adRevenue");

  let opex: Rat | null = null;
  let opexAnswered = false;
  if (inputs.operatingExpenses.state === "set") {
    opex = R.rat(inputs.operatingExpenses.value);
    opexAnswered = true;
  } else if (inputs.operatingExpenses.state === "na") {
    opex = R.ZERO;
    opexAnswered = true;
  } else invalid(inputs.operatingExpenses, "Operating expenses", "operatingExpenses");
  if (opex !== null && !R.isZero(opex) && !hasMonthlyOrders) {
    opex = null;
    opexAnswered = false;
    issues.push({
      code: "opex_need_orders",
      severity: "info",
      field: "operatingExpenses",
      message: "Enter monthly orders to see operating profit",
    });
  }

  /* ---- Marketplace fees ---- */
  const fees: PreparedFee[] = [];
  const anyReturns = rtoBps > 0n || retBps > 0n;
  let refundAssumed = false;
  for (const def of activeFields(inputs.marketplace, inputs.amazonFulfilment)) {
    if (quick && !def.quick) continue;
    const fi: FeeInput | undefined = inputs.fees[def.id];
    const entry: Entry<FeeAmount> = fi?.amount ?? { state: "empty" };
    const matters = def.material || (def.materialOnReturns === true && anyReturns);
    if (entry.state === "invalid") {
      block(`invalid_fee_${def.id}`, `${def.label}: ${entry.reason}`, `fee.${def.id}`);
      continue;
    }
    if (entry.state === "empty") {
      if (matters) missing(`missing_fee_${def.id}`, def.label, `fee.${def.id}`);
      continue;
    }
    const amount: FeeAmount = entry.state === "na" ? { kind: "single", amount: 0n } : entry.value;
    if (amount.kind === "tiers") {
      const err = validateBands(amount, def);
      if (err) {
        block(`invalid_tiers_${def.id}`, `${def.label}: ${err}`, `fee.${def.id}`);
        continue;
      }
    }
    let refund = 0n;
    const rf = fi?.refundBps ?? { state: "empty" as const };
    if (rf.state === "set") refund = rf.value;
    else if (rf.state === "invalid") block(`invalid_refund_${def.id}`, `${def.label} refund: ${rf.reason}`, `fee.${def.id}`);
    else if (rf.state === "empty" && anyReturns && def.chargedOn !== "kept") refundAssumed = true;
    fees.push({ def, amount, refund: R.fromBps(refund), basis: fi?.basis ?? def.basis });
  }
  if (refundAssumed) {
    assumptions.push({ code: "refund_default", label: "Marketplace fees assumed not refunded on returned or RTO orders" });
  }
  if (fees.some((f) => f.def.unit === "percent" && f.basis === "price_incl_gst" && registered)) {
    assumptions.push({ code: "fee_basis", label: "Percentage fees applied to the selling price including GST (change per fee in Detailed mode)" });
  }
  if (itc && anyReturns) {
    assumptions.push({ code: "itc_written_off", label: "No ITC taken on stock written off through returns or RTO (to be confirmed with your CA)" });
  }

  const hasBlocking = issues.some((i) => i.severity === "blocking");
  const scopeNote = quick ? "Quick Estimate leaves out packaging, advertising, operating costs and return/RTO handling fees. Use Detailed Calculation to include them." : null;

  if (hasBlocking || price === null) {
    return { prepared: null, issues, missingCosts, assumptions, scopeNote };
  }

  const prepared: Prepared = {
    registered,
    itc,
    gst: R.fromBps(gstBps),
    purchaseGst: R.fromBps(purchaseGstBps),
    servicesGst: R.fromBps(servicesGstBps),
    cost: R.rat(cost),
    packaging: quick ? null : packaging,
    fees,
    N,
    rto,
    returned,
    K,
    hasMonthlyOrders,
    rtoRec,
    retRec,
    salvage: R.fromBps(salvageBps),
    ads: quick ? null : ads,
    adRevenue: quick ? null : adRevenue,
    opex: quick ? null : opex,
    opexAnswered: quick ? false : opexAnswered,
  };
  return { prepared, issues, missingCosts, assumptions, scopeNote };
}

function validateBands(f: Extract<FeeAmount, { kind: "tiers" }>, def: FeeFieldDef): string | null {
  if (!def.tierable) return "price bands are not supported for this fee";
  if (f.bands.length < 1) return "add at least one band";
  let prev: bigint | null = null;
  for (let i = 0; i < f.bands.length; i++) {
    const b = f.bands[i] as (typeof f.bands)[number];
    const last = i === f.bands.length - 1;
    if (b.upTo === null) {
      if (!last) return "only the last band can have no upper limit";
    } else {
      if (last) return "the last band must have no upper limit";
      if (prev !== null && b.upTo <= prev) return "bands must be in increasing order";
      if (b.upTo <= 0n) return "band limits must be above zero";
      prev = b.upTo;
    }
    if (def.unit === "percent" && b.amount > 10000n) return "rate cannot be above 100%";
  }
  if (def.unit === "flat" && f.mode === "marginal") return "progressive bands only apply to percentage fees";
  return null;
}

/* ------------------------------------------------------------------ */
/* Exact evaluation at a selling price                                  */
/* ------------------------------------------------------------------ */

export interface ExactLine {
  id: string;
  label: string;
  group: LineGroup;
  /** Monthly total in paise (cost positive, credit negative). */
  amount: Rat;
}

export interface ExactTotals {
  revenue: Rat;
  outputGst: Rat;
  lines: ExactLine[];
  itcRecovered: Rat;
  /** Sum of the cost lines (everything except operating expenses). */
  totalCosts: Rat;
  contribution: Rat;
  adsLine: Rat;
  contributionBeforeAds: Rat;
}

function exclPrice(p: Prepared, price: Rat): Rat {
  return p.registered ? R.div(price, R.add(R.ONE, p.gst)) : price;
}

function perOrderFee(fee: PreparedFee, price: Rat, excl: Rat): Rat {
  const base = fee.basis === "price_incl_gst" ? price : excl;
  const isPct = fee.def.unit === "percent";
  const f = fee.amount;
  if (f.kind === "single") return isPct ? R.mul(base, R.fromBps(f.amount)) : R.rat(f.amount);
  const bands = f.bands;
  if (f.mode === "whole") {
    for (const b of bands) {
      if (b.upTo === null || R.cmp(base, R.rat(b.upTo)) <= 0) {
        return isPct ? R.mul(base, R.fromBps(b.amount)) : R.rat(b.amount);
      }
    }
    return R.ZERO;
  }
  // marginal (percent only): each band's rate applies to the slice of price inside that band
  let total = R.ZERO;
  let lower = R.ZERO;
  for (const b of bands) {
    const upper = b.upTo === null ? base : R.min(base, R.rat(b.upTo));
    if (R.cmp(upper, lower) > 0) total = R.add(total, R.mul(R.sub(upper, lower), R.fromBps(b.amount)));
    if (b.upTo === null || R.cmp(base, R.rat(b.upTo)) <= 0) break;
    lower = R.rat(b.upTo);
  }
  return total;
}

/** Selling-price values (paise, rational) where any fee's band changes. Used by the solver. */
export function priceBreakpoints(p: Prepared): Rat[] {
  const pts: Rat[] = [];
  for (const fee of p.fees) {
    if (fee.amount.kind !== "tiers") continue;
    for (const b of fee.amount.bands) {
      if (b.upTo === null) continue;
      const bound = R.rat(b.upTo);
      pts.push(fee.basis === "price_incl_gst" || !p.registered ? bound : R.mul(bound, R.add(R.ONE, p.gst)));
    }
  }
  return pts;
}

export function evaluate(p: Prepared, priceInt: bigint): ExactTotals {
  const price = R.rat(priceInt);
  const excl = exclPrice(p, price);
  const { N, K, rto, returned } = p;
  const lines: ExactLine[] = [];
  let itcRecovered = R.ZERO;
  const push = (id: string, label: string, group: LineGroup, amount: Rat) => lines.push({ id, label, group, amount });

  const revenue = R.mul(K, excl);
  const outputGst = p.registered ? R.mul(K, R.sub(price, excl)) : R.ZERO;

  /* Product cost: net of ITC when claimed; written-off units lose the gross cost. */
  const netCost = p.itc ? R.div(p.cost, R.add(R.ONE, p.purchaseGst)) : p.cost;
  push("product", "Product cost", "product", R.mul(K, netCost));
  if (p.itc) itcRecovered = R.add(itcRecovered, R.mul(K, R.sub(p.cost, netCost)));
  const salvagePerUnit = R.mul(p.salvage, netCost);
  const lossPerUnit = (r: RecoveryShares): Rat =>
    R.add(R.mul(r.lost, p.cost), R.mul(r.damaged, R.max(R.ZERO, R.sub(p.cost, salvagePerUnit))));
  const stockLoss = R.add(R.mul(rto, lossPerUnit(p.rtoRec)), R.mul(returned, lossPerUnit(p.retRec)));
  push("stock_loss", "Stock lost on returns and RTO", "stock_loss", stockLoss);

  /* Packaging */
  if (p.packaging !== null) {
    const net = p.itc ? R.div(p.packaging, R.add(R.ONE, p.servicesGst)) : p.packaging;
    push("packaging", "Packaging", "packaging", R.mul(N, net));
    if (p.itc) itcRecovered = R.add(itcRecovered, R.mul(N, R.sub(p.packaging, net)));
  }

  /* Marketplace fees */
  let grossFees = R.ZERO;
  let refunds = R.ZERO;
  const nonKept = R.add(rto, returned);
  for (const fee of p.fees) {
    const a = perOrderFee(fee, price, excl);
    const count = fee.def.chargedOn === "shipped" ? N : fee.def.chargedOn === "kept" ? K : nonKept;
    const refundable = fee.def.chargedOn === "shipped" ? nonKept : fee.def.chargedOn === "kept" ? R.ZERO : count;
    const gross = R.mul(a, count);
    grossFees = R.add(grossFees, gross);
    refunds = R.add(refunds, R.mul(R.mul(a, refundable), fee.refund));
    push(`fee_${fee.def.id}`, fee.def.label, fee.def.group, gross);
  }
  if (!R.isZero(refunds)) push("fee_refunds", "Fees refunded on returns", "fee_refund", R.neg(refunds));
  const netFees = R.sub(grossFees, refunds);
  const gstOnFees = R.mul(netFees, p.servicesGst);
  if (p.itc) itcRecovered = R.add(itcRecovered, gstOnFees);
  else if (!R.isZero(gstOnFees)) push("fee_gst", "GST on marketplace charges", "fee_gst", gstOnFees);

  /* Advertising (monthly, not scaled with order outcomes) */
  let adsLine = R.ZERO;
  if (p.ads !== null) {
    const net = p.itc ? R.div(p.ads, R.add(R.ONE, p.servicesGst)) : p.ads;
    adsLine = net;
    push("advertising", "Advertising", "advertising", net);
    if (p.itc) itcRecovered = R.add(itcRecovered, R.sub(p.ads, net));
  }

  const totalCosts = R.sum(lines.map((l) => l.amount));
  const contribution = R.sub(revenue, totalCosts);
  return {
    revenue,
    outputGst,
    lines,
    itcRecovered,
    totalCosts,
    contribution,
    adsLine,
    contributionBeforeAds: R.add(contribution, adsLine),
  };
}
