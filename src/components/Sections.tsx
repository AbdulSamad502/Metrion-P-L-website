import { FAQS } from "@/content/faq";
import { GLOSSARY } from "@/content/glossary";
import { MARKETPLACE_GUIDES } from "@/content/marketplaces";
import { HOME_SEO } from "@/content/seo";
import { SITE } from "@/lib/site";
import { BarChart3, Calculator, Lock, Receipt, ShieldCheck, Target, TrendingUp, Undo2 } from "lucide-react";
import { Reveal } from "./Reveal";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-line">
      <div className="wrap relative py-14 sm:py-20 lg:py-28">
        <div>
          <p className="chip enter mb-4">
            <span aria-hidden className="pulse-dot h-2 w-2 rounded-full" style={{ background: "var(--green-grad)" }} />
            Free &middot; No signup &middot; Built for Indian sellers
          </p>
          <h1 className="enter d1 max-w-2xl text-[clamp(2rem,4.6vw,3.5rem)] font-extrabold leading-[1.07] tracking-tight">
            {HOME_SEO.h1.replace("sellers", "")}
            <span className="shine-text">sellers</span>
          </h1>
          <p className="enter d2 mt-4 max-w-xl text-[17px] leading-relaxed text-ink2">
            Find out what you really earn on every order after marketplace fees, GST, RTO and returns. Enter a few numbers, see where each rupee goes, and get your break-even price.
          </p>
          <div className="enter d3 mt-6 flex flex-wrap items-center gap-3">
            <a href="#calculator" className="btn btn-shine">Calculate my profit</a>
            <a href="#how-it-works" className="btn btn-ghost">How it works</a>
          </div>
          <dl className="enter d4 mt-8 grid max-w-xl grid-cols-3 gap-3">
            {[
              ["3", "Marketplaces", "var(--c-amber)"],
              ["~1 min", "To a result", "var(--c-blue)"],
              ["₹0", "Always free", "var(--green-500)"],
            ].map(([v, l, c]) => (
              <div key={l} className="rounded-xl border border-line bg-white/80 p-3" style={{ borderTop: `3px solid ${c}` }}>
                <dt className="text-[12px] text-muted">{l}</dt>
                <dd className="text-xl font-extrabold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function Features() {
  const items = [
    { icon: Receipt, t: "GST done right", d: "Revenue excludes GST; ITC shown as recovered, or as a cost if you do not claim it.", c: "var(--c-amber)" },
    { icon: Undo2, t: "RTO and returns", d: "Return losses, reverse shipping, refunded fees and recovered stock, spread across kept orders.", c: "var(--c-rose)" },
    { icon: Target, t: "Break-even price", d: "Solved exactly for your fee setup, including price bands where fees jump.", c: "var(--c-blue)" },
    { icon: TrendingUp, t: "Find My Price", d: "Type the margin you want and get the lowest price that delivers it.", c: "var(--green-500)" },
    { icon: BarChart3, t: "See every rupee", d: "A chart and line-by-line explanation of where each sale goes.", c: "var(--c-violet)" },
    { icon: ShieldCheck, t: "Honest by design", d: "Missing inputs are never treated as zero. Results say exactly what is excluded.", c: "var(--c-teal)" },
    { icon: Calculator, t: "Exact arithmetic", d: "Whole paise and exact fractions. Every line adds up to the total.", c: "var(--c-orange)" },
    { icon: Lock, t: "Private", d: "Everything runs in your browser. Nothing you type is sent or stored.", c: "var(--c-slate)" },
  ];
  return (
    <Reveal>
      <section className="wrap py-14" aria-labelledby="features-title">
        <h2 id="features-title" className="text-center text-[clamp(1.5rem,2.6vw,2.2rem)] font-extrabold tracking-tight">
          <span className="uline">Built so the number you see is the number you can trust</span>
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, t, d, c }, i) => (
            <Reveal key={t} delay={(i % 4) * 90} variant="zoom" className="h-full">
            <div className="card card-hover h-full p-5">
              <span className="icon-pop grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: c }}>
                <Icon size={22} aria-hidden />
              </span>
              <h3 className="mt-3 text-[16px] font-bold">{t}</h3>
              <p className="mt-1 text-[14px] leading-relaxed text-muted">{d}</p>
            </div>
            </Reveal>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

export function HowItWorks() {
  const steps = [
    { n: "1", t: "Enter your price and costs", d: "Pick your marketplace, then type the selling price, product cost and the fees from your seller dashboard. Quick estimate needs about ten fields." },
    { n: "2", t: "Add returns and RTO", d: "Tell us how many orders come back and how much stock you recover. Those losses are spread across the orders you keep." },
    { n: "3", t: "See profit, break-even and what-ifs", d: "Get profit per order and per month, your break-even price, the price for a margin you want, and your biggest cost drains." },
  ];
  return (
    <Reveal>
      <section id="how-it-works" className="wrap prose-seo py-16" aria-labelledby="how-title">
        <h2 id="how-title"><span className="uline">How the profit calculator works</span></h2>
        <p>
          The calculator follows the same order a seller&rsquo;s money takes: the customer pays, GST is set aside, the marketplace takes its charges, and what is left has to cover your product, packaging, advertising and the orders that never turn into sales.
        </p>
        <ol className="mt-6 grid gap-4 !list-none !pl-0 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="card card-hover p-5" data-step={s.n} style={{ borderTop: `4px solid ${["var(--c-blue)", "var(--c-rose)", "var(--green-500)"][Number(s.n) - 1]}` }}>
              <span className="grid h-8 w-8 place-items-center rounded-full text-sm font-bold text-white" style={{ background: ["var(--c-blue)", "var(--c-rose)", "var(--green-600)"][Number(s.n) - 1] }}>{s.n}</span>
              <h3 className="!mt-3">{s.t}</h3>
              <p className="!mt-1.5 text-[15px]">{s.d}</p>
            </li>
          ))}
        </ol>

        <h3 id="formula">The profit formula, in plain words</h3>
        <ul>
          <li><strong>Revenue</strong> = selling price &divide; (1 + GST rate) for GST-registered sellers. GST collected is not your income.</li>
          <li><strong>Contribution profit</strong> = revenue &minus; product cost &minus; marketplace fees &minus; shipping &minus; packaging &minus; advertising &minus; losses on RTO and returns.</li>
          <li><strong>Operating profit</strong> = contribution profit &minus; monthly operating expenses such as salaries, rent and software.</li>
          <li><strong>Delivered-and-kept orders</strong> = orders placed &minus; RTO &minus; customer returns. Every per-order figure is for these orders, with the cost of the others included.</li>
        </ul>
        <p>
          All arithmetic uses whole paise and exact fractions, so there is no floating-point rounding error, and every line you see adds up to the total.
        </p>

        <h3>RTO vs customer returns</h3>
        <p>
          An RTO order never reaches the buyer; a return is delivered and then sent back. Both earn nothing, but each can still cost forward shipping, return shipping, packaging and damaged or lost stock. Entering them separately shows which one is hurting you.
        </p>
      </section>
    </Reveal>
  );
}

export function MarketplaceGuides() {
  const guides = Object.values(MARKETPLACE_GUIDES);
  return (
    <Reveal>
      <section id="marketplaces" className="border-y border-line bg-soft/70 py-16" aria-labelledby="mp-title">
        <div className="wrap prose-seo">
          <h2 id="mp-title"><span className="uline">Profit calculator for Amazon, Flipkart and Meesho</span></h2>
          <p>Each marketplace charges differently, so the fee fields change with the tab you choose. We never assume a rate: you enter what your own account shows.</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {guides.map((g, gi) => (
              <Reveal key={g.id} delay={gi * 120} variant={gi === 0 ? "left" : gi === 2 ? "right" : "up"} className="h-full">
              <article className="card card-hover h-full p-5" style={{ borderTop: `4px solid ${g.id === "amazon" ? "var(--c-amber)" : g.id === "flipkart" ? "var(--c-blue)" : "var(--c-rose)"}` }}>
                <h3 className="!mt-0">{g.heading}</h3>
                {g.paragraphs.map((p) => (
                  <p key={p} className="text-[15px]">{p}</p>
                ))}
                <p className="mt-3 text-sm font-semibold">Have these ready</p>
                <ul className="text-[15px]">
                  {g.checklist.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

export function GstExplainer() {
  return (
    <Reveal>
      <section id="gst" className="wrap prose-seo py-16" aria-labelledby="gst-title">
        <h2 id="gst-title"><span className="uline">GST, ITC and your real profit</span></h2>
        <p>
          GST changes your profit more than most sellers expect. Choose the status that matches you and the calculator treats it correctly:
        </p>
        <ul>
          <li><strong>GST-registered, claiming ITC:</strong> revenue excludes GST, and the GST you pay on product cost, packaging, ads and marketplace charges is shown as recovered.</li>
          <li><strong>GST-registered, not claiming ITC:</strong> revenue excludes GST, but the GST on your costs and fees is a real cost.</li>
          <li><strong>Not registered:</strong> you collect no GST, so revenue is the full price, and GST on costs and fees is a real cost.</li>
        </ul>
        <p>
          The calculator takes a careful approach to stock you lose through returns and RTO: it does not assume you can claim credit on goods written off. Whether that applies to your business is a question for your chartered accountant. Composition-scheme sellers are not supported yet.
        </p>
        <p>
          TCS and TDS that marketplaces deduct affect your cash received, not your profit, so they are not included here.
        </p>
      </section>
    </Reveal>
  );
}

export function MetrionBridge() {
  return (
    <Reveal variant="zoom">
      <section className="wrap py-4" aria-labelledby="bridge-title">
        <div className="overflow-hidden rounded-3xl bg-ink p-8 text-white sm:p-12">
          <div aria-hidden className="mb-4 h-1 w-16 rounded-full" style={{ background: "var(--green-grad)" }} />
          <h2 id="bridge-title" className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            An estimate is a start. Metrion shows what you actually earn.
          </h2>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-white/75">
            This calculator works from the numbers you type. Metrion is built to work from your real marketplace reports, so you can see true profit, spot leaks and decide what to do next.
          </p>
          <a href={SITE.metrionUrl} className="btn mt-6 text-ink" style={{ background: "var(--green-grad)" }} rel="noopener">
            Learn about Metrion
          </a>
        </div>
      </section>
    </Reveal>
  );
}

export function Faq() {
  return (
    <Reveal>
      <section id="faq" className="wrap prose-seo py-16" aria-labelledby="faq-title">
        <h2 id="faq-title"><span className="uline">Frequently asked questions</span></h2>
        <div className="mt-6 divide-y divide-line rounded-2xl border border-line">
          {FAQS.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex items-center justify-between gap-4 px-5 py-4 text-[16px] font-semibold hover:bg-soft">
                {f.q}
                <span aria-hidden className="text-xl text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="!mt-0 px-5 pb-5">{f.a}</p>
            </details>
          ))}
        </div>

        <h2 id="glossary" className="!mt-14">Seller profit glossary</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2">
          {GLOSSARY.map((g) => (
            <div key={g.term}>
              <dt className="font-semibold">{g.term}</dt>
              <dd className="mt-0.5 text-[15px] leading-relaxed text-ink2">{g.def}</dd>
            </div>
          ))}
        </dl>
      </section>
    </Reveal>
  );
}
