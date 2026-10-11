export interface Faq {
  q: string;
  a: string;
}

/** Plain-text answers: the same strings feed the visible FAQ and the FAQPage JSON-LD. */
export const FAQS: Faq[] = [
  {
    q: "How do I calculate profit per order on Amazon, Flipkart or Meesho?",
    a: "Start with the price the customer pays, remove GST to get your revenue, then subtract your product cost, marketplace fees (commission, fixed or closing fee, shipping), packaging, advertising and the cost of orders that come back as RTO or returns. This calculator does each step for you and shows every line, so you can see exactly where the money goes.",
  },
  {
    q: "What is the difference between contribution profit and operating profit?",
    a: "Contribution profit is what is left from each sale after the costs that vary with orders: product, marketplace fees, shipping, packaging, advertising and return losses. Operating profit subtracts your monthly overheads (salaries, rent, software and so on) as well. We call the bottom line operating profit, not net profit, because it is not a full accounting profit.",
  },
  {
    q: "How are RTO and customer returns treated?",
    a: "Per-order figures are for orders that are delivered and kept. Orders that are returned to origin (RTO) or returned by customers earn no revenue, but they can still cost you forward shipping, return shipping, packaging and any stock that comes back damaged or lost. The calculator spreads those losses across the orders you keep, so profit is not overstated.",
  },
  {
    q: "Does the calculator know my marketplace fees?",
    a: "No. Marketplace rate cards change often and differ by category, weight and price, so the calculator never assumes a rate. You enter the fees from your own seller dashboard, fee preview or settlement report. If a fee is left empty the result is marked provisional and tells you which cost is missing.",
  },
  {
    q: "How does GST affect my profit?",
    a: "If you are GST-registered, the GST in the selling price is not your income, so revenue is the price divided by one plus the GST rate. If you claim input tax credit (ITC), the GST you paid on product cost, packaging, advertising and marketplace charges is shown as recovered. If you are not registered, revenue is the full price and GST you pay on costs is a real cost. Confirm your own treatment with a chartered accountant.",
  },
  {
    q: "What is break-even price and how is it calculated?",
    a: "Break-even price is the lowest selling price at which contribution profit is zero. Because many fees depend on price, the calculator solves it exactly for your fee setup, including price bands where a fee rate changes at certain prices, and checks the answer against the same calculation shown on screen.",
  },
  {
    q: "What does Find My Price do?",
    a: "Enter the profit margin you want and the calculator works out the lowest selling price that delivers it, using your costs, fees, GST and return rates. It assumes your order volume stays the same at the new price, so treat it as a starting point for testing, not a guarantee.",
  },
  {
    q: "What are ACOS, TACoS and ROAS?",
    a: "ACOS is advertising spend divided by sales that the ads drove. TACoS is advertising spend divided by your total sales. ROAS is the sales the ads drove for each rupee of spend. Break-even ROAS shows the ROAS you need just to cover the cost of selling the product, before overheads.",
  },
  {
    q: "Is my data saved or sent anywhere?",
    a: "No. All calculations run in your browser. The numbers you type are not uploaded, stored on our servers or shared, and there is no login.",
  },
  {
    q: "Are the results exact?",
    a: "The arithmetic is exact, to the paisa. The result is still an estimate because it depends on the numbers and assumptions you give it, and marketplaces can change fees, reverse charges or settle differently. Compare it with your actual settlement reports before making big pricing or stocking decisions.",
  },
];
