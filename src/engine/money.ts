/**
 * Parsing and formatting. Typed text is converted to integers (paise, basis
 * points, counts) by string handling only; no parseFloat/Number on money.
 */

export type ParseResult<T> = { ok: true; value: T } | { ok: false; reason: string };

const DECIMAL = /^(\d+)(?:\.(\d{1,2}))?$/;

function clean(raw: string): string {
  return raw.replace(/[₹,\s%]/g, "").replace(/^rs\.?/i, "");
}

/** "1,499.50" -> 149950n paise. At most 2 decimals; no negatives. */
export function parseMoney(raw: string): ParseResult<bigint> {
  const s = clean(raw);
  if (s === "") return { ok: false, reason: "Enter an amount" };
  const m = DECIMAL.exec(s);
  if (!m) return { ok: false, reason: "Enter a valid amount (max 2 decimals)" };
  const rupees = BigInt(m[1] as string);
  const paise = BigInt(((m[2] ?? "") + "00").slice(0, 2));
  return { ok: true, value: rupees * 100n + paise };
}

/** "12.5" -> 1250n basis points (1 bp = 0.01%). At most 2 decimals. */
export function parsePercent(raw: string, maxPercent = 100): ParseResult<bigint> {
  const s = clean(raw);
  if (s === "") return { ok: false, reason: "Enter a percentage" };
  const m = DECIMAL.exec(s);
  if (!m) return { ok: false, reason: "Enter a valid percentage (max 2 decimals)" };
  const bps = BigInt(m[1] as string) * 100n + BigInt(((m[2] ?? "") + "00").slice(0, 2));
  if (bps > BigInt(maxPercent) * 100n) {
    return { ok: false, reason: `Must be ${maxPercent}% or less` };
  }
  return { ok: true, value: bps };
}

/** Whole numbers only (order counts). */
export function parseCount(raw: string): ParseResult<bigint> {
  const s = raw.replace(/[,\s]/g, "");
  if (s === "") return { ok: false, reason: "Enter a number" };
  if (!/^\d+$/.test(s)) return { ok: false, reason: "Enter a whole number" };
  return { ok: true, value: BigInt(s) };
}

/** Indian digit grouping: 1234567 -> "12,34,567". */
function groupIndian(intPart: string): string {
  if (intPart.length <= 3) return intPart;
  const last3 = intPart.slice(-3);
  let rest = intPart.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `${parts.join(",")},${last3}`;
}

export function formatPaise(paise: bigint, opts: { symbol?: boolean; decimals?: boolean } = {}): string {
  const { symbol = true, decimals = true } = opts;
  const negative = paise < 0n;
  const abs = negative ? -paise : paise;
  const rupees = abs / 100n;
  const rem = abs % 100n;
  const body = groupIndian(rupees.toString()) + (decimals ? `.${rem.toString().padStart(2, "0")}` : "");
  return `${negative ? "−" : ""}${symbol ? "₹" : ""}${body}`;
}

export function formatBps(bps: bigint): string {
  const negative = bps < 0n;
  const abs = negative ? -bps : bps;
  const whole = abs / 100n;
  const frac = (abs % 100n).toString().padStart(2, "0");
  return `${negative ? "−" : ""}${whole}.${frac}%`;
}

/** Plain editable text for a paise value, e.g. 149950n -> "1499.5". */
export function paiseToInput(paise: bigint): string {
  const rupees = paise / 100n;
  const rem = paise % 100n;
  if (rem === 0n) return rupees.toString();
  return `${rupees}.${rem.toString().padStart(2, "0").replace(/0$/, "")}`;
}

export function bpsToInput(bps: bigint): string {
  const whole = bps / 100n;
  const rem = bps % 100n;
  if (rem === 0n) return whole.toString();
  return `${whole}.${rem.toString().padStart(2, "0").replace(/0$/, "")}`;
}

/** Ratio given in basis points of 1: 50000 -> "5.00x". Used for ROAS. */
export function formatRatio(bps: bigint): string {
  const whole = bps / 10000n;
  const frac = ((bps % 10000n) / 100n).toString().padStart(2, "0");
  return `${whole}.${frac}×`;
}
