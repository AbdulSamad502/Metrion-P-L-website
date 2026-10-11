import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Launch gate: no floating-point or locale arithmetic may enter the engine.
 * Money is integer paise, percentages are integer basis points, ratios are BigInt rationals.
 */
const BANNED: Array<[string, RegExp]> = [
  ["parseFloat", /\bparseFloat\b/],
  ["Number(", /\bNumber\s*\(/],
  ["toFixed", /\.toFixed\b/],
  ["Math.", /\bMath\./],
  ["Intl", /\bIntl\b/],
  ["toLocaleString", /\btoLocaleString\b/],
  ["decimal literal", /(?<![\w.'"`])\d+\.\d+(?![\w'"`])/],
];

const dir = __dirname;
const sources = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && f !== "testkit.ts");

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("engine contains no float arithmetic", () => {
  for (const file of sources) {
    it(file, () => {
      const code = stripComments(readFileSync(path.join(dir, file), "utf8"))
        // string literals may legitimately contain digits such as "18%" or "2 decimals"
        .replace(/"(?:[^"\\]|\\.)*"/g, '""')
        .replace(/`(?:[^`\\]|\\.)*`/g, "``");
      for (const [name, re] of BANNED) {
        expect(re.test(code), `${file} uses ${name}`).toBe(false);
      }
    });
  }
});
