"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import { LAUNCH_NICHES, NICHES, getNiche } from "@/lib/niches";
import type { BatchStatus, NicheId } from "@/types";

type Props = {
  initialNiche: NicheId | "";
  initialZips: string[];
  creditBalance: number;
};

type BatchState = {
  status: BatchStatus;
  progress_pct: number;
  total_scanned: number;
  total_scored: number;
  total_approved: number;
  error_message: string | null;
};

const TIPS = [
  "Best time to mail: Tuesday–Thursday",
  "Follow up 7–10 days after estimated delivery",
  "QR scan rate peaks 3–5 days after delivery",
  "Score 90+ properties convert 2x more than 70–79",
];

export function ScanWizard({ initialNiche, initialZips, creditBalance }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"setup" | "progress">("setup");
  const [niche, setNiche] = useState<NicheId | "">(initialNiche);
  const [zips, setZips] = useState<string[]>(initialZips);
  const [zipDraft, setZipDraft] = useState("");
  const [zipError, setZipError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batch, setBatch] = useState<BatchState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const nicheLabel = niche ? getNiche(niche)?.label ?? "Your niche" : "contractor";
  const estimate = zips.length * 30;
  const insufficient = creditBalance < estimate;

  function addZip(raw: string) {
    const z = raw.trim();
    if (!z) return;
    if (!/^\d{5}$/.test(z)) {
      setZipError("ZIP must be 5 digits");
      return;
    }
    if (zips.includes(z)) {
      setZipError("Already added");
      return;
    }
    if (zips.length >= 10) {
      setZipError("Max 10 ZIPs");
      return;
    }
    setZips([...zips, z]);
    setZipDraft("");
    setZipError(null);
  }

  function removeZip(z: string) {
    setZips(zips.filter((x) => x !== z));
  }

  async function handleStart() {
    if (!niche || !zips.length) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, zip_codes: zips }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? "Failed to start scan");
        setSubmitting(false);
        return;
      }
      setBatchId(json.batch_id);
      setView("progress");
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <AnimatePresence mode="wait">
        {view === "setup" ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            <PageHeader
              title="New Scan"
              subtitle={`Find ${nicheLabel.toLowerCase()} opportunities in your service area`}
            />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Niche selector */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Scanning for
                </p>
                <div className="space-y-2">
                  {LAUNCH_NICHES.map((id) => {
                    const n = NICHES.find((x) => x.id === id);
                    if (!n) return null;
                    const selected = niche === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setNiche(id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                          selected
                            ? "border-2 border-brand bg-brand-light"
                            : "border border-slate-200 bg-white hover:border-slate-300",
                        )}
                      >
                        <span className="text-[22px] leading-none">{n.icon}</span>
                        <span className="text-sm font-medium text-slate-900">
                          {n.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ZIP input */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Service area
                </p>
                <p className="mb-3 text-xs text-slate-400">
                  Pre-filled from your profile
                </p>
                <div
                  onClick={() => inputRef.current?.focus()}
                  className="flex min-h-[80px] cursor-text flex-wrap items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
                >
                  {zips.map((z) => (
                    <span
                      key={z}
                      className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-sm text-indigo-700"
                    >
                      <span className="font-mono">{z}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeZip(z);
                        }}
                        className="text-indigo-500 hover:text-indigo-700"
                        aria-label={`Remove ${z}`}
                      >
                        <X className="h-3 w-3" strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={inputRef}
                    value={zipDraft}
                    onChange={(e) => {
                      setZipDraft(e.target.value);
                      setZipError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addZip(zipDraft);
                      } else if (
                        e.key === "Backspace" &&
                        !zipDraft &&
                        zips.length > 0
                      ) {
                        removeZip(zips[zips.length - 1]);
                      }
                    }}
                    onBlur={() => zipDraft && addZip(zipDraft)}
                    placeholder={
                      zips.length === 0 ? "Type a ZIP and press Enter" : ""
                    }
                    inputMode="numeric"
                    maxLength={5}
                    className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
                {zipError ? (
                  <p className="mt-2 text-xs text-red-600">{zipError}</p>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">
                    Up to 10 ZIPs — press Enter or comma to add
                  </p>
                )}
              </div>
            </div>

            {/* Credit estimate */}
            <div className="mt-6 rounded-lg bg-slate-50 p-3">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-slate-900">
                  Estimated: ~{estimate} credits
                </p>
                <p className="text-sm text-slate-500">
                  You have{" "}
                  <span className="font-mono font-semibold text-slate-900">
                    {creditBalance}
                  </span>{" "}
                  credits
                </p>
              </div>
              {zips.length > 0 && insufficient ? (
                <div className="mt-2 flex items-center gap-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
                  Low on credits.{" "}
                  <Link
                    href="/credits"
                    className="font-semibold text-amber-900 underline"
                  >
                    Buy more credits →
                  </Link>
                </div>
              ) : null}
            </div>

            {submitError ? (
              <p className="mt-3 text-sm text-red-600">{submitError}</p>
            ) : null}

            <Button
              onClick={handleStart}
              disabled={
                !zips.length ||
                !niche ||
                creditBalance < 1 ||
                submitting
              }
              className="mt-6 h-11 w-full bg-brand hover:bg-brand-dark"
            >
              {submitting ? "Starting..." : "Start Scanning →"}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="progress"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-3"
          >
            <div className="lg:col-span-2">
              {batchId ? (
                <ProgressView
                  batchId={batchId}
                  zipCount={zips.length}
                  onBatch={setBatch}
                  batch={batch}
                  onReview={() => router.push(`/batches/${batchId}`)}
                />
              ) : null}
            </div>
            <TipsCard />
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}

function ProgressView({
  batchId,
  zipCount,
  batch,
  onBatch,
  onReview,
}: {
  batchId: string;
  zipCount: number;
  batch: BatchState | null;
  onBatch: (b: BatchState) => void;
  onReview: () => void;
}) {
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch(`/api/scan/${batchId}/status`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as BatchState;
        if (!cancelled) onBatch(data);
      } catch {
        /* swallow transient errors */
      }
    }
    tick();
    const id = setInterval(() => {
      if (batch?.status === "ready" || batch?.status === "error") return;
      tick();
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [batchId, batch?.status, onBatch]);

  const pct = batch?.progress_pct ?? 0;
  const status = batch?.status ?? "queued";
  const isReady = status === "ready";
  const isError = status === "error";

  const R = 60;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - pct / 100);

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-card">
      <h2 className="font-display text-xl font-semibold text-slate-900">
        Scanning {zipCount} ZIP code{zipCount === 1 ? "" : "s"}
      </h2>

      <div className="relative mx-auto mt-6 h-[140px] w-[140px]">
        <svg width="140" height="140" className="-rotate-90">
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={8}
          />
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="#4F46E5"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-3xl font-bold text-slate-900">
            {pct}%
          </span>
        </div>
      </div>

      <p className="mt-4 min-h-[20px] text-sm text-slate-500">
        {statusMessage(status, batch)}
      </p>

      <div className="mt-5 grid grid-cols-4 gap-2">
        <Pill label="Found" value={batch?.total_scanned ?? 0} />
        <Pill label="Scored" value={batch?.total_scored ?? 0} />
        <Pill label="Passed" value={batch?.total_approved ?? 0} />
        <Pill label="Ready" value={isReady ? batch?.total_approved ?? 0 : 0} />
      </div>

      {isReady ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mt-6"
        >
          <Button
            onClick={onReview}
            className="h-11 w-full animate-[bounce_0.6s_ease-in-out_1] bg-brand hover:bg-brand-dark"
          >
            Review {batch?.total_approved ?? 0} Properties →
          </Button>
        </motion.div>
      ) : null}

      {isError ? (
        <p className="mt-4 text-sm text-red-600">
          {batch?.error_message ?? "Something went wrong."}
        </p>
      ) : null}
    </div>
  );
}

function statusMessage(status: BatchStatus, batch: BatchState | null): string {
  switch (status) {
    case "queued":
      return "Queued, starting shortly...";
    case "scanning":
      return "🔍 Searching ATTOM database...";
    case "scoring":
      return `🤖 AI analyzing property images (${batch?.total_scored ?? 0}/${batch?.total_scanned ?? 0})`;
    case "rendering":
      return "🎨 Generating AI property renders...";
    case "enriching":
      return "📋 Looking up owner information...";
    case "ready":
      return `✅ Found ${batch?.total_approved ?? 0} qualifying properties!`;
    case "error":
      return `❌ ${batch?.error_message ?? "Scan failed"}`;
    case "mailed":
      return "📬 Batch already mailed";
    default:
      return "";
  }
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <p className="font-display text-lg font-bold text-slate-900">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
    </div>
  );
}

function TipsCard() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % TIPS.length), 8000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Pro tip
      </p>
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4 }}
          className="text-sm text-slate-700"
        >
          {TIPS[idx]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
