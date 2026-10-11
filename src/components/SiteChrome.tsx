import Image from "next/image";
import { SITE } from "@/lib/site";

/** Brand lockup on black: the supplied logo, cropped to mark + wordmark. mix-blend lighten hides JPEG noise on black. */
export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <Image src="/metrion-logo-mark.jpg" alt="" width={56} height={41} priority className="h-10 w-auto mix-blend-lighten" />
      <Image src="/metrion-logo-wordmark.jpg" alt="Metrion" width={150} height={24} priority className="h-6 w-auto mix-blend-lighten" />
    </span>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black">
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <a href="#top" aria-label="Metrion free profit and loss calculator, back to top">
          <Logo />
        </a>
        <nav aria-label="Page sections" className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex">
          <a href="#calculator" className="hover:text-white">Calculator</a>
          <a href="#how-it-works" className="hover:text-white">How it works</a>
          <a href="#marketplaces" className="hover:text-white">Marketplaces</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </nav>
        <a href={SITE.metrionUrl} className="btn !min-h-10 !px-4 !text-sm text-ink" style={{ background: "var(--green-grad)" }} rel="noopener">
          Try Metrion
        </a>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 bg-black text-white">
      <div className="wrap grid gap-8 py-12 md:grid-cols-[1.2fr_1fr]">
        <div>
          <Image src="/metrion-logo.jpg" alt="Metrion, the engine of growth" width={781} height={500} className="h-auto w-56 mix-blend-lighten" />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            A free profit and loss calculator for Amazon, Flipkart and Meesho sellers in India. No signup. Your numbers stay in your browser.
          </p>
        </div>
        <div className="text-[13px] leading-relaxed text-white/60">
          <p>
            Results are estimates based on the numbers you enter, not marketplace settlements or tax advice. Fees, reversals and GST treatment can differ. Check your settlement reports and confirm GST with a chartered accountant.
          </p>
          <p className="mt-3">
            Privacy: this page runs entirely in your browser. We do not store or send what you type, and we do not use tracking cookies.
          </p>
          <p className="mt-3">Last updated {SITE.updated}. &copy; Metrion.</p>
        </div>
      </div>
    </footer>
  );
}
