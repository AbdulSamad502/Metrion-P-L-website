import { EMPTY, type CalcInputs, type MarketplaceId, type Mode } from "./types";

/** A blank calculator: nothing entered, nothing assumed. */
export function emptyInputs(marketplace: MarketplaceId = "amazon", mode: Mode = "quick"): CalcInputs {
  return {
    marketplace,
    mode,
    amazonFulfilment: "easy_ship",
    sellingPrice: EMPTY,
    gstRateBps: EMPTY,
    gstStatus: "registered_itc",
    productCost: EMPTY,
    purchaseGstRateBps: EMPTY,
    servicesGstRateBps: EMPTY,
    packagingCost: EMPTY,
    fees: {},
    monthlyOrders: EMPTY,
    rtoBps: EMPTY,
    returnBps: EMPTY,
    rtoRecovery: { sellableBps: EMPTY, damagedBps: EMPTY },
    returnRecovery: { sellableBps: EMPTY, damagedBps: EMPTY },
    salvageBps: EMPTY,
    adSpend: EMPTY,
    adRevenue: EMPTY,
    operatingExpenses: EMPTY,
    isExample: false,
  };
}
