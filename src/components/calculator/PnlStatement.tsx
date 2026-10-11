"use client";

import { useState } from "react";
import { whyLine } from "@/content/why";
import { formatPaise } from "@/engine/money";
import type { CalcResult, Line, LineGroup, View } from "@/engine/types";

const money = (p: bigint) => formatPaise(p);

const BLOCKS: Array<{ title: string; groups: LineGroup[] }> = [
  { title: "Cost of goods", groups: ["product", "stock_loss"] },
  { title: "Marketplace charges", groups: ["commission", "shipping", "fulfilment", "other_fee", "fee_gst", "fee_refund"] },
  { title: "Packaging and advertising", groups: ["packaging", "advertising"] },
];

function Row({ label, value, tone, why, bold }: { label: string; value: string; tone?: "loss" | "good"; why?: string; bold?: boolean }) {
  const cls = `tabular-nums ${bold ? "font-bold" : "font-semibold"} ${tone === "loss" ? "text-loss" : tone === "good" ? "text-green-text" : ""}`;
  if (!why) {
    return (
      <li className={`flex items-center justify-between px-3 py-2.5 text-sm ${bold ? "bg-soft" : ""}`}>
        <span className={bold ? "font-bold" : ""}>{label}</span>
        <span className={cls}>{value}</span>
      </li>
    );
  }
  return (
    <li>
      <details>
        <summary className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-soft">
          <span>
            <span aria-hidden className="mr-1 text-muted">▸</span>
            {label}
          </span>
          <span className={cls}>{value}</span>
        </summary>
        <p className="px-3 pb-3 text-[13px] leading-relaxed text-muted">{why}</p>
      </details>
    </li>
  );
}

/** A proper profit and loss statement, per delivered order or for the month. */
export function PnlStatement({ result }: { result: CalcResult }) {
  const [tab, setTab] = useState<"order" | "month">("order");
  const view: View | null = tab === "month" && result.monthly ? result.monthly : result.perKept;
  if (!view) return null;
  const lines = view.lines.filter((l) => l.amount !== 0n);
  const byGroup = (groups: LineGroup[]): Line[] => lines.filter((l) => groups.includes(l.group));
  const loss = (v: bigint) => (v < 0n ? ("loss" as const) : undefined);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-bold">Profit &amp; loss statement</p>
        <div role="tablist" aria-label="Statement period" className="flex rounded-full border border-line bg-soft p-0.5 text-[12px] font-semibold">
          {(["order", "month"] as const).map((t) => {
            const disabled = t === "month" && !result.monthly;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                disabled={disabled}
                title={disabled ? "Enter orders per month to see the monthly statement" : undefined}
                onClick={() => setTab(t)}
                className={`rounded-full px-3 py-1 transition-colors ${tab === t ? "bg-ink text-white" : "text-ink2"} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
              >
                {t === "order" ? "Per order" : "Monthly"}
              </button>
            );
          })}
        </div>
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
        <Row label="Revenue (price excluding GST)" value={money(view.revenue)} bold />
        {BLOCKS.map((b) => {
          const rows = byGroup(b.groups);
          if (rows.length === 0) return null;
          return (
            <li key={b.title}>
              <p className="bg-soft/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">{b.title}</p>
              <ul className="divide-y divide-line">
                {rows.map((l) => (
                  <Row key={l.id} label={l.label} value={`${l.amount < 0n ? "+" : "−"}${money(l.amount < 0n ? -l.amount : l.amount)}`} tone={l.amount < 0n ? "good" : undefined} why={whyLine(l)} />
                ))}
              </ul>
            </li>
          );
        })}
        <Row label="Contribution profit" value={money(view.contribution)} tone={loss(view.contribution)} bold />
        {view.operatingExpenses !== undefined && view.operatingProfit !== undefined ? (
          <>
            <Row label="Operating expenses" value={`−${money(view.operatingExpenses)}`} />
            <Row label="Operating profit" value={money(view.operatingProfit)} tone={loss(view.operatingProfit)} bold />
          </>
        ) : null}
      </ul>
      <p className="mt-1.5 text-[12px] text-muted">Tap a line to see why it is what it is. {tab === "order" ? "Per delivered-and-kept order, with return losses spread across them." : "Totals for the month."}</p>
    </div>
  );
}
