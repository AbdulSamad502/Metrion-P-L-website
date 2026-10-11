import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { calculate } from "./calculate";
import { emptyInputs } from "./defaults";
import { evaluate, prepare } from "./model";
import * as R from "./rational";
import { solvePrice, type SolveResult, type SolveTarget } from "./solve";
import { flat, pct, tiers } from "./testkit";
import { EMPTY, NA, set, type CalcInputs, type FeeInput } from "./types";

/** Unregistered, no GST on services, Detailed mode, Meesho: profit(P) = P - cost - fees. */
function simple(cost: bigint, fees: Record<string, FeeInput>): CalcInputs {
  return {
    ...emptyInputs("meesho", "detailed"),
    gstStatus: "unregistered",
    sellingPrice: set(1000n),
    productCost: set(cost),
    servicesGstRateBps: NA,
    packagingCost: NA,
    adSpend: NA,
    monthlyOrders: set(1n),
    rtoBps: set(0n),
    returnBps: set(0n),
    fees,
  };
}
const naFee: FeeInput = { amount: NA, refundBps: EMPTY };
const OTHER_FEES = { shipping: naFee, reverse: naFee, other: naFee };

const exactG = (inputs: CalcInputs, target: SolveTarget, price: bigint): R.Rat => {
  const p = prepare(inputs).prepared!;
  const t = evaluate(p, price);
  const m = target.kind === "margin" ? R.fromBps(target.bps) : R.ZERO;
  return R.sub(t.contribution, R.mul(m, t.revenue));
};

function bruteFeasible(inputs: CalcInputs, target: SolveTarget, max: bigint): bigint[] {
  const ok: bigint[] = [];
  for (let price = 1n; price <= max; price++) if (R.sign(exactG(inputs, target, price)) >= 0) ok.push(price);
  return ok;
}

describe("break-even and Find My Price (single linear segment)", () => {
  // Flipkart, unregistered, cost Rs 100, commission 10% of price, shipping Rs 20, 18% GST on fees (not recoverable).
  // profit(P) = P - 10000 - 0.1P - 2000 - 0.18 x (0.1P + 2000) = 0.882 P - 12360 (paise)
  const flipkart = (): CalcInputs => ({
    ...simple(10000n, {}),
    marketplace: "flipkart",
    servicesGstRateBps: set(1800n),
    fees: { commission: pct(1000n), shipping: flat(2000n), fixed_fee: naFee, collection_fee: naFee, reverse: naFee, other: naFee },
  });

  it("break-even price is Rs 140.14", () => {
    // 0.882 x 14014 = 12360.35 >= 12360 ; 0.882 x 14013 = 12359.47 < 12360
    expect(solvePrice(flipkart(), { kind: "breakeven" })).toMatchObject({ kind: "price", price: 14014n });
  });
  it("20% target margin price is Rs 181.24", () => {
    // 0.882 P - 12360 >= 0.2 P  ->  P >= 18123.17
    expect(solvePrice(flipkart(), { kind: "margin", bps: 2000n })).toMatchObject({ kind: "price", price: 18124n });
  });
  it("round-trips through calculate(): meets the target, one paisa lower does not", () => {
    const base = flipkart();
    const target: SolveTarget = { kind: "margin", bps: 2000n };
    const r = solvePrice(base, target) as Extract<SolveResult, { kind: "price" }>;
    const margin = calculate({ ...base, sellingPrice: set(r.price) }).metrics!.contributionMarginBps!;
    expect(margin >= 2000n).toBe(true);
    expect(R.sign(exactG(base, target, r.price - 1n))).toBe(-1);
  });
  it("break-even never shows a negative displayed profit", () => {
    const base = flipkart();
    const r = solvePrice(base, { kind: "breakeven" }) as Extract<SolveResult, { kind: "price" }>;
    expect(calculate({ ...base, sellingPrice: set(r.price) }).perKept!.contribution >= 0n).toBe(true);
  });
  it("works without a selling price entered", () => {
    const base: CalcInputs = { ...flipkart(), sellingPrice: { state: "empty" } };
    expect(solvePrice(base, { kind: "breakeven" })).toMatchObject({ kind: "price", price: 14014n });
  });
});

describe("piecewise: whole-price bands with a jump", () => {
  // commission: <= Rs 5.00 -> 10%, <= Rs 10.00 -> 95%, above -> 10%. cost Rs 2.00.
  const bands = [
    { upTo: 500n, amount: 1000n },
    { upTo: 1000n, amount: 9500n },
    { upTo: null, amount: 1000n },
  ];
  const inputs = simple(200n, { commission: tiers("whole", bands), ...OTHER_FEES });

  it("finds the lowest price and reports both feasible ranges", () => {
    const r = solvePrice(inputs, { kind: "breakeven" });
    expect(r.kind).toBe("price");
    if (r.kind === "price") {
      expect(r.price).toBe(223n); // 0.9 P >= 200 -> P >= 222.2
      expect(r.ranges).toEqual([
        { from: 223n, to: 500n },
        { from: 1001n, to: null },
      ]);
    }
  });
  it("a margin target can hit a single-price window and then jump", () => {
    const r = solvePrice(inputs, { kind: "margin", bps: 5000n });
    expect(r).toMatchObject({
      kind: "price",
      price: 500n,
      ranges: [
        { from: 500n, to: 500n },
        { from: 1001n, to: null },
      ],
    });
  });
});

describe("piecewise: marginal (progressive) bands are continuous", () => {
  // 10% on the first Rs 5.00, 30% above it. cost Rs 2.00.
  const inputs = simple(200n, {
    commission: tiers("marginal", [
      { upTo: 500n, amount: 1000n },
      { upTo: null, amount: 3000n },
    ]),
    ...OTHER_FEES,
  });
  it("matches exhaustive search", () => {
    const target: SolveTarget = { kind: "margin", bps: 3000n };
    const brute = bruteFeasible(inputs, target, 3000n);
    const r = solvePrice(inputs, target);
    expect(r.kind).toBe("price");
    if (r.kind === "price") expect(r.price).toBe(brute[0]);
  });
});

describe("degenerate cases", () => {
  it("is unreachable when fees take all of the revenue", () => {
    const r = solvePrice(simple(200n, { commission: pct(10000n), ...OTHER_FEES }), { kind: "breakeven" });
    expect(r.kind).toBe("unreachable");
  });
  it("is unavailable when no orders are kept", () => {
    const i = { ...simple(200n, { commission: pct(1000n), ...OTHER_FEES }), rtoBps: set(10000n) };
    expect(solvePrice(i, { kind: "breakeven" })).toEqual({ kind: "unavailable", reason: "no_kept_orders" });
  });
  it("is unavailable when inputs are incomplete", () => {
    expect(solvePrice(emptyInputs(), { kind: "breakeven" })).toEqual({ kind: "unavailable", reason: "incomplete" });
  });
  it("flags when missing costs are excluded", () => {
    const r = solvePrice(simple(200n, { commission: pct(1000n) }), { kind: "breakeven" });
    expect(r).toMatchObject({ kind: "price", excludesMissingCosts: true });
  });
  it("returns always when profit is positive at any price", () => {
    const r = solvePrice(simple(0n, { commission: pct(1000n), ...OTHER_FEES }), { kind: "breakeven" });
    expect(r.kind).toBe("always");
  });
});

describe("solver equals an exhaustive paisa scan (property test)", () => {
  const bandArb = fc
    .tuple(
      fc.uniqueArray(fc.integer({ min: 20, max: 600 }), { minLength: 1, maxLength: 3 }),
      fc.array(fc.integer({ min: 0, max: 9500 }), { minLength: 4, maxLength: 4 }),
    )
    .map(([edges, rates]) => {
      const sorted = [...edges].sort((a, b) => a - b);
      return [
        ...sorted.map((e, i) => ({ upTo: BigInt(e), amount: BigInt(rates[i] as number) })),
        { upTo: null, amount: BigInt(rates[sorted.length] as number) },
      ];
    });

  it("whole-price bands on incl/excl GST bases, with and without GST", () => {
    fc.assert(
      fc.property(
        bandArb,
        fc.constantFrom<"price_incl_gst" | "price_excl_gst">("price_incl_gst", "price_excl_gst"),
        fc.integer({ min: 0, max: 300 }),
        fc.integer({ min: 0, max: 6000 }),
        fc.boolean(),
        (bands, basis, cost, marginBps, registered) => {
          const base: CalcInputs = {
            ...simple(BigInt(cost), { commission: tiers("whole", bands, basis), ...OTHER_FEES }),
            gstStatus: registered ? "registered_no_itc" : "unregistered",
            gstRateBps: registered ? set(1800n) : { state: "empty" },
            servicesGstRateBps: set(1800n),
          };
          const target: SolveTarget = { kind: "margin", bps: BigInt(marginBps) };
          const feasible = new Set(bruteFeasible(base, target, 800n));
          const r = solvePrice(base, target);
          for (let price = 1n; price <= 800n; price++) {
            const got =
              r.kind === "always" ||
              (r.kind === "price" && r.ranges.some((x) => price >= x.from && (x.to === null || price <= x.to)));
            if (feasible.has(price) !== got) return false;
          }
          // The scan only covers 1..800; a solver answer beyond it is fine when nothing feasible was found inside it.
          if (r.kind === "price") return feasible.size === 0 ? r.price > 800n : r.price === [...feasible][0];
          if (r.kind === "unreachable") return feasible.size === 0;
          return true;
        },
      ),
      { numRuns: 60 },
    );
  });
});
