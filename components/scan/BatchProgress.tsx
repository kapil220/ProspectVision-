"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, Eye, Sparkles, Database, AlertTriangle, Loader2 } from "lucide-react";
import { CountUp } from "@/components/motion/CountUp";
import { cn } from "@/lib/utils";
import type { BatchStatus } from "@/types";

type Phase = {
  key: BatchStatus;
  label: string;
  body: string;
  icon: typeof ScanLine;
};

const PHASES: Phase[] = [
  { key: "scanning", label: "Scanning", body: "Pulling parcels from county + ATTOM data.", icon: ScanLine },
  { key: "scoring", label: "Scoring", body: "GPT-4o reading satellite + street imagery.", icon: Eye },
  { key: "rendering", label: "Rendering", body: "Generating photoreal 'after' images.", icon: Sparkles },
  { key: "enriching", label: "Enriching", body: "Adding ROI estimates + landing slugs.", icon: Database },
];

const ORDER: BatchStatus[] = ["queued", "scanning", "scoring", "rendering", "enriching", "ready"];

export type BatchProgressProps = {
  status: BatchStatus;
  progressPct: number | null;
  totalScanned: number | null;
  totalScored: number | null;
  totalApproved: number | null;
  errorMessage: string | null;
  zipCodes: string[];
  niche?: string;
  compact?: boolean;
};

export function BatchProgress({
  status,
  progressPct,
  totalScanned,
  totalScored,
  totalApproved,
  errorMessage,
  zipCodes,
  niche,
  compact = false,
}: BatchProgressProps) {
  if (status === "error") {
    return (
      <div className="rounded-3xl border border-crimson/30 bg-crimson/5 p-8">
        <AlertTriangle className="h-7 w-7 text-crimson" />
        <h3 className="mt-4 display text-2xl font-medium tracking-tight">
          Something broke during this scan.
        </h3>
        <p className="mt-2 text-sm text-ink-soft">
          {errorMessage ?? "Unknown error. Try running the scan again."}
        </p>
      </div>
    );
  }

  const pct = Math.max(0, Math.min(100, progressPct ?? 0));
  const currentIdx = ORDER.indexOf(status);
  const activePhase = PHASES.find((p) => p.key === status) ?? PHASES[0];

  if (compact) {
    return (
      <CompactProgress pct={pct} status={status} activePhase={activePhase} />
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-ivory-50 shadow-card">
      <div className="grid gap-10 p-8 md:grid-cols-[auto_1fr] md:p-12">
        <ProgressArc pct={pct} status={status} />

        <div className="flex flex-col justify-center">
          <p className="num text-[11px] uppercase tracking-[0.22em] text-ink-muted">
            {zipCodes.length > 0 ? `Scanning ${zipCodes.join(", ")}` : "Active scan"}
            {niche ? ` · ${niche}` : ""}
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="mt-3"
            >
              <h2 className="display text-display-md font-medium tracking-tight">
                {status === "ready" ? (
                  <>
                    Done. <span className="display-italic text-emerald">Ready to review.</span>
                  </>
                ) : (
                  <>
                    {activePhase.label}
                    <span className="display-italic text-emerald">…</span>
                  </>
                )}
              </h2>
              <p className="mt-2 max-w-md text-base text-ink-soft">{activePhase.body}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
            <Counter label="Scanned" value={totalScanned ?? 0} />
            <Counter label="Scored" value={totalScored ?? 0} />
            <Counter label="Approved" value={totalApproved ?? 0} highlight />
          </div>

          <div className="mt-8">
            <PhaseRail currentIdx={currentIdx} status={status} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressArc({ pct, status }: { pct: number; status: BatchStatus }) {
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (c * pct) / 100;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--line))"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--emerald))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 80, damping: 24 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="num display text-4xl font-medium tracking-tight">
            <CountUp to={Math.round(pct)} />
            <span className="text-ink-muted">%</span>
          </div>
          {status !== "ready" && (
            <Loader2 className="mx-auto mt-1.5 h-3.5 w-3.5 animate-spin text-ink-muted" />
          )}
        </div>
      </div>
    </div>
  );
}

function Counter({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={cn("bg-ivory-50 p-4", highlight && "bg-emerald/5")}>
      <div className="num text-[10px] uppercase tracking-[0.22em] text-ink-muted">{label}</div>
      <div className={cn("num display mt-1 text-2xl font-medium tracking-tight", highlight && "text-emerald")}>
        <CountUp to={value} />
      </div>
    </div>
  );
}

function PhaseRail({ currentIdx, status }: { currentIdx: number; status: BatchStatus }) {
  return (
    <ol className="grid grid-cols-4 gap-2">
      {PHASES.map((p, i) => {
        const phaseIdx = ORDER.indexOf(p.key);
        const done = currentIdx > phaseIdx || status === "ready";
        const active = p.key === status;
        const Icon = p.icon;
        return (
          <li key={p.key} className="relative">
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors",
                done && "border-emerald/50 bg-emerald/5",
                active && "border-ink bg-ink text-ivory",
                !done && !active && "border-line bg-ivory text-ink-muted",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", active && "animate-pulse")} />
              <span className="num text-[10px] font-medium uppercase tracking-[0.18em]">
                {p.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function CompactProgress({
  pct,
  status,
  activePhase,
}: {
  pct: number;
  status: BatchStatus;
  activePhase: Phase;
}) {
  const Icon = activePhase.icon;
  return (
    <div className="rounded-2xl border border-line bg-ivory-50 p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald/10 text-emerald">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="num text-[10px] uppercase tracking-[0.22em] text-ink-muted">
            {status === "ready" ? "Ready" : activePhase.label}
          </div>
          <div className="font-display text-sm font-medium text-ink truncate">
            {activePhase.body}
          </div>
        </div>
        <div className="num display text-xl font-medium">
          <CountUp to={Math.round(pct)} />%
        </div>
      </div>
      <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-line">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 24 }}
        />
      </div>
    </div>
  );
}
