import { describe, expect, it } from "vitest";
import { calculate } from "./calculate";
import { emptyInputs } from "./defaults";
import { formatBps, formatPaise, parseCount, parseMoney, parsePercent } from "./money";
import { baseDetailed, flat, pct } from "./testkit";
import { EMPTY, NA, set, type Line } from "./types";

const amountOf = (lines: Line[], id: string): bigint => lines.find((l) => l.id === id)?.amount ?? 0n;

describe("parsing and formatting (no floats)", () => {
  it("parses money to paise", () => {
    expect(parseMoney("1,499.50")).toEqual({ ok: true, value: 149950n });
    expect(parseMoney("₹ 25")).toEqual({ ok: true, value: 2500n });
    expect(parseMoney("0.5")).toEqual({ ok: true, value: 50n });
    expect(parseMoney("10.005").ok).toBe(false);
    expect(parseMoney("-5").ok).toBe(false);
    expect(parseMoney("").ok).toBe(false);
    expect(parseMoney("1e3").ok).toBe(false);
  });
  it("parses percent to basis points", () => {
    expect(parsePercent("12.5")).toEqual({ ok: true, value: 1250n });
    expect(parsePercent("18%")).toEqual({ ok: true, value: 1800n });
    expect(parsePercent("100.01").ok).toBe(false);
    expect(parsePercent("abc").ok).toBe(false);
  });
  it("parses counts", () => {
    expect(parseCount("1,200")).toEqual({ ok: true, value: 1200n });
    expect(parseCount("12.5").ok).toBe(false);
  });
  it("formats with Indian grouping", () => {
    expect(formatPaise(123456789n)).toBe("₹12,34,567.89");
    expect(formatPaise(-5n)).toBe("−₹0.05");
    expect(formatPaise(100000n, { decimals: false })).toBe("₹1,000");
    expect(formatBps(4920n)).toBe("49.20%");
  });
});

describe("hand-checked fixture A1: registered with ITC, no returns", () => {
  const r = calculate(baseDetailed());
  it("is a complete estimate", () => {
    expect(r.status).toBe("estimate");
    expect(r.missingCosts).toEqual([]);
  });
  it("matches the hand calculation to the paisa", () => {
    // Price 1,180 incl 18% GST -> revenue 1,000. Cost 354 -> 300 net. Packaging 23.60 -> 20 net.
    // Referral 10% of 1,180 = 118; closing 20; shipping 50 (GST on fees recovered via ITC).
    const v = r.perKept!;
    expect(v.revenue).toBe(100000n);
    expect(amountOf(v.lines, "product")).toBe(30000n);
    expect(amountOf(v.lines, "packaging")).toBe(2000n);
    expect(amountOf(v.lines, "fee_referral")).toBe(11800n);
    expect(amountOf(v.lines, "fee_closing")).toBe(2000n);
    expect(amountOf(v.lines, "fee_shipping")).toBe(5000n);
    expect(v.contribution).toBe(49200n);
    expect(r.metrics!.contributionMarginBps).toBe(4920n);
    // ITC: 54 on product + 3.60 on packaging + 33.84 on fees
    expect(r.metrics!.gstRecoveredPerKept).toBe(9144n);
  });
  it("monthly = per order x 100 here (no returns)", () => {
    expect(r.monthly!.contribution).toBe(4920000n);
  });
});

describe("hand-checked fixture A2: RTO, returns, recovery, salvage", () => {
  const r = calculate(
    baseDetailed({
      rtoBps: set(1000n),
      returnBps: set(1000n),
      rtoRecovery: { sellableBps: set(5000n), damagedBps: set(0n) },
      returnRecovery: { sellableBps: set(5000n), damagedBps: set(2500n) },
      salvageBps: set(4000n),
    }),
  );
  it("counts orders", () => {
    expect(r.orders!.kept).toEqual({ n: 80n, d: 1n });
  });
  it("allocates losses across kept orders", () => {
    // Monthly: revenue 80,000; product 24,000; stock lost 3,240
    //  (RTO: 5 lost x 354 = 1,770; returns: 2.5 lost x 354 = 885 + 2.5 damaged x (354 - 40% of 300) = 585);
    // fees on all 100 shipped orders: referral 11,800 + closing 2,000 + shipping 5,000; packaging 2,000.
    const m = r.monthly!;
    expect(m.revenue).toBe(8000000n);
    expect(amountOf(m.lines, "product")).toBe(2400000n);
    expect(amountOf(m.lines, "stock_loss")).toBe(324000n);
    expect(m.contribution).toBe(3196000n);
    const k = r.perKept!;
    expect(k.contribution).toBe(39950n);
    expect(amountOf(k.lines, "stock_loss")).toBe(4050n);
    expect(r.perPlaced!.contribution).toBe(31960n);
    expect(r.metrics!.contributionMarginBps).toBe(3995n);
  });
  it("lists the recovery and refund assumptions only when relevant", () => {
    const codes = r.assumptions.map((a) => a.code);
    expect(codes).toContain("refund_default");
    expect(codes).toContain("itc_written_off");
    expect(codes).not.toContain("recovery_default");
  });
});

describe("refunded marketplace fees", () => {
  it("credits back the refunded share of fees on returned orders", () => {
    const r = calculate(
      baseDetailed({
        returnBps: set(2000n),
        returnRecovery: { sellableBps: set(10000n), damagedBps: set(0n) },
        fees: { referral: { ...pct(1000n), refundBps: set(10000n) }, closing: flat(2000n), shipping: flat(5000n) },
      }),
    );
    // 20 returns x referral 118 fully refunded = 2,360 credit
    expect(amountOf(r.monthly!.lines, "fee_refunds")).toBe(-236000n);
  });
});

describe("GST variants", () => {
  it("registered without ITC pays GST on costs and fees", () => {
    const r = calculate(baseDetailed({ gstStatus: "registered_no_itc" }));
    const v = r.perKept!;
    expect(v.revenue).toBe(100000n);
    expect(amountOf(v.lines, "product")).toBe(35400n);
    expect(amountOf(v.lines, "packaging")).toBe(2360n);
    expect(amountOf(v.lines, "fee_gst")).toBe(3384n);
    expect(v.contribution).toBe(40056n);
    expect(r.metrics!.gstRecoveredPerKept).toBeNull();
  });
  it("unregistered collects no GST: revenue is the full price", () => {
    const r = calculate(baseDetailed({ gstStatus: "unregistered", gstRateBps: EMPTY }));
    expect(r.status).toBe("estimate");
    expect(r.perKept!.revenue).toBe(118000n);
    expect(r.perKept!.contribution).toBe(58056n);
  });
});

describe("zero kept orders", () => {
  const r = calculate(baseDetailed({ rtoBps: set(6000n), returnBps: set(4000n) }));
  it("gives no per-kept figures and no NaN", () => {
    expect(r.noKeptOrders).toBe(true);
    expect(r.perKept).toBeNull();
    expect(r.metrics).toBeNull();
  });
  it("still shows the monthly loss and loss per order placed", () => {
    expect(r.monthly!.revenue).toBe(0n);
    expect(r.monthly!.contribution < 0n).toBe(true);
    expect(r.perPlaced!.contribution < 0n).toBe(true);
    expect(r.assumptions.map((a) => a.code)).toContain("recovery_default");
  });
  it("blocks rates above 100%", () => {
    const bad = calculate(baseDetailed({ rtoBps: set(7000n), returnBps: set(4000n) }));
    expect(bad.status).toBe("incomplete");
  });
});

describe("result status model", () => {
  it("is incomplete with nothing entered and names what is needed", () => {
    const r = calculate(emptyInputs());
    expect(r.status).toBe("incomplete");
    expect(r.perKept).toBeNull();
    expect(r.issues.map((i) => i.code)).toEqual(expect.arrayContaining(["price_missing", "gst_missing", "cost_missing"]));
  });
  it("is provisional when marketplace fees are empty, and names them", () => {
    const r = calculate({
      ...emptyInputs("amazon", "quick"),
      sellingPrice: set(118000n),
      gstRateBps: set(1800n),
      productCost: set(35400n),
      rtoBps: set(0n),
      returnBps: set(0n),
    });
    expect(r.status).toBe("provisional");
    expect(r.missingCosts).toEqual(expect.arrayContaining(["Referral fee", "Closing fee", "Shipping / weight-handling fee"]));
    // empty is excluded, not zero
    expect(r.perKept!.contribution).toBe(100000n - 30000n);
  });
  it("is an estimate in Quick mode once the main fields are entered, with a scope note", () => {
    const r = calculate({
      ...emptyInputs("amazon", "quick"),
      sellingPrice: set(118000n),
      gstRateBps: set(1800n),
      productCost: set(35400n),
      fees: { referral: pct(1000n), closing: flat(2000n), shipping: flat(5000n) },
      rtoBps: set(0n),
      returnBps: set(0n),
    });
    expect(r.status).toBe("estimate");
    expect(r.scopeNote).toMatch(/packaging/);
    expect(r.perKept!.contribution).toBe(100000n - 30000n - 11800n - 2000n - 5000n);
  });
  it("treats an explicit not-applicable as a confirmed zero", () => {
    const withNa = calculate(baseDetailed({ packagingCost: NA }));
    expect(withNa.status).toBe("estimate");
    expect(amountOf(withNa.perKept!.lines, "packaging")).toBe(0n);
    const empty = calculate(baseDetailed({ packagingCost: EMPTY }));
    expect(empty.status).toBe("provisional");
    expect(empty.missingCosts).toContain("Packaging cost");
  });
  it("shows operating profit only when operating expenses are answered", () => {
    expect(calculate(baseDetailed()).perKept!.operatingProfit).toBeUndefined();
    const r = calculate(baseDetailed({ operatingExpenses: set(1000000n) })); // Rs 10,000 / month
    expect(r.monthly!.operatingProfit).toBe(4920000n - 1000000n);
    expect(r.perKept!.operatingExpenses).toBe(10000n); // Rs 100 per kept order
    expect(r.perKept!.operatingProfit).toBe(49200n - 10000n);
  });
  it("does not allocate monthly costs without monthly orders", () => {
    const r = calculate(baseDetailed({ monthlyOrders: EMPTY, operatingExpenses: set(1000000n), adSpend: set(500000n) }));
    expect(r.monthly).toBeNull();
    expect(r.status).toBe("provisional");
    expect(r.perKept!.operatingProfit).toBeUndefined();
  });
});

describe("advertising metrics", () => {
  it("computes ACOS, TACoS, ROAS and break-even ROAS exactly", () => {
    const r = calculate(
      baseDetailed({ adSpend: set(1180000n), adRevenue: set(5900000n) }), // spend Rs 11,800, ad sales Rs 59,000
    );
    const m = r.metrics!;
    expect(m.acosBps).toBe(2000n); // 11,800 / 59,000
    expect(m.roasBps).toBe(50000n); // 5.00x
    expect(m.tacosBps).toBe(1000n); // 11,800 / (100 x 1,180)
  });
});

describe("incomplete input never produces a figure", () => {
  it("flags invalid typed values", () => {
    const r = calculate(baseDetailed({ sellingPrice: { state: "invalid", reason: "Enter a valid amount" } }));
    expect(r.status).toBe("incomplete");
    expect(r.perKept).toBeNull();
  });
  it("rejects zero price", () => {
    expect(calculate(baseDetailed({ sellingPrice: set(0n) })).status).toBe("incomplete");
  });
});
