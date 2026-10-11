import { emptyInputs } from "@/engine/defaults";
import { activeFields } from "@/engine/marketplaces";
import { parseCount, parseMoney, parsePercent, type ParseResult } from "@/engine/money";
import {
  EMPTY,
  NA,
  set,
  type AmazonFulfilment,
  type Band,
  type CalcInputs,
  type Entry,
  type FeeAmount,
  type FeeInput,
  type GstStatus,
  type MarketplaceId,
  type Mode,
  type PriceBasis,
  type Recovery,
} from "@/engine/types";

/** What the seller has typed. Text only; converted to engine inputs by `toInputs`. */
export interface Raw {
  text: string;
  na: boolean;
}
export interface TierRow {
  upTo: string;
  rate: string;
}
export interface FeeForm {
  value: Raw;
  refund: string;
  useTiers: boolean;
  tierMode: "whole" | "marginal";
  rows: TierRow[];
  /** "" = use the field default. */
  basis: "" | PriceBasis;
}

export interface FormState {
  mode: Mode;
  marketplace: MarketplaceId;
  amazonFulfilment: AmazonFulfilment;
  price: string;
  /** "0" | "5" | "18" | "40" | "custom" | "" */
  gstChoice: string;
  gstCustom: string;
  gstStatus: GstStatus;
  cost: Raw;
  purchaseGst: string;
  servicesGst: string;
  packaging: Raw;
  fees: Record<string, FeeForm>;
  orders: string;
  rto: Raw;
  ret: Raw;
  /** Quick mode: one share-resold figure for both RTO and returns. */
  resell: string;
  rtoSellable: string;
  rtoDamaged: string;
  retSellable: string;
  retDamaged: string;
  salvage: string;
  ads: Raw;
  adRevenue: string;
  opex: Raw;
  isExample: boolean;
}

export const rawEmpty = (): Raw => ({ text: "", na: false });
export const newFeeForm = (): FeeForm => ({
  value: rawEmpty(),
  refund: "",
  useTiers: false,
  tierMode: "whole",
  rows: [
    { upTo: "", rate: "" },
    { upTo: "", rate: "" },
  ],
  basis: "",
});

export function emptyForm(marketplace: MarketplaceId = "amazon"): FormState {
  return {
    mode: "quick",
    marketplace,
    amazonFulfilment: "easy_ship",
    price: "",
    gstChoice: "",
    gstCustom: "",
    gstStatus: "registered_itc",
    cost: rawEmpty(),
    purchaseGst: "",
    servicesGst: "",
    packaging: rawEmpty(),
    fees: {},
    orders: "",
    rto: rawEmpty(),
    ret: rawEmpty(),
    resell: "",
    rtoSellable: "",
    rtoDamaged: "",
    retSellable: "",
    retDamaged: "",
    salvage: "",
    ads: rawEmpty(),
    adRevenue: "",
    opex: rawEmpty(),
    isExample: false,
  };
}

/* ---------- text -> engine entries ---------- */

function entry<T>(text: string, parse: (s: string) => ParseResult<T>): Entry<T> {
  if (text.trim() === "") return EMPTY;
  const r = parse(text);
  return r.ok ? set(r.value) : { state: "invalid", reason: r.reason };
}

const money = (text: string) => entry(text, parseMoney);
const percent = (text: string, max = 100) => entry(text, (s) => parsePercent(s, max));

function rawMoney(r: Raw): Entry<bigint> {
  return r.na ? NA : money(r.text);
}
function rawPercent(r: Raw): Entry<bigint> {
  return r.na ? NA : percent(r.text);
}

function gstEntry(f: FormState): Entry<bigint> {
  if (f.gstChoice === "") return EMPTY;
  if (f.gstChoice === "custom") return percent(f.gstCustom, 100);
  return percent(f.gstChoice);
}

function feeAmount(def: { unit: "percent" | "flat" }, ff: FeeForm): Entry<FeeAmount> {
  const parseAmount = (s: string): ParseResult<bigint> => (def.unit === "percent" ? parsePercent(s) : parseMoney(s));
  if (!ff.useTiers) {
    if (ff.value.na) return NA;
    return entry(ff.value.text, (s) => {
      const r = parseAmount(s);
      return r.ok ? { ok: true, value: { kind: "single", amount: r.value } as FeeAmount } : r;
    });
  }
  const bands: Band[] = [];
  const rows = ff.rows.filter((r) => r.upTo.trim() !== "" || r.rate.trim() !== "");
  if (rows.length === 0) return EMPTY;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as TierRow;
    const last = i === rows.length - 1;
    const rate = parseAmount(row.rate);
    if (!rate.ok) return { state: "invalid", reason: `Band ${i + 1}: ${rate.reason}` };
    if (last) {
      bands.push({ upTo: null, amount: rate.value });
    } else {
      const up = parseMoney(row.upTo);
      if (!up.ok) return { state: "invalid", reason: `Band ${i + 1}: ${up.reason}` };
      bands.push({ upTo: up.value, amount: rate.value });
    }
  }
  return set<FeeAmount>({ kind: "tiers", mode: ff.tierMode, bands });
}

function recovery(sellable: string, damaged: string): Recovery {
  return { sellableBps: percent(sellable), damagedBps: percent(damaged) };
}

export function toInputs(f: FormState): CalcInputs {
  const base = emptyInputs(f.marketplace, f.mode);
  const fees: Record<string, FeeInput> = {};
  for (const def of activeFields(f.marketplace, f.amazonFulfilment)) {
    const ff = f.fees[def.id];
    if (!ff) continue;
    fees[def.id] = {
      amount: feeAmount(def, ff),
      refundBps: percent(ff.refund),
      ...(ff.basis ? { basis: ff.basis } : {}),
    };
  }
  const quick = f.mode === "quick";
  const resell = percent(f.resell);
  return {
    ...base,
    amazonFulfilment: f.amazonFulfilment,
    sellingPrice: money(f.price),
    gstRateBps: gstEntry(f),
    gstStatus: f.gstStatus,
    productCost: rawMoney(f.cost),
    purchaseGstRateBps: percent(f.purchaseGst),
    servicesGstRateBps: percent(f.servicesGst),
    packagingCost: rawMoney(f.packaging),
    fees,
    monthlyOrders: entry(f.orders, parseCount),
    rtoBps: rawPercent(f.rto),
    returnBps: rawPercent(f.ret),
    rtoRecovery: quick ? { sellableBps: resell, damagedBps: EMPTY } : recovery(f.rtoSellable, f.rtoDamaged),
    returnRecovery: quick ? { sellableBps: resell, damagedBps: EMPTY } : recovery(f.retSellable, f.retDamaged),
    salvageBps: percent(f.salvage),
    adSpend: rawMoney(f.ads),
    adRevenue: money(f.adRevenue),
    operatingExpenses: rawMoney(f.opex),
    isExample: f.isExample,
  };
}

/* ---------- example data (fictional; always labelled) ---------- */

export function exampleForm(marketplace: MarketplaceId): FormState {
  const f = emptyForm(marketplace);
  const t = (text: string): Raw => ({ text, na: false });
  const fee = (text: string): FeeForm => ({ ...newFeeForm(), value: t(text) });
  const common = {
    ...f,
    mode: "quick" as Mode,
    price: "1199",
    gstChoice: "18",
    cost: t("450"),
    orders: "300",
    rto: t("8"),
    ret: t("5"),
    isExample: true,
  };
  if (marketplace === "amazon") {
    return { ...common, fees: { referral: fee("10"), closing: fee("20"), shipping: fee("55") } };
  }
  if (marketplace === "flipkart") {
    return { ...common, fees: { commission: fee("9"), fixed_fee: fee("10"), shipping: fee("60") } };
  }
  return { ...common, fees: { commission: fee("0"), shipping: fee("65"), other: fee("0") } };
}
