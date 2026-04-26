"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { CountUp } from "@/components/motion/CountUp";
import { cn } from "@/lib/utils";
import { LAUNCH_NICHES, NICHES, getNiche } from "@/lib/niches";
import type { NicheId } from "@/types";

type Props = {
  initialNiche: NicheId | "";
  initialZips: string[];
  creditBalance: number;
};

const PER_ZIP_CREDITS = 30;

export function ScanWizard({ initialNiche, initialZips, creditBalance }: Props) {
  const router = useRouter();
  const [niche, setNiche] = useState<NicheId | "">(initialNiche);
  const [zips, setZips] = useState<string[]>(initialZips);
  const [zipDraft, setZipDraft] = useState("");
  const [zipError, setZipError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const nicheLabel = niche ? getNiche(niche)?.label ?? "your niche" : "contractor";
  const estimate = zips.length * PER_ZIP_CREDITS;
  const insufficient = creditBalance < estimate;
  const canSubmit =
    !!niche && zips.length > 0 && creditBalance >= 1 && !submitting;

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
    if (!canSubmit) return;
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
      router.push(`/batches/${json.batch_id}`);
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <Reveal>
        <div className="mb-10 flex items-end justify-between gap-6 border-b border-line/60 pb-8">
          <div className="max-w-2xl">
            <p className="num text-[11px] uppercase tracking-[0.22em] text-ink-muted">
              New scan
            </p>
            <h1 className="display mt-3 text-display-md text-ink">
              Find <span className="display-italic text-emerald">{nicheLabel.toLowerCase()}</span> opportunities
            </h1>
            <p className="mt-3 text-sm text-ink-soft">
              Pick a niche and the ZIPs you want to canvass. We&apos;ll surface
              the highest-intent properties in your service area.
            </p>
          </div>
          <div className="hidden text-right md:block">
            <p className="num text-[11px] uppercase tracking-[0.22em] text-ink-muted">
              Credit balance
            </p>
            <p className="num mt-2 text-2xl text-ink">{creditBalance}</p>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Reveal delay={0.08} className="lg:col-span-3">
          <div className="rounded-3xl border border-line bg-ivory-50 p-8 shadow-editorial lg:p-10">
            <div>
              <p className="num text-[11px] uppercase tracking-[0.22em] text-ink-muted">
                01 — Scanning for
              </p>
              <h2 className="display mt-2 text-2xl text-ink">Pick a niche</h2>
              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                        "group flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all",
                        selected
                          ? "border-ink bg-ink text-ivory shadow-hover"
                          : "border-line bg-ivory hover:border-ink/40 hover:shadow-card",
                      )}
                    >
                      <span className="text-[22px] leading-none">{n.icon}</span>
                      <span
                        className={cn(
                          "display text-base font-medium",
                          selected ? "text-ivory" : "text-ink",
                        )}
                      >
                        {n.label}
                      </span>
                      {selected ? (
                        <span className="ml-auto h-2 w-2 rounded-full bg-emerald" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-10 border-t border-line/60 pt-8">
              <div className="flex items-baseline justify-between">
                <p className="num text-[11px] uppercase tracking-[0.22em] text-ink-muted">
                  02 — Service area
                </p>
                <p className="num text-[11px] uppercase tracking-[0.22em] text-ink-muted">
                  {zips.length}/10
                </p>
              </div>
              <h2 className="display mt-2 text-2xl text-ink">Add ZIP codes</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Pre-filled from your profile. Press Enter or comma to add.
              </p>

              <div
                onClick={() => inputRef.current?.focus()}
                className="mt-5 flex min-h-[88px] cursor-text flex-wrap items-start gap-2 rounded-2xl border border-line bg-ivory p-3.5 transition-all focus-within:border-ink focus-within:shadow-[0_0_0_3px_hsl(var(--ink)/0.08)]"
              >
                {zips.map((z) => (
                  <span
                    key={z}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald/20 bg-emerald/10 px-2.5 py-1 text-sm text-emerald"
                  >
                    <span className="num">{z}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeZip(z);
                      }}
                      className="rounded-full p-0.5 text-emerald/70 transition-colors hover:bg-emerald/20 hover:text-emerald"
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
                  className="num min-w-[8ch] flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-ink-muted/70"
                />
              </div>
              <p
                className={cn(
                  "mt-2 text-xs",
                  zipError ? "text-crimson" : "text-ink-muted",
                )}
              >
                {zipError ?? `Up to 10 ZIPs · ${PER_ZIP_CREDITS} credits each`}
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.16} className="lg:col-span-2">
          <div className="sticky top-24 rounded-3xl border border-line bg-ink p-8 text-ivory shadow-editorial lg:p-10">
            <p className="num text-[11px] uppercase tracking-[0.22em] text-ivory/60">
              Estimate
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <CountUp
                to={estimate}
                duration={0.6}
                className="num text-5xl text-ivory"
              />
              <span className="text-sm text-ivory/70">credits</span>
            </div>
            <p className="mt-2 text-sm text-ivory/70">
              {zips.length === 0
                ? "Add ZIPs to see your estimate"
                : `${zips.length} ZIP${zips.length === 1 ? "" : "s"} × ${PER_ZIP_CREDITS} credits`}
            </p>

            <div className="mt-8 space-y-3 border-t border-ivory/10 pt-6">
              <Row
                label="Balance"
                value={
                  <span className="num text-ivory">{creditBalance}</span>
                }
              />
              <Row
                label="After this scan"
                value={
                  <span
                    className={cn(
                      "num",
                      insufficient ? "text-ochre" : "text-ivory",
                    )}
                  >
                    {Math.max(creditBalance - estimate, 0)}
                  </span>
                }
              />
            </div>

            {zips.length > 0 && insufficient ? (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-ochre/40 bg-ochre/10 px-4 py-3 text-sm text-ochre-soft">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  strokeWidth={2}
                />
                <div>
                  <p className="font-medium">Low on credits</p>
                  <Link
                    href="/credits"
                    className="mt-1 inline-flex items-center gap-1 text-ochre underline-offset-4 hover:underline"
                  >
                    Buy more <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ) : null}

            {submitError ? (
              <p className="mt-6 text-sm text-crimson">{submitError}</p>
            ) : null}

            <div className="mt-8">
              {canSubmit ? (
                <Magnetic strength={0.2}>
                  <button
                    onClick={handleStart}
                    className="btn-primary w-full bg-ivory text-ink hover:bg-ochre"
                  >
                    Start scanning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </Magnetic>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={!canSubmit}
                  className="btn-primary w-full cursor-not-allowed bg-ivory/20 text-ivory/40"
                >
                  {submitting ? "Starting…" : "Start scanning"}
                </button>
              )}
            </div>

            <p className="mt-4 text-center text-[11px] text-ivory/50">
              You won&apos;t be charged until results are ready to review.
            </p>
          </div>
        </Reveal>
      </div>
    </PageContainer>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ivory/60">{label}</span>
      {value}
    </div>
  );
}
