"use client";

import { AnimatePresence, domAnimation, LazyMotion, m } from "motion/react";
import { formatBps, formatPaise, formatRatio } from "@/engine/money";
import { barPercent, formatCount, pieSlices, rankCosts } from "@/engine/present";
import { Donut, sliceColor } from "./Donut";
import { PnlStatement } from "./PnlStatement";
import type { CalcResult, View } from "@/engine/types";

const money = (p: bigint) => formatPaise(p);
const signed = (p: bigint) => (p < 0n ? "loss" : "profit");

function Banner({ tone, children }: { tone: "warn" | "info" | "loss"; children: React.ReactNode }) {
  const styles =
    tone === "warn"
      ? "border-[var(--warn-line)] bg-[var(--warn-bg)] text-[var(--warn)]"
      : tone === "loss"
        ? "border-[#f3b8b2] bg-[var(--loss-bg)] text-loss"
        : "border-line bg-soft text-ink2";
  return (
    <m.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border px-3.5 py-3 text-sm leading-snug ${styles}`}
      role={tone === "loss" ? "alert" : "status"}
    >
      {children}
    </m.div>
  );
}

function Waterfall({ view, marginBps }: { view: View; marginBps: bigint | null | undefined }) {
  const costs = rankCosts(view);
  const profit = view.contribution;
  const slices = pieSlices(view);
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4" aria-label="Where each order's money goes">
      <p className="text-sm font-bold">Where each ₹ of the sale goes</p>
      {slices.length > 0 ? (
        <Donut
          slices={slices}
          size={180}
          label={`Share of each sale: ${slices.map((s) => `${s.label} ${formatBps(s.bps)}`).join(", ")}`}
          centerTop={profit < 0n ? "Loss" : "Margin"}
          centerBottom={marginBps != null ? formatBps(marginBps) : money(profit)}
        />
      ) : null}
      <ul className="flex flex-col gap-1.5">
        {costs.map(({ line, shareBps }, i) => (
          <li key={line.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
            <span className="truncate text-[13px] text-ink2">{line.label}</span>
            <span className="text-[13px] tabular-nums text-muted">{money(line.amount)} · {formatBps(shareBps)}</span>
            <div className="col-span-2 h-2 overflow-hidden rounded-full bg-soft">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${barPercent(line.amount, view.revenue)}%`, background: sliceColor(line.id, i) }}
              />
            </div>
          </li>
        ))}
        <li className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
          <span className="text-[13px] font-semibold">{profit < 0n ? "Loss" : "Left as profit"}</span>
          <span className={`text-[13px] font-semibold tabular-nums ${profit < 0n ? "text-loss" : "text-green-text"}`}>{money(profit)}</span>
          <div className="col-span-2 h-2 overflow-hidden rounded-full bg-soft">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: `${barPercent(profit < 0n ? -profit : profit, view.revenue)}%`,
                background: profit < 0n ? "var(--loss)" : "var(--green-grad)",
              }}
            />
          </div>
        </li>
      </ul>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3 border-t-[3px] border-t-[var(--green-500)]">
      <dt className="text-[12px] font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-bold tabular-nums">{value}</dd>
      {note ? <p className="mt-0.5 text-[12px] text-muted">{note}</p> : null}
    </div>
  );
}

export function ResultsPanel({ result, modeLabel }: { result: CalcResult; modeLabel: string }) {
  const { status } = result;
  const kept = result.perKept;
  const contribution = kept?.contribution;
  const operating = kept?.operatingProfit;
  const mt = result.metrics;

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="flex flex-col gap-4" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[17px] font-bold tracking-tight">Your result</h3>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              status === "estimate"
                ? "bg-tint text-green-text"
                : status === "provisional"
                  ? "bg-[var(--warn-bg)] text-[var(--warn)]"
                  : "bg-soft text-muted"
            }`}
          >
            {status === "estimate" ? modeLabel : status === "provisional" ? "Provisional" : "Waiting for inputs"}
          </span>
        </div>

        <AnimatePresence initial={false}>
          {result.isExample ? (
            <Banner key="ex" tone="warn">
              <strong>Example data — not real marketplace rates.</strong> These numbers are made up to show how the calculator works. Replace them with your own.
            </Banner>
          ) : null}
        </AnimatePresence>

        {status === "incomplete" ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-soft/60 p-5">
            <p className="font-semibold">Add a few details to see your profit</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-ink2">
              {result.issues
                .filter((i) => i.severity === "blocking")
                .map((i) => (
                  <li key={i.code}>{i.message}</li>
                ))}
            </ul>
            <p className="mt-3 text-[13px] text-muted">
              We never fill in a missing number with zero. Nothing is shown until the required details are in.
            </p>
          </div>
        ) : (
          <>
            {status === "provisional" ? (
              <Banner tone="warn">
                <strong>Provisional.</strong> This is profit <em>before</em> these costs, which you have not entered: {result.missingCosts.join(", ")}. Enter them, or tick &ldquo;Not applicable&rdquo; if they are ₹0.
              </Banner>
            ) : null}
            {result.scopeNote ? <Banner tone="info">{result.scopeNote}</Banner> : null}

            {result.noKeptOrders ? (
              <Banner tone="loss">
                <strong>No orders are kept at these rates.</strong> Per-order profit does not exist, but you still lose money on every order placed.
                {result.perPlaced ? ` Loss per order placed: ${money(result.perPlaced.contribution)}.` : ""}
                {result.monthly ? ` Monthly result: ${money(result.monthly.contribution)}.` : ""}
              </Banner>
            ) : null}

            {kept && contribution !== undefined ? (
              <div className="rounded-2xl border border-line bg-soft/70 p-4 sm:p-5">
                <p className="text-sm font-medium text-ink2">
                  {status === "provisional" ? "Contribution profit before missing costs" : "Contribution profit"} per delivered &amp; kept order
                </p>
                <p key={contribution.toString()} className={`value-flash mt-1 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl ${contribution < 0n ? "text-loss" : "text-ink"}`}>
                  {money(contribution)}
                </p>
                <p className="mt-1 text-sm text-ink2">
                  {mt?.contributionMarginBps !== null && mt?.contributionMarginBps !== undefined
                    ? `${formatBps(mt.contributionMarginBps)} margin on revenue of ${money(kept.revenue)}`
                    : `Revenue ${money(kept.revenue)}`}
                  {" · "}
                  {signed(contribution)}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  {operating !== undefined ? (
                    <Metric
                      label="Operating profit / order"
                      value={money(operating)}
                      {...(mt?.operatingMarginBps != null ? { note: `${formatBps(mt.operatingMarginBps)} margin` } : {})}
                    />
                  ) : null}
                  {result.monthly ? (
                    <Metric
                      label="Monthly contribution"
                      value={money(result.monthly.contribution)}
                      {...(result.orders ? { note: `${formatCount(result.orders.kept)} orders kept of ${formatCount(result.orders.placed)}` } : {})}
                    />
                  ) : null}
                  {result.monthly?.operatingProfit !== undefined ? (
                    <Metric label="Monthly operating profit" value={money(result.monthly.operatingProfit)} />
                  ) : null}
                  {result.perPlaced ? <Metric label="Per order placed" value={money(result.perPlaced.contribution)} note="Includes losses on returns" /> : null}
                </dl>
                {kept.operatingProfit === undefined && result.scopeNote === null ? (
                  <p className="mt-3 text-[13px] text-muted">Add monthly operating expenses (or mark them N/A) to see operating profit.</p>
                ) : null}
              </div>
            ) : null}

            {kept ? <Waterfall view={kept} marginBps={mt?.contributionMarginBps} /> : null}

            <PnlStatement result={result} />

            {mt ? (
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {mt.effectiveFeeBps !== null ? <Metric label="Effective fees" value={formatBps(mt.effectiveFeeBps)} note="of revenue" /> : null}
                {mt.gstRecoveredPerKept !== null ? <Metric label="GST recovered (ITC)" value={money(mt.gstRecoveredPerKept)} note="per kept order" /> : null}
                {mt.acosBps !== null ? <Metric label="ACOS" value={formatBps(mt.acosBps)} /> : null}
                {mt.tacosBps !== null ? <Metric label="TACoS" value={formatBps(mt.tacosBps)} /> : null}
                {mt.roasBps !== null ? <Metric label="ROAS" value={formatRatio(mt.roasBps)} /> : null}
                {mt.breakEvenRoasBps !== null ? <Metric label="Break-even ROAS" value={formatRatio(mt.breakEvenRoasBps)} /> : null}
                {mt.maxCacPaise !== null ? <Metric label="Max ad cost / order" value={money(mt.maxCacPaise)} note="before ads lose money" /> : null}
              </dl>
            ) : null}

            {result.assumptions.length > 0 ? (
              <div>
                <p className="mb-1.5 text-sm font-semibold">Assumptions used</p>
                <ul className="flex flex-col gap-1.5">
                  {result.assumptions.map((a) => (
                    <li key={a.code} className="flex gap-2 text-[13px] text-ink2">
                      <span className="mt-0.5 rounded bg-[var(--warn-bg)] px-1.5 text-[11px] font-bold text-[var(--warn)]">Assumed</span>
                      {a.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}

        <p className="text-[12.5px] leading-relaxed text-muted">
          This is an estimate from the numbers you entered, not a marketplace settlement. Fees, reversals and taxes can differ. Check against your settlement reports and confirm GST treatment with a chartered accountant.
        </p>
      </div>
    </LazyMotion>
  );
}
