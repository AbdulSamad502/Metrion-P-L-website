import type { MarketplaceId } from "@/engine/types";

/**
 * Per-marketplace copy. The single page composes from this today; a dedicated landing page per
 * marketplace can reuse it later (see src/lib/pages.ts). Do not put fee rates in this file.
 */
export interface MarketplaceGuide {
  id: MarketplaceId;
  name: string;
  /** Short heading for the guide section. */
  heading: string;
  paragraphs: string[];
  checklist: string[];
}

export const MARKETPLACE_GUIDES: Record<MarketplaceId, MarketplaceGuide> = {
  amazon: {
    id: "amazon",
    name: "Amazon India",
    heading: "Amazon seller profit: what to enter",
    paragraphs: [
      "On Amazon India your costs depend on how you fulfil an order. Choose Easy Ship, Seller Flex, Fulfilled by Amazon (FBA) or self-ship and the calculator shows the fee fields that apply to that method.",
      "Use Seller Central's fee preview for a product, or a recent settlement report, to find your referral fee, closing fee and shipping or fulfilment charges. Enter them excluding GST; the calculator adds GST on the charges for you.",
    ],
    checklist: [
      "Referral fee as a percentage of the selling price",
      "Closing fee per order",
      "Shipping or weight-handling fee (or FBA fulfilment fee)",
      "Return and RTO handling charges",
      "Advertising spend and the sales your ads drove",
    ],
  },
  flipkart: {
    id: "flipkart",
    name: "Flipkart",
    heading: "Flipkart seller profit: what to enter",
    paragraphs: [
      "Flipkart charges a commission, often a fixed fee, a collection or payment fee and shipping. Your settlement report and the rate card in your seller dashboard list each of them for your category.",
      "Enter the rates your account shows, excluding GST. If a fee changes with the price of the item, switch to Detailed Calculation and add price bands so break-even and Find My Price stay accurate.",
    ],
    checklist: [
      "Commission as a percentage of the selling price",
      "Fixed fee per order",
      "Collection or payment fee",
      "Forward and reverse shipping",
      "RTO and return rates from your own orders",
    ],
  },
  meesho: {
    id: "meesho",
    name: "Meesho",
    heading: "Meesho seller profit: what to enter",
    paragraphs: [
      "Meesho sellers mostly see shipping and return charges rather than a large commission. Check your payment and order reports for the shipping charge per order and what is deducted on returns and RTO.",
      "Because returns and RTO are a bigger share of orders in many Meesho categories, enter your real return and RTO rates and how much stock you recover. That is where most hidden losses sit.",
    ],
    checklist: [
      "Commission, if your plan has one (enter 0 if none)",
      "Shipping charge per order",
      "Shipping charged on returns and RTO",
      "Your RTO and customer return rates",
      "Share of returned stock you can resell",
    ],
  },
};
