"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function BeforeAfter({
  before,
  after,
  alt = "Property transformation",
  className,
  initial = 0.55,
}: {
  before: string;
  after: string;
  alt?: string;
  className?: string;
  initial?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    function measure() {
      if (ref.current) {
        const w = ref.current.getBoundingClientRect().width;
        setWidth(w);
        x.set(w * initial);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [initial, x]);

  // Auto-sweep on mount (once) so users see the effect.
  useEffect(() => {
    if (reduce || width === 0) return;
    let raf = 0;
    const start = performance.now();
    const from = width * initial;
    const to = width * 0.45;
    const peak = width * 0.85;
    const dur = 2400;
    function tick(t: number) {
      const p = Math.min(1, (t - start) / dur);
      // ease-in-out, sweep right then settle left
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const v = p < 0.5
        ? from + (peak - from) * eased
        : peak - (peak - to) * (eased - 0) / 1;
      x.set(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width, initial, reduce, x]);

  const clipPath = useTransform(x, (v) => `inset(0 ${Math.max(0, width - v)}px 0 0)`);
  const handleX = useTransform(x, (v) => v);

  function onPointer(e: React.PointerEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const v = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    x.set(v);
  }

  return (
    <div
      ref={ref}
      className={`relative w-full overflow-hidden rounded-3xl bg-paper select-none ${className ?? ""}`}
      onPointerDown={(e) => {
        setDragging(true);
        (e.target as Element).setPointerCapture?.(e.pointerId);
        onPointer(e);
      }}
      onPointerMove={(e) => dragging && onPointer(e)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={`${alt} — after`} className="block h-full w-full object-cover" draggable={false} />
      <motion.div className="absolute inset-0" style={{ clipPath }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt={`${alt} — before`} className="block h-full w-full object-cover" draggable={false} />
      </motion.div>

      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-ink/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory backdrop-blur-sm">
        Before
      </span>
      <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-emerald px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory backdrop-blur-sm">
        After · AI
      </span>

      <motion.div
        className="absolute top-0 bottom-0 w-px bg-ivory shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
        style={{ left: handleX }}
      >
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-ivory text-ink shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
          animate={dragging ? { scale: 1.06 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 20 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
            <polyline points="9 6 15 12 9 18" transform="translate(0,0)" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
