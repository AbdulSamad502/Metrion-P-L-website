"use client";

import { useCallback, useMemo, useState } from "react";
import { calculate } from "@/engine/calculate";
import { formatBps, formatPaise } from "@/engine/money";
import { MARKETPLACE_LABEL } from "@/engine/marketplaces";
import type { MarketplaceId, Mode } from "@/engine/types";
import { emptyForm, exampleForm, toInputs, type FormState } from "@/lib/form";
import { Reveal } from "../Reveal";
import { InputsPanel } from "./InputsPanel";
import { ResultsPanel } from "./ResultsPanel";
import { FindMyPrice, MarginKillers, WhatIf } from "./Tools";

export function Calculator({ defaultMarketplace = "amazon" }: { defaultMarketplace?: MarketplaceId }) {
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultMarketplace));
  const patch = useCallback((p: Partial<FormState>) => setForm((f) => ({ ...f, ...p })), []);

  const inputs = useMemo(() => toInputs(form), [form]);
  const result = useMemo(() => calculate(inputs), [inputs]);

  const onMarketplace = (m: MarketplaceId) =>
    setForm((f) => (f.isExample ? { ...exampleForm(m), mode: f.mode } : { ...f, marketplace: m, fees: {}, amazonFulfilment: "easy_ship" }));
  const onMode = (mode: Mode) => patch({ mode });
  const onReset = () => setForm((f) => ({ ...emptyForm(f.marketplace), mode: f.mode }));
  const onExample = () => setForm((f) => ({ ...exampleForm(f.marketplace), mode: f.mode }));

  const modeLabel = form.mode === "quick" ? "Expected P&L" : "Detailed P&L";
  const kept = result.perKept;
  const margin = result.metrics?.contributionMarginBps;

  return (
    <div id="calculator" className="scroll-mt-24">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_430px] lg:items-start">
        <Reveal variant="left" className="no-print">
          <div>
            <InputsPanel form={form} inputs={inputs} result={result} patch={patch} onMarketplace={onMarketplace} onMode={onMode} onReset={onReset} onExample={onExample} />
          </div>
        </Reveal>

        <div id="results" className="card scroll-mt-24 p-4 sm:p-6 lg:sticky lg:top-24">
          <p className="print-only mb-3 text-sm">
            Metrion profit &amp; loss estimate · {MARKETPLACE_LABEL[form.marketplace]} · {modeLabel}
          </p>
          <ResultsPanel result={result} modeLabel={modeLabel} />
          <div className="no-print mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => window.print()} disabled={result.status === "incomplete"}>
              Print or save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* Mobile quick-glance bar */}
      {kept && result.status !== "incomplete" ? (
        <a
          href="#results"
          className="no-print fixed inset-x-3 bottom-3 z-30 flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-white shadow-2xl lg:hidden"
          aria-label="Jump to your result"
        >
          <span className="text-[13px] text-white/70">{result.status === "provisional" ? "Profit before missing costs" : "Profit / kept order"}</span>
          <span className="text-lg font-extrabold tabular-nums">
            {formatPaise(kept.contribution)}
            {margin != null ? <span className="ml-2 text-[13px] font-medium text-white/70">{formatBps(margin)}</span> : null}
          </span>
        </a>
      ) : null}

      <div className="no-print mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-4 sm:p-6 lg:col-span-2" aria-labelledby="fmp-title">
          <h3 id="fmp-title" className="mb-4 text-xl font-bold tracking-tight">
            Break-even and Find My Price
          </h3>
          <FindMyPrice form={form} inputs={inputs} patch={patch} />
        </section>
        <section className="card p-4 sm:p-6" aria-labelledby="wi-title">
          <h3 id="wi-title" className="mb-4 text-xl font-bold tracking-tight">
            What if&hellip;?
          </h3>
          <WhatIf form={form} base={result} />
        </section>
        <section className="card p-4 sm:p-6" aria-labelledby="mk-title">
          <h3 id="mk-title" className="mb-1 text-xl font-bold tracking-tight">
            What&rsquo;s killing your margin?
          </h3>
          <p className="mb-4 text-[13px] text-muted">Your three biggest costs per delivered-and-kept order, as a share of revenue.</p>
          <MarginKillers result={result} />
        </section>
      </div>
    </div>
  );
}
