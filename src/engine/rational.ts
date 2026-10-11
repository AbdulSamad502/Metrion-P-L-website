/**
 * Exact rational arithmetic on BigInt. All money maths in the engine runs on
 * these so no floating-point error can ever enter a figure.
 */
export interface Rat {
  readonly n: bigint;
  readonly d: bigint; // always > 0
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    [x, y] = [y, x % y];
  }
  return x;
}

export function rat(n: bigint, d: bigint = 1n): Rat {
  if (d === 0n) throw new RangeError("Rational with zero denominator");
  let nn = n;
  let dd = d;
  if (dd < 0n) {
    nn = -nn;
    dd = -dd;
  }
  const g = gcd(nn, dd);
  return g > 1n ? { n: nn / g, d: dd / g } : { n: nn, d: dd };
}

export const ZERO: Rat = { n: 0n, d: 1n };
export const ONE: Rat = { n: 1n, d: 1n };

export const add = (a: Rat, b: Rat): Rat => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Rat, b: Rat): Rat => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Rat, b: Rat): Rat => rat(a.n * b.n, a.d * b.d);
export const div = (a: Rat, b: Rat): Rat => {
  if (b.n === 0n) throw new RangeError("Division by zero");
  return rat(a.n * b.d, a.d * b.n);
};
export const neg = (a: Rat): Rat => ({ n: -a.n, d: a.d });

export const isZero = (a: Rat): boolean => a.n === 0n;
export const sign = (a: Rat): -1 | 0 | 1 => (a.n === 0n ? 0 : a.n > 0n ? 1 : -1);

export function cmp(a: Rat, b: Rat): -1 | 0 | 1 {
  const l = a.n * b.d;
  const r = b.n * a.d;
  return l === r ? 0 : l < r ? -1 : 1;
}

export const min = (a: Rat, b: Rat): Rat => (cmp(a, b) <= 0 ? a : b);
export const max = (a: Rat, b: Rat): Rat => (cmp(a, b) >= 0 ? a : b);

/** Basis points (1 bp = 0.01%) as a fraction: 1800 bp -> 18/100. */
export const fromBps = (bps: bigint): Rat => rat(bps, 10000n);

export function floor(a: Rat): bigint {
  const q = a.n / a.d; // truncates toward zero
  return a.n < 0n && a.n % a.d !== 0n ? q - 1n : q;
}

export function ceil(a: Rat): bigint {
  const q = a.n / a.d;
  return a.n > 0n && a.n % a.d !== 0n ? q + 1n : q;
}

/** Round half away from zero to a whole number (a paisa when the value is in paise). */
export function roundHalfUp(a: Rat): bigint {
  const abs = a.n < 0n ? -a.n : a.n;
  const r = (2n * abs + a.d) / (2n * a.d);
  return a.n < 0n ? -r : r;
}

export const sum = (xs: readonly Rat[]): Rat => xs.reduce(add, ZERO);
