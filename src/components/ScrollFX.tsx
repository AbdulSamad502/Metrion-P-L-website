"use client";

import { LazyMotion, domAnimation, m, useScroll, useSpring } from "motion/react";

/** Thin brand-gradient bar showing how far down the page you are. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.3 });
  return (
    <LazyMotion features={domAnimation}>
      <m.div className="scroll-progress" style={{ scaleX }} aria-hidden />
    </LazyMotion>
  );
}

/** Fixed background whose glows drift at different speeds as you scroll (parallax). */
export function ParallaxBackground() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="fx-layer" aria-hidden>
        <span className="fx-streak s1" />
        <span className="fx-streak s2" />
        <span className="fx-streak s3" />
      </div>
    </LazyMotion>
  );
}
