"use client";

import { useMemo, useState } from "react";
import { formatBps, formatPaise, paiseToInput, parsePercent } from "@/engine/money";
import { calculate } from "@/engine/calculate";
import { diff, rankCosts } from "@/engine/present";
import { solvePrice, type SolveResult, type SolveProfitBasis } from "@/engine/solve";
import type { CalcInputs, CalcResult } from "@/engine/types";
import { toInputs, type FormState } from "@/lib/form";
import { Field, NumberInput, Select } from "./ui";

const money = (p: bigint) => formatPaise(p);

function SolveText({ r, label }: { r: SolveResult; label: string }) {
  if (r.kind === "unavailable") {
    return (
      <p className="text-sm text-muted">
        {r.reason === "no_kept_orders"
          ? "Not solvable: no orders are kept at these return and RTO rates."
          : r.reason === "operating_unavailable"
            ? "Enter operating expenses (or mark them N/A) and monthly orders to solve for operating profit."
            : "Complete the required details above to solve this."}
      </p>
    );
  }
  if (r.kind === "unreachable") return <p className="text-sm text-loss">{r.reason}</p>;
  if (r.kind === "always") return <p className="text-sm">Any selling price meets this target with your current costs.</p>;
  const extra = r.ranges.length > 1;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="text-3xl font-extrabold tracking-tight tabular-nums">{money(r.price)}</p>
      {extra ? (
        <p className="text-[13px] text-muted">
          Your fee price bands make profit jump at some prices. Prices that meet the target:{" "}
          {r.ranges.map((x) => (x.to === null ? `${money(x.from)} and above` : x.from === x.to ? money(x.from) : `${money(x.from)}–${money(x.to)}`)).join("; ")}.
        </p>
      ) : null}
      {r.excludesMissingCosts ? <p className="text-[13px] text-[var(--warn)]">Excludes costs you have not entered, so the real price is higher.</p> : null}
    </div>
  );
}

export function FindMyPrice({ form, inputs, patch }: { form: FormState; inputs: CalcInputs; patch: (p: Partial<FormState>) => void }) {
  const [target, setTarget] = useState("20");
  const [basis, setBasis] = useState<SolveProfitBasis>("contribution");
  const parsed = parsePercent(target, 99);

  const breakEven = useMemo(() => solvePrice(inputs, { kind: "breakeven" }, "contribution"), [inputs]);
  const targetBps = parsed.ok ? parsed.value : null;
  const forMargin = useMemo(
    () => (targetBps !== null ? solvePrice(inputs, { kind: "margin", bps: targetBps }, basis) : null),
    [inputs, targetBps, basis],
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <h4 className="text-[15px] font-bold">Break-even price</h4>
        <p className="text-[13px] text-muted">The lowest price at which contribution profit is zero.</p>
        <SolveText r={breakEven} label="Lowest price that does not lose money" />
      </div>
      <div className="flex flex-col gap-3">
        <h4 className="text-[15px] font-bold">Find my price</h4>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Margin I want" htmlFor="target" error={parsed.ok ? undefined : parsed.reason}>
            <NumberInput id="target" value={target} suffix="%" onChange={setTarget} invalid={!parsed.ok} />
          </Field>
          <Field label="Margin type" htmlFor="target-basis">
            <Select
              id="target-basis"
              value={basis}
              onChange={(v) => setBasis(v === "operating" ? "operating" : "contribution")}
              options={[
                { value: "contribution", label: "Contribution" },
                { value: "operating", label: "Operating" },
              ]}
            />
          </Field>
        </div>
        {forMargin ? <SolveText r={forMargin} label={`Lowest price for a ${target || "0"}% ${basis} margin`} /> : null}
        {forMargin?.kind === "price" ? (
          <button type="button" className="btn btn-ghost w-fit" onClick={() => patch({ price: paiseToInput(forMargin.price), isExample: form.isExample })}>
            Use this price
          </button>
        ) : null}
        <p className="text-[12.5px] text-muted">Assumes your order volume does not change when the price changes.</p>
      </div>
    </div>
  );
}

export function WhatIf({ form, base }: { form: FormState; base: CalcResult }) {
  const [ov, setOv] = useState({ price: "", cost: "", rto: "", ret: "", ads: "" });
  const touched = Object.values(ov).some((v) => v.trim() !== "");

  const scenario = useMemo(() => {
    const f: FormState = {
      ...form,
      price: ov.price.trim() ? ov.price : form.price,
      cost: ov.cost.trim() ? { text: ov.cost, na: false } : form.cost,
      rto: ov.rto.trim() ? { text: ov.rto, na: false } : form.rto,
      ret: ov.ret.trim() ? { text: ov.ret, na: false } : form.ret,
      ads: ov.ads.trim() ? { text: ov.ads, na: false } : form.ads,
    };
    return calculate(toInputs(f));
  }, [form, ov]);

  const rows: Array<[keyof typeof ov, string, string, string]> = [
    ["price", "Selling price", "₹", "price"],
    ["cost", "Product cost", "₹", "cost"],
    ["rto", "RTO rate", "%", "rto"],
    ["ret", "Return rate", "%", "ret"],
    ["ads", "Ad spend / month", "₹", "ads"],
  ];

  const a = base.perKept?.contribution;
  const b = scenario.perKept?.contribution;
  const ma = base.metrics?.contributionMarginBps;
  const mb = scenario.metrics?.contributionMarginBps;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-muted">Type a new value for anything you want to test. Leave a box empty to keep your current number. Order volume is assumed unchanged.</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {rows.map(([key, label, unit]) => (
          <Field key={key} label={label} htmlFor={`wi-${key}`}>
            <NumberInput
              id={`wi-${key}`}
              value={ov[key]}
              {...(unit === "₹" ? { prefix: "₹" } : { suffix: "%" })}
              onChange={(v) => setOv({ ...ov, [key]: v })}
            />
          </Field>
        ))}
      </div>
      {base.status === "incomplete" || !touched ? (
        <p className="text-sm text-muted">{base.status === "incomplete" ? "Complete the calculator above first." : "Change a value to compare."}</p>
      ) : scenario.status === "incomplete" || a === undefined || b === undefined ? (
        <p className="text-sm text-loss">The changed values are not valid yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-line p-3">
            <p className="text-[12px] uppercase tracking-wide text-muted">Now</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{money(a)}</p>
            <p className="text-muted">{ma != null ? formatBps(ma) : "—"}</p>
          </div>
          <div className="rounded-xl border border-line p-3">
            <p className="text-[12px] uppercase tracking-wide text-muted">What if</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{money(b)}</p>
            <p className="text-muted">{mb != null ? formatBps(mb) : "—"}</p>
          </div>
          <div className={`rounded-xl border p-3 ${diff(a, b) < 0n ? "border-[#f3b8b2] bg-[var(--loss-bg)]" : "border-line bg-tint"}`}>
            <p className="text-[12px] uppercase tracking-wide text-muted">Change / order</p>
            <p className={`mt-1 text-lg font-bold tabular-nums ${diff(a, b) < 0n ? "text-loss" : "text-green-text"}`}>
              {diff(a, b) < 0n ? "−" : "+"}
              {money(diff(a, b) < 0n ? -diff(a, b) : diff(a, b))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function MarginKillers({ result }: { result: CalcResult }) {
  const top = result.perKept ? rankCosts(result.perKept).slice(0, 3) : [];
  if (top.length === 0) return <p className="text-sm text-muted">Your biggest costs appear here once the calculator has a result.</p>;
  return (
    <ol className="flex flex-col gap-2">
      {top.map(({ line, shareBps }, i) => (
        <li key={line.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">{i + 1}</span>
          <span className="flex-1 text-sm font-semibold">{line.label}</span>
          <span className="text-sm tabular-nums text-muted">{money(line.amount)}</span>
          <span className="w-16 text-right text-sm font-bold tabular-nums">{formatBps(shareBps)}</span>
        </li>
      ))}
    </ol>
  );
}
