"use client";

import { LazyMotion, domAnimation, m, useScroll, useSpring, useTransform } from "motion/react";

/** Stacked 1px shadows give a solid-looking extrusion without WebGL. */
const extrude = (depth: number, color: string) =>
  Array.from({ length: depth }, (_, i) => `${i + 1}px ${i + 1}px 0 ${color}`).join(",");

function Tile({ x, y, w, h, top, side, depth }: { x: number; y: number; w: number; h: number; top: string; side: string; depth: number }) {
  return (
    <div
      className="absolute rounded-md"
      style={{ left: x, top: y, width: w, height: h, background: top, boxShadow: `${extrude(depth, side)}, 0 0 0 1px rgba(255,255,255,0.4) inset` }}
    />
  );
}

const BARS = [38, 62, 48, 80, 66, 94, 76];

function Island({ size = 1 }: { size?: number }) {
  return (
    <svg viewBox="0 0 160 190" width={150 * size} height={178 * size}>
      <defs>
        <linearGradient id="isl-top" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#c0ec7b" />
          <stop offset="100%" stopColor="#31ac2f" />
        </linearGradient>
      </defs>
      <polygon points="80,46 150,70 150,96 80,122 10,96 10,70" fill="url(#isl-top)" stroke="#1b7a28" strokeWidth="1.5" />
      <polygon points="80,46 150,70 80,92 10,70" fill="#9bde43" opacity="0.85" />
      <polygon points="10,96 80,122 150,96 80,184" fill="#0a0a0a" />
      <polyline points="10,96 80,184 150,96 80,122 10,96" fill="none" stroke="#53bb3e" strokeWidth="1.4" />
      <line x1="80" y1="122" x2="80" y2="184" stroke="#53bb3e" strokeWidth="1.2" />
      <rect x="40" y="52" width="10" height="22" rx="2" fill="#1b7a28" />
      <circle cx="45" cy="44" r="14" fill="#53bb3e" />
      <rect x="108" y="58" width="8" height="16" rx="2" fill="#1b7a28" />
      <circle cx="112" cy="52" r="10" fill="#9bde43" />
    </svg>
  );
}

function ChartPanel({ id }: { id: string }) {
  return (
    <div className="chart-panel">
      <svg viewBox="0 0 320 160" className="h-full w-full">
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#53bb3e" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#9bde43" stopOpacity="0" />
          </linearGradient>
          <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {BARS.map((h, i) => (
          <rect key={i} className="bar" x={14 + i * 44} y={150 - h} width="26" height={h} rx="4" fill="#e3efd9" style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
        <path id={`${id}-line`} d="M0,120 L30,104 L55,112 L85,86 L115,92 L145,64 L175,72 L205,40 L235,52 L265,24 L295,34 L320,14" fill="none" stroke="#31ac2f" strokeWidth="3" filter={`url(#${id}-glow)`} />
        <path d="M0,120 L30,104 L55,112 L85,86 L115,92 L145,64 L175,72 L205,40 L235,52 L265,24 L295,34 L320,14 L320,160 L0,160 Z" fill={`url(#${id}-fill)`} />
        <circle r="6" fill="#fff" stroke="#31ac2f" strokeWidth="3">
          <animateMotion dur="7s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear">
            <mpath href={`#${id}-line`} />
          </animateMotion>
        </circle>
      </svg>
      <span className="chart-tag">Profit trend</span>
    </div>
  );
}

/**
 * Live "floating dashboard" scenes in Metrion colours (CSS 3D + SVG). Scene A drifts from the
 * right of the page to the left as you scroll; scene B sweeps in from the right later, so
 * neither side of the page is ever plain. Decorative only: numbers are illustration, the
 * scene is hidden from assistive tech, and everything stops for reduced-motion visitors.
 */
export function Scene3D() {
  const { scrollYProgress, scrollY } = useScroll();
  const smooth = useSpring(scrollY, { stiffness: 80, damping: 24, mass: 0.5 });

  // Scene A: travels right -> left, tilting as it goes
  const ax = useTransform(smooth, [0, 900, 2600, 4200], [0, -60, -520, -700]);
  const ay = useTransform(smooth, [0, 4200], [0, -260]);
  const aRotZ = useTransform(smooth, [0, 4200], [0, -16]);
  const aRotY = useTransform(smooth, [0, 2600, 4200], [0, 14, 26]);
  const aFade = useTransform(smooth, [0, 700, 4200], [1, 0.8, 0.55]);
  const farY = useTransform(smooth, [0, 4200], [0, -90]);
  const midY = useTransform(smooth, [0, 4200], [0, -240]);
  const nearY = useTransform(smooth, [0, 4200], [0, -520]);
  const coinRot = useTransform(scrollYProgress, [0, 1], [0, 1080]);

  // Scene B: enters from the right in the middle of the page
  const bx = useTransform(smooth, [900, 2600], [520, 0]);
  const by = useTransform(smooth, [900, 4200], [200, -160]);
  const bFade = useTransform(smooth, [900, 1800, 4200], [0, 0.85, 0.7]);
  const bRot = useTransform(smooth, [900, 4200], [12, -8]);

  return (
    <LazyMotion features={domAnimation}>
      <div aria-hidden className="scene-wrap">
        <m.div className="scene" style={{ x: ax, y: ay, rotateZ: aRotZ, rotateY: aRotY, opacity: aFade, scale: 1.18 }}>
          <m.div className="absolute inset-0" style={{ y: farY }}>
            <div className="iso-stage">
              <div className="iso-floor" />
              <Tile x={70} y={80} w={120} h={90} top="#cfe8c4" side="#a9d39a" depth={10} />
              <Tile x={200} y={60} w={100} h={130} top="#53bb3e" side="#2f8a2a" depth={22} />
              <Tile x={310} y={110} w={140} h={80} top="#e5ece1" side="#c3cfbd" depth={8} />
              <Tile x={120} y={200} w={150} h={110} top="#9bde43" side="#5fa52b" depth={16} />
              <Tile x={290} y={210} w={110} h={100} top="#334155" side="#1e293b" depth={26} />
              <Tile x={410} y={190} w={90} h={120} top="#dbe7f5" side="#aebfd6" depth={12} />
            </div>
          </m.div>

          <m.div className="absolute left-[14%] top-[46%] w-[58%]" style={{ y: midY }}>
            <ChartPanel id="sa" />
          </m.div>

          <m.div className="absolute inset-0" style={{ y: nearY }}>
            <div className="float-card floaty-a" style={{ right: "2%", top: "6%" }}>
              <span className="text-[11px] font-semibold text-muted">Profit per order</span>
              <span className="text-[26px] font-extrabold leading-none">₹ ● ● ●</span>
              <span className="mt-1 inline-flex w-fit rounded-full bg-tint px-2 py-0.5 text-[11px] font-bold text-green-text">Illustration</span>
            </div>
            <div className="float-card floaty-b" style={{ left: "22%", top: "2%", padding: 10 }}>
              <svg viewBox="0 0 42 42" width="82" height="82" className="-rotate-90">
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="#eef3ea" strokeWidth="7" />
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="#334155" strokeWidth="7" strokeDasharray="38 62" />
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="7" strokeDasharray="14 86" strokeDashoffset="-38" />
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="7" strokeDasharray="8 92" strokeDashoffset="-52" />
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="#53bb3e" strokeWidth="7" strokeDasharray="39 61" strokeDashoffset="-60" />
              </svg>
            </div>
            <div className="orbit" style={{ right: "26%", top: "26%" }}>
              <m.div className="coin" style={{ rotateY: coinRot }}>₹</m.div>
              <span className="orbit-dot" />
            </div>
            <div className="island floaty-c" style={{ right: "3%", top: "46%" }}>
              <Island />
            </div>
            <span className="pill-3d floaty-b" style={{ left: "24%", top: "78%" }}>GST ✓</span>
            <span className="pill-3d floaty-c" style={{ left: "55%", top: "8%" }}>RTO</span>
            <span className="pill-3d floaty-a" style={{ right: "12%", top: "80%" }}>ITC</span>
          </m.div>
        </m.div>

        <m.div className="scene scene-b" style={{ x: bx, y: by, rotateZ: bRot, opacity: bFade }}>
          <div className="absolute left-[8%] top-[14%] w-[78%]">
            <ChartPanel id="sb" />
          </div>
          <div className="island floaty-a" style={{ left: "0%", top: "52%" }}>
            <Island size={0.8} />
          </div>
          <div className="float-card floaty-b" style={{ right: "4%", top: "2%" }}>
            <span className="text-[11px] font-semibold text-muted">Break-even</span>
            <span className="text-[22px] font-extrabold leading-none">₹ ● ● ●</span>
          </div>
          <span className="pill-3d floaty-c" style={{ right: "10%", top: "70%" }}>Find My Price</span>
          <span className="pill-3d floaty-a" style={{ left: "48%", top: "88%" }}>What-if</span>
        </m.div>
      </div>
    </LazyMotion>
  );
}
