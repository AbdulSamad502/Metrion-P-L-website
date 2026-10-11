"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Entry } from "@/engine/types";

export const invalidReason = (e: Entry<unknown>): string | undefined => (e.state === "invalid" ? e.reason : undefined);

export function Field({
  label,
  hint,
  error,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | undefined;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-[13.5px] font-semibold text-ink">
        <span>{label}</span>
        {optional ? <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Optional</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[12.5px] font-medium text-loss" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12.5px] leading-snug text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function NumberInput({
  id,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  invalid,
  disabled,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
}) {
  const filled = value.trim() !== "" && !invalid;
  return (
    <div className="inp" data-invalid={invalid ? "true" : undefined} data-disabled={disabled ? "true" : undefined}>
      {prefix ? <span className="inp-addon">{prefix}</span> : null}
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
      />
      {filled ? <Check size={16} aria-hidden className="tick-pop mr-2 shrink-0 text-green-text" /> : null}
      {suffix ? <span className="inp-addon inp-addon-r">{suffix}</span> : null}
    </div>
  );
}

/** Pill button that confirms "this cost is zero / does not apply". */
export function NaToggle({
  checked,
  onChange,
  label = "Doesn't apply (₹0)",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors ${
        checked ? "border-[var(--green-text)] bg-tint text-green-text" : "border-line-strong bg-white text-muted hover:border-ink hover:text-ink"
      }`}
    >
      <span aria-hidden className={`grid h-3.5 w-3.5 place-items-center rounded-full border ${checked ? "border-[var(--green-text)] bg-[var(--green-text)] text-white" : "border-line-strong"}`}>
        {checked ? <Check size={10} strokeWidth={3} /> : null}
      </span>
      {label}
    </button>
  );
}

export function Select({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Row of tap-friendly choice pills (single select). */
export function Pills<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition-all ${
              on ? "border-ink bg-ink text-white shadow-md" : "border-line-strong bg-white text-ink2 hover:-translate-y-0.5 hover:border-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Radio cards with a title and one-line description. */
export function ChoiceCards<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; title: string; desc: string }>;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2 sm:grid-cols-3">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`rounded-xl border p-3 text-left transition-all ${
              on ? "border-[var(--green-text)] bg-tint shadow-sm ring-2 ring-[rgba(83,187,62,0.35)]" : "border-line-strong bg-white hover:-translate-y-0.5 hover:border-ink"
            }`}
          >
            <span className="flex items-center justify-between text-[13.5px] font-bold">
              {o.title}
              {on ? <Check size={16} className="text-green-text" aria-hidden /> : null}
            </span>
            <span className="mt-0.5 block text-[12px] leading-snug text-muted">{o.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  label: string;
}) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const width = `calc((100% - 8px) / ${options.length})`;
  return (
    <div role="radiogroup" aria-label={label} className="relative flex rounded-full border border-line bg-soft p-1">
      <span
        aria-hidden
        className="absolute bottom-1 top-1 rounded-full bg-ink shadow transition-transform duration-300 ease-out"
        style={{ width, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`relative z-10 min-h-10 flex-1 rounded-full px-3 text-sm font-semibold transition-colors duration-300 ${
            o.value === value ? "text-white" : "text-ink2 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A collapsible form section card with a coloured icon, step number and a completion tick. */
export function SectionCard({
  id,
  step,
  title,
  subtitle,
  icon: Icon,
  color,
  done,
  delay = 0,
  wide = false,
  children,
}: {
  id: string;
  step: number;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  done: boolean;
  delay?: number;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section
      id={id}
      className={`enter card-hover scroll-mt-28 overflow-hidden rounded-2xl border border-line bg-white/85 backdrop-blur ${wide ? "xl:col-span-2" : ""}`}
      style={{ animationDelay: `${0.1 + delay * 0.12}s` }}
      aria-labelledby={`${id}-t`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`${id}-body`}
        className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left"
        style={{ background: `linear-gradient(90deg, ${color}1f, transparent 75%)` }}
      >
        <span className="icon-pop grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-md" style={{ background: color }}>
          <Icon size={19} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span id={`${id}-t`} className="block text-[16px] font-bold leading-tight tracking-tight">
            <span className="text-muted">{step}. </span>
            {title}
          </span>
          {subtitle ? <span className="block text-[12.5px] leading-snug text-muted">{subtitle}</span> : null}
        </span>
        <span
          key={String(done)}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-white ${done ? "tick-pop border-transparent bg-[var(--green-500)]" : "border-line-strong bg-white"}`}
          aria-label={done ? "Section complete" : "Section not complete yet"}
        >
          {done ? <Check size={14} strokeWidth={3} /> : null}
        </span>
        <ChevronDown size={18} aria-hidden className={`shrink-0 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div id={`${id}-body`} className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden" {...(open ? {} : { inert: true })}>
          <div className={`grid gap-4 p-4 sm:p-5 ${wide ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-1 xl:[&>*]:col-span-1"}`}>{children}</div>
        </div>
      </div>
    </section>
  );
}
