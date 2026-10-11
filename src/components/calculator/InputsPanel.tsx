"use client";

import { activeFields, AMAZON_FULFILMENT_LABEL, MARKETPLACE_LABEL, type FeeFieldDef } from "@/engine/marketplaces";
import type { AmazonFulfilment, CalcInputs, MarketplaceId, Mode } from "@/engine/types";
import { exampleForm, newFeeForm, type FeeForm, type FormState, type Raw } from "@/lib/form";
import { useState } from "react";
import { Megaphone, Repeat2, Store, Tag } from "lucide-react";
import type { CalcResult } from "@/engine/types";
import { ChoiceCards, Field, invalidReason, NaToggle, NumberInput, Pills, SectionCard, Segmented, Select } from "./ui";

type Patch = (p: Partial<FormState>) => void;

/** A money/percent input with an optional "not applicable" confirmation. */
function RawField({
  id,
  label,
  hint,
  raw,
  onChange,
  prefix,
  suffix,
  error,
  allowNa = true,
  optional,
}: {
  id: string;
  label: string;
  hint?: string;
  raw: Raw;
  onChange: (r: Raw) => void;
  prefix?: string;
  suffix?: string;
  error?: string | undefined;
  allowNa?: boolean;
  optional?: boolean;
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} optional={optional ?? false}>
      <NumberInput
        id={id}
        value={raw.na ? "" : raw.text}
        disabled={raw.na}
        invalid={Boolean(error)}
        {...(prefix ? { prefix } : {})}
        {...(suffix ? { suffix } : {})}
        placeholder={raw.na ? "₹0 confirmed" : ""}
        onChange={(text) => onChange({ text, na: false })}
      />
      {allowNa ? <NaToggle checked={raw.na} onChange={(na) => onChange({ text: "", na })} /> : null}
    </Field>
  );
}

function FeeEditor({
  def,
  form,
  inputs,
  patch,
  detailed,
}: {
  def: FeeFieldDef;
  form: FormState;
  inputs: CalcInputs;
  patch: Patch;
  detailed: boolean;
}) {
  const ff: FeeForm = form.fees[def.id] ?? newFeeForm();
  const setFee = (next: Partial<FeeForm>) => patch({ fees: { ...form.fees, [def.id]: { ...ff, ...next } } });
  const fi = inputs.fees[def.id];
  const error = fi ? invalidReason(fi.amount) : undefined;
  const isPct = def.unit === "percent";
  const id = `fee-${def.id}`;
  const showTiers = detailed && def.tierable;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-soft/60 p-3.5 sm:col-span-2">
      {!ff.useTiers ? (
        <RawField
          id={id}
          label={`${def.label}${isPct ? " (%)" : " (₹ per order)"}`}
          hint={def.help}
          raw={ff.value}
          onChange={(value) => setFee({ value })}
          {...(isPct ? { suffix: "%" } : { prefix: "₹" })}
          error={error}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">{def.label} by price band</p>
          <p className="text-[13px] text-muted">{def.help}</p>
          <div className="flex items-center gap-2">
            <label htmlFor={`${id}-mode`} className="text-[13px] text-muted">
              Band type
            </label>
            <Select
              id={`${id}-mode`}
              value={ff.tierMode}
              onChange={(v) => setFee({ tierMode: v === "marginal" ? "marginal" : "whole" })}
              options={[
                { value: "whole", label: "Rate applies to the whole price" },
                ...(isPct ? [{ value: "marginal", label: "Progressive (each slice has its own rate)" }] : []),
              ]}
            />
          </div>
          {ff.rows.map((row, i) => {
            const last = i === ff.rows.length - 1;
            return (
              <div key={i} className="grid grid-cols-2 gap-2">
                {last ? (
                  <div className="flex min-h-11 items-center text-sm text-muted">Above the last limit</div>
                ) : (
                  <NumberInput
                    id={`${id}-up-${i}`}
                    value={row.upTo}
                    prefix="Up to ₹"
                    onChange={(upTo) => setFee({ rows: ff.rows.map((r, j) => (j === i ? { ...r, upTo } : r)) })}
                  />
                )}
                <NumberInput
                  id={`${id}-rate-${i}`}
                  value={row.rate}
                  {...(isPct ? { suffix: "%" } : { prefix: "₹" })}
                  onChange={(rate) => setFee({ rows: ff.rows.map((r, j) => (j === i ? { ...r, rate } : r)) })}
                />
              </div>
            );
          })}
          <div className="flex gap-3 text-[13px]">
            <button type="button" className="font-semibold text-green-text underline" onClick={() => setFee({ rows: [{ upTo: "", rate: "" }, ...ff.rows] })}>
              Add band
            </button>
            {ff.rows.length > 2 ? (
              <button type="button" className="text-muted underline" onClick={() => setFee({ rows: ff.rows.slice(1) })}>
                Remove first band
              </button>
            ) : null}
          </div>
          {error ? (
            <p className="text-[13px] text-loss" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}

      {showTiers ? (
        <label className="flex w-fit cursor-pointer items-center gap-2 text-[13px] text-muted">
          <input type="checkbox" className="h-4 w-4 accent-[#1b7a28]" checked={ff.useTiers} onChange={(e) => setFee({ useTiers: e.target.checked })} />
          This fee changes with the selling price
        </label>
      ) : null}

      {detailed ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Refunded on returns/RTO (%)" htmlFor={`${id}-refund`} hint="Share of this fee you get back when an order is returned. Left empty we assume 0%.">
            <NumberInput id={`${id}-refund`} value={ff.refund} suffix="%" onChange={(refund) => setFee({ refund })} />
          </Field>
          {isPct ? (
            <Field label="Fee is charged on" htmlFor={`${id}-basis`} hint="Check your fee report. Default is the price including GST.">
              <Select
                id={`${id}-basis`}
                value={ff.basis}
                onChange={(v) => setFee({ basis: v === "price_excl_gst" ? "price_excl_gst" : v === "price_incl_gst" ? "price_incl_gst" : "" })}
                options={[
                  { value: "", label: "Selling price incl. GST (default)" },
                  { value: "price_excl_gst", label: "Selling price excl. GST" },
                ]}
              />
            </Field>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function InputsPanel({
  form,
  inputs,
  result,
  patch,
  onMarketplace,
  onMode,
  onReset,
  onExample,
}: {
  form: FormState;
  inputs: CalcInputs;
  result: CalcResult;
  patch: Patch;
  onMarketplace: (m: MarketplaceId) => void;
  onMode: (m: Mode) => void;
  onReset: () => void;
  onExample: () => void;
}) {
  const detailed = form.mode === "detailed";
  const [adv, setAdv] = useState(false);
  const fields = activeFields(form.marketplace, form.amazonFulfilment).filter((f) => detailed || f.quick);
  const registered = form.gstStatus !== "unregistered";

  const has = (prefix: string) => result.issues.some((i) => i.code.startsWith(prefix));
  const doneProduct = !has("price_") && !has("gst_") && !has("cost_") && !has("invalid_sellingPrice") && !has("invalid_productCost") && !has("invalid_gstRateBps");
  const doneFees = !has("missing_fee_") && !has("invalid_fee_") && !has("invalid_tiers_");
  const doneOrders = !has("outcomes_exceed") && !has("invalid_rtoBps") && !has("invalid_returnBps") && ratesAnswered(form);
  const doneExtras = !has("missing_packaging") && !has("missing_ads");
  const steps = [
    { id: "sec-product", label: "Product", done: doneProduct },
    { id: "sec-fees", label: "Fees", done: doneFees },
    { id: "sec-orders", label: "Orders", done: doneOrders },
    ...(detailed ? [{ id: "sec-extras", label: "Extras", done: doneExtras }] : []),
  ];
  const doneCount = steps.filter((x) => x.done).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="card enter grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <div className="flex flex-col gap-3">
          <Segmented
            label="Marketplace"
            value={form.marketplace}
            onChange={onMarketplace}
            options={[
              { value: "amazon" as MarketplaceId, label: "Amazon" },
              { value: "flipkart" as MarketplaceId, label: "Flipkart" },
              { value: "meesho" as MarketplaceId, label: "Meesho" },
            ]}
          />
          <Segmented
            label="Calculation mode"
            value={form.mode}
            onChange={onMode}
            options={[
              { value: "quick", label: "Expected" },
              { value: "detailed", label: "Detailed" },
            ]}
          />
          <div className="rounded-xl border border-line bg-white/70 px-3 py-2.5 text-[12.5px] leading-snug text-ink2">
            {detailed ? (
              <>
                <strong>Detailed:</strong> adds packaging, advertising, overheads and how much returned stock you recover, for an accurate profit and loss.
              </>
            ) : (
              <>
                <strong>Expected:</strong> only the key numbers (price, cost, fees, returns). A quick profit and loss in about 30 seconds.
              </>
            )}
            {detailed ? (
              <button type="button" onClick={() => setAdv((v) => !v)} aria-pressed={adv} className={`mt-2 flex w-fit flex-wrap items-center gap-x-2 rounded-full border px-3 py-1 text-left text-[12px] font-semibold ${adv ? "border-[var(--green-text)] bg-tint text-green-text" : "border-line-strong bg-white text-muted hover:text-ink"}`}>
                {adv ? "Hide" : "Show"} advanced options
                <span className="hidden font-normal text-muted sm:inline">(fee refunds, price bands, damaged stock, GST rates)</span>
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-line bg-soft/70 p-3">
            <div className="mb-2 flex items-center justify-between text-[12.5px] font-semibold">
              <span>{doneCount === steps.length ? "All set: see your result" : `${doneCount} of ${steps.length} sections done`}</span>
              <span className="text-muted">{`${Math.round((doneCount / steps.length) * 100)}%`}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div className="progress-bar h-full rounded-full transition-[width] duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {steps.map((st, i) => (
                <a key={st.id} href={`#${st.id}`} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 ${st.done ? "border-transparent bg-tint text-green-text" : "border-line-strong bg-white text-ink2"}`}>
                  <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] text-white ${st.done ? "bg-[var(--green-500)]" : "bg-ink"}`}>{st.done ? "✓" : i + 1}</span>
                  {st.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            <button type="button" className="font-semibold text-green-text underline" onClick={onExample}>
              Try with example numbers
            </button>
            <button type="button" className="text-muted underline" onClick={onReset}>
              Reset
            </button>
            <span className="text-muted">Nothing you type leaves your browser.</span>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-2">
      <SectionCard id="sec-product" step={1} title="Product and price" subtitle="What you sell it for and what it costs you" icon={Tag} color="#3b82f6" done={doneProduct} delay={0}>
        <Field label="Selling price (₹)" htmlFor="price" hint="What the customer pays, including GST, after any seller discount." error={invalidReason(inputs.sellingPrice)}>
          <NumberInput id="price" value={form.price} prefix="₹" onChange={(price) => patch({ price })} invalid={Boolean(invalidReason(inputs.sellingPrice))} />
        </Field>
        <RawField
          id="cost"
          label="Product cost per unit (₹)"
          hint="What you pay for one unit, as paid including GST."
          raw={form.cost}
          onChange={(cost) => patch({ cost })}
          prefix="₹"
          error={invalidReason(inputs.productCost)}
        />
        {registered ? (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[13.5px] font-semibold">Product GST rate</span>
            <Pills
              label="Product GST rate"
              value={form.gstChoice}
              onChange={(gstChoice) => patch({ gstChoice })}
              options={[
                { value: "0", label: "0%" },
                { value: "5", label: "5%" },
                { value: "18", label: "18%" },
                { value: "40", label: "40%" },
                { value: "custom", label: "Other" },
              ]}
            />
            {form.gstChoice === "custom" ? (
              <div className="max-w-[200px]">
                <NumberInput id="gst-custom" value={form.gstCustom} suffix="%" onChange={(gstCustom) => patch({ gstCustom })} />
              </div>
            ) : null}
            {invalidReason(inputs.gstRateBps) ? <p className="text-[12.5px] font-medium text-loss">{invalidReason(inputs.gstRateBps)}</p> : null}
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-[13.5px] font-semibold">Your GST status</span>
          <ChoiceCards
            label="Your GST status"
            value={form.gstStatus}
            onChange={(v) => patch({ gstStatus: v })}
            options={[
              { value: "registered_itc", title: "Registered + ITC", desc: "GST is not income; GST you pay is recovered." },
              { value: "registered_no_itc", title: "Registered, no ITC", desc: "GST is not income; GST you pay is a cost." },
              { value: "unregistered", title: "Not registered", desc: "No GST collected; GST you pay is a cost." },
            ]}
          />
        </div>
        {form.marketplace === "amazon" ? (
          <Field label="Amazon fulfilment method" htmlFor="fulfilment">
            <Select
              id="fulfilment"
              value={form.amazonFulfilment}
              onChange={(v) => patch({ amazonFulfilment: v as AmazonFulfilment })}
              options={(Object.keys(AMAZON_FULFILMENT_LABEL) as AmazonFulfilment[]).map((k) => ({ value: k, label: AMAZON_FULFILMENT_LABEL[k] }))}
            />
          </Field>
        ) : null}
      </SectionCard>

      <SectionCard id="sec-fees" step={2} title={`${MARKETPLACE_LABEL[form.marketplace]} fees`} subtitle="From your seller dashboard or settlement report, excluding GST. We never assume a rate." icon={Store} color="#f59e0b" done={doneFees} delay={1}>
        {fields.map((def) => (
          <FeeEditor key={def.id} def={def} form={form} inputs={inputs} patch={patch} detailed={detailed && adv} />
        ))}
      </SectionCard>

      <SectionCard id="sec-orders" step={3} title="Orders and returns" subtitle="How many orders come back, and what you recover" icon={Repeat2} color="#ec4899" done={doneOrders} delay={2} wide={!detailed}>
        <Field label="Orders per month" htmlFor="orders" hint="Needed for monthly totals and overheads." optional error={invalidReason(inputs.monthlyOrders)}>
          <NumberInput id="orders" value={form.orders} onChange={(orders) => patch({ orders })} invalid={Boolean(invalidReason(inputs.monthlyOrders))} />
        </Field>
        <div className="hidden sm:block" />
        <RawField id="rto" label="RTO rate (%)" hint="Orders that never reach the customer." raw={form.rto} onChange={(rto) => patch({ rto })} suffix="%" error={invalidReason(inputs.rtoBps)} />
        <RawField id="ret" label="Customer return rate (%)" hint="Delivered orders sent back." raw={form.ret} onChange={(ret) => patch({ ret })} suffix="%" error={invalidReason(inputs.returnBps)} />
        {detailed ? (
          <>
            <Field label="RTO units you can resell (%)" htmlFor="rto-sell" optional hint="Left empty we assume 80% and flag it.">
              <NumberInput id="rto-sell" value={form.rtoSellable} suffix="%" onChange={(rtoSellable) => patch({ rtoSellable })} />
            </Field>
            <Field label="Returned units you can resell (%)" htmlFor="ret-sell" optional hint="Left empty we assume 80% and flag it.">
              <NumberInput id="ret-sell" value={form.retSellable} suffix="%" onChange={(retSellable) => patch({ retSellable })} />
            </Field>
            {adv ? (
              <>
                <Field label="RTO units damaged (%)" htmlFor="rto-dmg" optional hint="The rest of RTO units are treated as lost.">
                  <NumberInput id="rto-dmg" value={form.rtoDamaged} suffix="%" onChange={(rtoDamaged) => patch({ rtoDamaged })} />
                </Field>
                <Field label="Returned units damaged (%)" htmlFor="ret-dmg" optional hint="The rest of returned units are treated as lost.">
                  <NumberInput id="ret-dmg" value={form.retDamaged} suffix="%" onChange={(retDamaged) => patch({ retDamaged })} />
                </Field>
                <Field label="Resale value of damaged units (% of cost)" htmlFor="salvage" optional hint="Empty means damaged units are worth nothing.">
                  <NumberInput id="salvage" value={form.salvage} suffix="%" onChange={(salvage) => patch({ salvage })} />
                </Field>
              </>
            ) : null}
          </>
        ) : null}
      </SectionCard>

      {detailed ? (
        <SectionCard id="sec-extras" step={4} title="Packaging, ads and overheads" subtitle="Costs beyond the product and marketplace" icon={Megaphone} color="#8b5cf6" done={doneExtras} delay={3}>
          <RawField id="packaging" label="Packaging per order (₹)" hint="As paid, including GST. Lost on returns and RTO." raw={form.packaging} onChange={(packaging) => patch({ packaging })} prefix="₹" error={invalidReason(inputs.packagingCost)} />
          <RawField id="ads" label="Advertising per month (₹)" hint="Total ad spend as paid, including GST." raw={form.ads} onChange={(ads) => patch({ ads })} prefix="₹" error={invalidReason(inputs.adSpend)} />
          <Field label="Sales your ads drove per month (₹)" htmlFor="adrev" optional hint="For ACOS and ROAS. Including GST." error={invalidReason(inputs.adRevenue)}>
            <NumberInput id="adrev" value={form.adRevenue} prefix="₹" onChange={(adRevenue) => patch({ adRevenue })} />
          </Field>
          <RawField id="opex" label="Operating expenses per month (₹)" hint="Salaries, rent, software, as incurred. Needed for operating profit." raw={form.opex} onChange={(opex) => patch({ opex })} prefix="₹" error={invalidReason(inputs.operatingExpenses)} />
          {adv ? (
            <>
              {registered ? (
                <Field label="GST rate on your purchases" htmlFor="purchase-gst" optional hint="Empty means the same as the product GST rate." error={invalidReason(inputs.purchaseGstRateBps)}>
                  <NumberInput id="purchase-gst" value={form.purchaseGst} suffix="%" onChange={(purchaseGst) => patch({ purchaseGst })} />
                </Field>
              ) : null}
              <Field label="GST rate on fees, packaging and ads" htmlFor="services-gst" optional hint="Empty means 18%." error={invalidReason(inputs.servicesGstRateBps)}>
                <NumberInput id="services-gst" value={form.servicesGst} suffix="%" onChange={(servicesGst) => patch({ servicesGst })} />
              </Field>
            </>
          ) : null}
        </SectionCard>
      ) : null}
      </div>
    </div>
  );
}

export { exampleForm };

/** Orders section counts as done once both rates are entered or confirmed not applicable. */
function ratesAnswered(f: FormState): boolean {
  const entered = (r: { text: string; na: boolean }) => r.na || r.text.trim() !== "";
  return entered(f.rto) && entered(f.ret);
}
