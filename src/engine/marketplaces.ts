import type { AmazonFulfilment, ChargedOn, LineGroup, MarketplaceId, PriceBasis } from "./types";

/**
 * Data-driven fee fields. The seller types every value: this file holds field
 * definitions and help text only, never a rate. Do not add default rates here.
 */
export interface FeeFieldDef {
  id: string;
  label: string;
  unit: "percent" | "flat";
  group: LineGroup;
  /** Which orders the fee is charged on. */
  chargedOn: ChargedOn;
  /** Default price basis for percent fees and price-band tiers (seller can override in Detailed). */
  basis: PriceBasis;
  /** Shown in Quick Estimate. */
  quick: boolean;
  /** Missing value makes the result Provisional. */
  material: boolean;
  /** Only material when RTO or return % is above zero. */
  materialOnReturns?: boolean;
  /** Price-band tiers can be entered in Detailed mode. */
  tierable: boolean;
  /** Show only for these Amazon fulfilment methods. */
  amazonFulfilment?: AmazonFulfilment[];
  help: string;
}

const pct = "% of the price";

const AMAZON: FeeFieldDef[] = [
  {
    id: "referral",
    label: "Referral fee",
    unit: "percent",
    group: "commission",
    chargedOn: "shipped",
    basis: "price_incl_gst",
    quick: true,
    material: true,
    tierable: true,
    help: `Amazon's commission, entered as ${pct}, excluding GST on the fee. Find it in Seller Central's fee preview or a settlement report.`,
  },
  {
    id: "closing",
    label: "Closing fee",
    unit: "flat",
    group: "other_fee",
    chargedOn: "shipped",
    basis: "price_incl_gst",
    quick: true,
    material: true,
    tierable: true,
    help: "Fixed fee per order, excluding GST. Enter 0 if you are not charged one.",
  },
  {
    id: "shipping",
    label: "Shipping / weight-handling fee",
    unit: "flat",
    group: "shipping",
    chargedOn: "shipped",
    basis: "price_incl_gst",
    quick: true,
    material: true,
    tierable: false,
    amazonFulfilment: ["easy_ship", "seller_flex", "self_ship"],
    help: "Per-order shipping charge for your weight and delivery zone, excluding GST. For self-ship, enter your courier cost.",
  },
  {
    id: "fba_fulfilment",
    label: "FBA fulfilment fee",
    unit: "flat",
    group: "fulfilment",
    chargedOn: "shipped",
    basis: "price_incl_gst",
    quick: true,
    material: true,
    tierable: false,
    amazonFulfilment: ["fba"],
    help: "Per-unit FBA pick-and-pack and weight handling, excluding GST.",
  },
  {
    id: "reverse",
    label: "Return / RTO handling fee",
    unit: "flat",
    group: "shipping",
    chargedOn: "rto_return",
    basis: "price_incl_gst",
    quick: false,
    material: false,
    materialOnReturns: true,
    tierable: false,
    help: "What you are charged per returned or RTO order, excluding GST.",
  },
  {
    id: "other",
    label: "Other per-order fee",
    unit: "flat",
    group: "other_fee",
    chargedOn: "shipped",
    basis: "price_incl_gst",
    quick: false,
    material: false,
    tierable: false,
    help: "Any other charge per order (storage, removal, etc.), excluding GST.",
  },
];

const FLIPKART: FeeFieldDef[] = [
  {
    id: "commission",
    label: "Commission",
    unit: "percent",
    group: "commission",
    chargedOn: "shipped",
    basis: "price_incl_gst",
    quick: true,
    material: true,
    tierable: true,
    help: `Flipkart's commission, entered as ${pct}, excluding GST on the fee. Check your settlement report or rate card.`,
  },
  {
    id: "fixed_fee",
    label: "Fixed fee",
    unit: "flat",
    group: "other_fee",
    chargedOn: "shipped",
    basis: "price_incl_gst",
    quick: true,
    material: true,
    tierable: true,
    help: "Fixed fee per order, excluding GST. Enter 0 if you are not charged one.",
  },
  {
    id: "collection_fee",
    label: "Collection / payment fee",
    unit: "percent",
    group: "other_fee",
    chargedOn: "shipped",
    basis: "price_incl_gst",
    quick: false,
    material: false,
    tierable: false,
    help: `Payment or COD collection fee, entered as ${pct}, excluding GST.`,
  },
  {
    id: "shipping",
    label: "Shipping fee",
    unit: "flat",
    group: "shipping",
    chargedOn: "shipped",
    basis: "price_incl_gst",
    quick: true,
    material: true,
    tierable: false,
    help: "Forward shipping per order for your weight and zone, excluding GST.",
  },
  {
    id: "reverse",
    label: "Reverse shipping fee",
    unit: "flat",
    group: "shipping",
    chargedOn: "rto_return",
    basis: "price_incl_gst",
    quick: false,
    material: false,
    materialOnReturns: true,
    tierable: false,
    help: "What you are charged per returned or RTO order, excluding GST.",
  },
  {
    id: "other",
    label: "Other per-order fee",
    unit: "flat",
    group: "other_fee",
    chargedOn: "shipped",
    basis: "price_incl_gst",
    quick: false,
    material: false,
    tierable: false,
    help: "Any other charge per order, excluding GST.",
  },
];

const MEESHO: FeeFieldDef[] = [
  {
    id: "commission",
    label: "Commission",
    unit: "percent",
    group: "commission",
    chargedOn: "shipped",
    basis: "price_incl_gst",
    quick: true,
    material: true,
    tierable: true,
    help: `Meesho's commission, entered as ${pct}, excluding GST. Enter 0 if your plan has none.`,
  },
  {
    id: "shipping",
    label: "Shipping charge",
    unit: "flat",
    group: "shipping",
    chargedOn: "shipped",
    basis: "price_incl_gst",
    quick: true,
    material: true,
    tierable: false,
    help: "Shipping Meesho deducts per order for your weight, excluding GST.",
  },
  {
    id: "reverse",
    label: "Return / RTO shipping charge",
    unit: "flat",
    group: "shipping",
    chargedOn: "rto_return",
    basis: "price_incl_gst",
    quick: false,
    material: false,
    materialOnReturns: true,
    tierable: false,
    help: "What you are charged per returned or RTO order, excluding GST.",
  },
  {
    id: "other",
    label: "Other platform fee",
    unit: "flat",
    group: "other_fee",
    chargedOn: "shipped",
    basis: "price_incl_gst",
    quick: true,
    material: false,
    tierable: false,
    help: "Any other per-order platform charge, excluding GST. Enter 0 if none.",
  },
];

export const MARKETPLACE_FIELDS: Record<MarketplaceId, FeeFieldDef[]> = {
  amazon: AMAZON,
  flipkart: FLIPKART,
  meesho: MEESHO,
};

export const MARKETPLACE_LABEL: Record<MarketplaceId, string> = {
  amazon: "Amazon India",
  flipkart: "Flipkart",
  meesho: "Meesho",
};

export const AMAZON_FULFILMENT_LABEL: Record<AmazonFulfilment, string> = {
  easy_ship: "Easy Ship",
  seller_flex: "Seller Flex",
  fba: "Fulfilled by Amazon (FBA)",
  self_ship: "Self-ship",
};

/** Fee fields that apply for the chosen marketplace and Amazon fulfilment method. */
export function activeFields(marketplace: MarketplaceId, amazonFulfilment: AmazonFulfilment): FeeFieldDef[] {
  return MARKETPLACE_FIELDS[marketplace].filter(
    (f) => !f.amazonFulfilment || (marketplace === "amazon" && f.amazonFulfilment.includes(amazonFulfilment)),
  );
}
