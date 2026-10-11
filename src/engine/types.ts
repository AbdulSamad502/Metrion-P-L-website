import type { Rat } from "./rational";

export type MarketplaceId = "amazon" | "flipkart" | "meesho";
export type Mode = "quick" | "detailed";
export type GstStatus = "registered_itc" | "registered_no_itc" | "unregistered";
export type AmazonFulfilment = "easy_ship" | "seller_flex" | "fba" | "self_ship";

/**
 * Every seller input is tri-state: nothing entered, explicitly "not applicable"
 * (a confirmed zero) or a value. An empty field is never treated as zero.
 */
export type Entry<T> =
  | { state: "empty" }
  | { state: "na" }
  | { state: "set"; value: T }
  | { state: "invalid"; reason: string };

export const EMPTY: Entry<never> = { state: "empty" };
export const NA: Entry<never> = { state: "na" };
export const set = <T>(value: T): Entry<T> => ({ state: "set", value });

/** What a percent fee is applied to. */
export type PriceBasis = "price_incl_gst" | "price_excl_gst";

/** Which orders a fee is charged on. */
export type ChargedOn = "shipped" | "kept" | "rto_return";

export interface Band {
  /** Inclusive upper bound of the band on the fee's price basis, in paise. null = no upper limit. */
  upTo: bigint | null;
  /** Basis points for percent fees, paise for flat fees. */
  amount: bigint;
}

export type FeeAmount =
  | { kind: "single"; amount: bigint }
  | {
      kind: "tiers";
      /** whole: the band's rate applies to the entire price. marginal: progressive (percent fees only). */
      mode: "whole" | "marginal";
      bands: Band[];
    };

export interface FeeInput {
  amount: Entry<FeeAmount>;
  /** Share (bps) of this fee refunded when the order is returned or RTO. Empty = assumed 0%. */
  refundBps: Entry<bigint>;
  /** Percent fees only: override the field's default price basis. */
  basis?: PriceBasis;
}

export interface Recovery {
  /** Share (bps) of units that return to stock and can be resold. */
  sellableBps: Entry<bigint>;
  /** Share (bps) of units that come back damaged. The rest are treated as lost. */
  damagedBps: Entry<bigint>;
}

export interface CalcInputs {
  marketplace: MarketplaceId;
  mode: Mode;
  amazonFulfilment: AmazonFulfilment;

  /** What the customer pays per unit, including GST, in paise. */
  sellingPrice: Entry<bigint>;
  gstRateBps: Entry<bigint>;
  gstStatus: GstStatus;
  /** Product cost per unit as paid, including GST, in paise. */
  productCost: Entry<bigint>;
  /** GST rate paid on purchase. Empty = same as the product GST rate. */
  purchaseGstRateBps: Entry<bigint>;
  /** GST rate on packaging, advertising and marketplace charges. Empty = 18%. */
  servicesGstRateBps: Entry<bigint>;

  /** Packaging per dispatched order as paid, incl. GST, in paise. */
  packagingCost: Entry<bigint>;
  fees: Record<string, FeeInput>;

  monthlyOrders: Entry<bigint>;
  rtoBps: Entry<bigint>;
  returnBps: Entry<bigint>;
  rtoRecovery: Recovery;
  returnRecovery: Recovery;
  /** Resale value of a damaged unit as a share (bps) of its net cost. Empty = assumed 0%. */
  salvageBps: Entry<bigint>;

  /** Monthly advertising spend as paid, incl. GST, in paise. */
  adSpend: Entry<bigint>;
  /** Monthly revenue attributed to ads (incl. GST) in paise, optional. */
  adRevenue: Entry<bigint>;
  /** Monthly operating expenses as incurred, in paise. */
  operatingExpenses: Entry<bigint>;

  /** True when example numbers were loaded; carried through to results. */
  isExample: boolean;
}

export type ResultStatus = "incomplete" | "provisional" | "estimate";

export interface Issue {
  code: string;
  /** blocking = needed for any figure; missing = a material input is empty. */
  severity: "blocking" | "missing" | "info";
  field?: string;
  message: string;
}

export interface Assumption {
  code: string;
  label: string;
}

export type LineGroup =
  | "product"
  | "stock_loss"
  | "commission"
  | "shipping"
  | "fulfilment"
  | "other_fee"
  | "fee_gst"
  | "fee_refund"
  | "packaging"
  | "advertising";

export interface Line {
  id: string;
  label: string;
  group: LineGroup;
  /** Cost as a positive number; credits (refunds) are negative. Paise. */
  amount: bigint;
}

export interface View {
  revenue: bigint;
  lines: Line[];
  contribution: bigint;
  /** Present only when operating expenses are entered or marked N/A. */
  operatingExpenses?: bigint;
  operatingProfit?: bigint;
}

export interface OrderCounts {
  placed: Rat;
  kept: Rat;
  rto: Rat;
  returned: Rat;
}

export interface Metrics {
  /** Margins in basis points of revenue (ex-GST when registered). null = not applicable. */
  contributionMarginBps: bigint | null;
  operatingMarginBps: bigint | null;
  effectiveFeeBps: bigint | null;
  acosBps: bigint | null;
  tacosBps: bigint | null;
  /** ROAS in basis points (10000 = 1.00x). */
  roasBps: bigint | null;
  breakEvenRoasBps: bigint | null;
  /** Highest ad cost per kept order that keeps contribution at zero, paise. */
  maxCacPaise: bigint | null;
  /** GST recovered through ITC, paise per kept order and monthly. */
  gstRecoveredPerKept: bigint | null;
  gstRecoveredMonthly: bigint | null;
}

export interface CalcResult {
  status: ResultStatus;
  issues: Issue[];
  /** Names of costs that were not entered and are therefore excluded. */
  missingCosts: string[];
  assumptions: Assumption[];
  /** Plain-language scope note, e.g. what Quick mode leaves out. */
  scopeNote: string | null;
  isExample: boolean;
  orders: OrderCounts | null;
  /** True when no order is kept (or none placed): per-kept figures do not exist. */
  noKeptOrders: boolean;
  perKept: View | null;
  perPlaced: View | null;
  monthly: View | null;
  metrics: Metrics | null;
}
