import { emptyInputs } from "./defaults";
import {
  NA,
  set,
  type Band,
  type CalcInputs,
  type FeeAmount,
  type FeeInput,
  type MarketplaceId,
  type Mode,
  type PriceBasis,
} from "./types";

export const rupees = (n: number): bigint => BigInt(n) * 100n;

export const flat = (paise: bigint): FeeInput => ({ amount: set<FeeAmount>({ kind: "single", amount: paise }), refundBps: { state: "empty" } });
export const pct = (bps: bigint): FeeInput => ({ amount: set<FeeAmount>({ kind: "single", amount: bps }), refundBps: { state: "empty" } });
export const tiers = (mode: "whole" | "marginal", bands: Band[], basis?: PriceBasis): FeeInput => ({
  amount: set<FeeAmount>({ kind: "tiers", mode, bands }),
  refundBps: { state: "empty" },
  ...(basis ? { basis } : {}),
});

/** Amazon, Detailed mode, registered with ITC: 18% GST, price Rs 1,180, cost Rs 354, no returns. */
export function baseDetailed(over: Partial<CalcInputs> = {}, marketplace: MarketplaceId = "amazon", mode: Mode = "detailed"): CalcInputs {
  return {
    ...emptyInputs(marketplace, mode),
    sellingPrice: set(rupees(1180)),
    gstRateBps: set(1800n),
    productCost: set(rupees(354)),
    packagingCost: set(2360n),
    fees: { referral: pct(1000n), closing: flat(2000n), shipping: flat(5000n) },
    monthlyOrders: set(100n),
    rtoBps: set(0n),
    returnBps: set(0n),
    adSpend: NA,
    ...over,
  };
}
