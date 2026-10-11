"use client";

import { useEffect, useState } from "react";
import { formatBps } from "@/engine/money";
import type { PieSlice } from "@/engine/present";

const PALETTE: Record<string, string> = {
  profit: "#53bb3e",
  product: "#334155",
  stock_loss: "#ef4444",
  packaging: "#ec4899",
  advertising: "#f97316",
  fee_gst: "#14b8a6",
  fee_referral: "#f59e0b",
  fee_commission: "#f59e0b",
  fee_closing: "#8b5cf6",
  fee_fixed_fee: "#8b5cf6",
  fee_collection_fee: "#6366f1",
  fee_shipping: "#3b82f6",
  fee_fba_fulfilment: "#06b6d4",
  fee_reverse: "#0ea5e9",
  fee_other: "#a855f7",
};
const FALLBACK = ["#64748b", "#84cc16", "#d946ef", "#eab308"];

export function sliceColor(id: string, index = 0): string {
  return PALETTE[id] ?? (FALLBACK[index % FALLBACK.length] as string);
}

/** Animated donut. Angles come from basis points supplied by the engine helper; this file only draws. */
export function Donut({
  slices,
  centerTop,
  centerBottom,
  label,
  size = 200,
}: {
  slices: PieSlice[];
  centerTop: string;
  centerBottom: string;
  label: string;
  size?: number;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Running start position of each slice, computed up front so render stays pure.
  const starts = slices.map((_, i) => slices.slice(0, i).reduce((a, x) => a + Number(x.bps) / 100, 0));
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 42 42" width={size} height={size} role="img" aria-label={label} className="-rotate-90">
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#eef3ea" strokeWidth="6" />
          {slices.map((s, i) => {
            const pct = Number(s.bps) / 100;
            const dash = Math.max(pct - 0.5, 0);
            const el = (
              <circle
                key={s.id}
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                stroke={sliceColor(s.id, i)}
                strokeWidth="6"
                strokeDasharray={`${ready ? dash : 0} ${100 - (ready ? dash : 0)}`}
                strokeDashoffset={-(starts[i] ?? 0)}
                style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.2,0.7,0.2,1)", transitionDelay: `${i * 70}ms` }}
              >
                <title>{`${s.label}: ${formatBps(s.bps)}`}</title>
              </circle>
            );
            return el;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{centerTop}</span>
          <span className="text-2xl font-extrabold tabular-nums">{centerBottom}</span>
        </div>
      </div>
      <ul className="grid w-full gap-1.5 text-[13px]">
        {slices.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2">
            <span aria-hidden className="h-3 w-3 shrink-0 rounded-[4px]" style={{ background: sliceColor(s.id, i) }} />
            <span className="flex-1 truncate text-ink2">{s.label}</span>
            <span className="font-semibold tabular-nums">{formatBps(s.bps)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
