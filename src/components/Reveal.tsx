"use client";

import { useEffect, useRef } from "react";

type Variant = "up" | "left" | "right" | "zoom";

const FROM: Record<Variant, string> = {
  up: "translateY(28px)",
  left: "translateX(-36px)",
  right: "translateX(36px)",
  zoom: "scale(0.94) translateY(12px)",
};

/**
 * Scroll-triggered entrance. Content is fully visible without JavaScript; the hidden
 * starting state is only applied after hydration, never for elements already on screen,
 * and never when the visitor prefers reduced motion.
 */
export function Reveal({
  children,
  className = "",
  variant = "up",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  /** Milliseconds, for staggering siblings. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      el.dataset.in = "1";
      return;
    }
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
      el.dataset.in = "1"; // already visible
      return;
    }
    el.style.opacity = "0";
    el.style.transform = FROM[variant];
    el.style.transition = `opacity 0.7s ease-out ${delay}ms, transform 0.7s cubic-bezier(0.2,0.7,0.2,1) ${delay}ms`;
    el.style.willChange = "opacity, transform";
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.style.opacity = "1";
          el.style.transform = "none";
          el.dataset.in = "1";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [variant, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
