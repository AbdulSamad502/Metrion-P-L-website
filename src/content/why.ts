import type { Line } from "@/engine/types";

/** Plain-language "why this number?" for each result line. */
export function whyLine(line: Line): string {
  switch (line.group) {
    case "product":
      return "The cost of the units you actually sell. If you claim ITC, the GST you paid on them is taken out and shown under GST recovered.";
    case "stock_loss":
      return "Stock lost on RTO and returned orders: units that come back damaged or never come back, after any resale value. Resold units cost nothing here. Spread across the orders you keep.";
    case "packaging":
      return "Packaging is used on every dispatched order, including ones that come back, so it is spread across the orders you keep.";
    case "advertising":
      return "Your monthly ad spend divided by the orders you keep. It does not change when order outcomes change.";
    case "fee_refund":
      return "The share of fees you told us the marketplace refunds on returned or RTO orders.";
    case "fee_gst":
      return "GST charged on marketplace fees. Because you are not claiming ITC it is a real cost.";
    case "shipping":
      return "Shipping and handling charges you entered. Forward shipping is charged on every dispatched order; return charges only on returned or RTO orders.";
    case "commission":
    case "fulfilment":
    case "other_fee":
    default:
      return "A marketplace charge you entered, excluding GST. Fees on orders that came back are spread across the orders you keep, less any refund you entered.";
  }
}
