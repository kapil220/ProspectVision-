"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LOB_ESTIMATED_COST_USD } from "@/lib/lob";
import { sleep } from "@/lib/utils";
import type { Property } from "@/types";

type Step = "review" | "confirm" | "success";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  approvedIds: string[];
  approvedProperties: Property[];
  creditBalance: number;
  returnAddress: string;
  batchId: string;
};

export function MailModal({
  open,
  onOpenChange,
  approvedIds,
  approvedProperties,
  creditBalance,
  returnAddress,
  batchId,
}: Props) {
  const [step, setStep] = useState<Step>("review");
  const [submitting, setSubmitting] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const router = useRouter();

  const n = approvedIds.length;
  const postage = (n * LOB_ESTIMATED_COST_USD).toFixed(2);
  const thumbs = approvedProperties.slice(0, 3);

  function reset() {
    setStep("review");
    setSubmittedCount(0);
    setSubmitting(false);
  }

  function handleClose(v: boolean) {
    onOpenChange(v);
    if (!v) setTimeout(reset, 300);
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/postcards/batch-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_ids: approvedIds }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Mailing failed");
      const submitted = json.submitted ?? 0;
      const failed = json.failed ?? 0;

      if (submitted === 0) {
        throw new Error(json.failures?.[0]?.error ?? `${failed} failed`);
      }

      setSubmittedCount(submitted);
      setStep("success");

      // Confetti tuned to brand palette
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.45 },
        colors: ["#0F5132", "#3A7559", "#D6A556", "#F2E2C2", "#F5F1EA"],
      });

      if (failed > 0) {
        toast.warning(`${failed} postcard${failed === 1 ? "" : "s"} failed — check the batch.`);
      }

      await sleep(1800);
      router.push(`/crm?batch=${batchId}`);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md overflow-hidden bg-ivory-50 p-0 sm:max-w-lg">
        <AnimatePresence mode="wait">
          {step === "success" ? (
            <SuccessView key="success" submitted={submittedCount} />
          ) : (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              <DialogHeader className="space-y-1.5">
                <p className="num text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                  {step === "review" ? "Review the mailing" : "Final confirmation"}
                </p>
                <DialogTitle className="display text-2xl font-medium tracking-tight">
                  {step === "review" ? (
                    <>
                      Mail {n} personalized{" "}
                      <span className="display-italic text-emerald">postcard{n === 1 ? "" : "s"}.</span>
                    </>
                  ) : (
                    <>
                      Sending <span className="display-italic text-emerald">${postage}</span> to USPS.
                    </>
                  )}
                </DialogTitle>
              </DialogHeader>

              {/* Thumbnail strip */}
              {thumbs.length > 0 && (
                <div className="mt-5 flex gap-2 overflow-hidden">
                  {thumbs.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.9, rotate: 0 }}
                      animate={{ opacity: 1, scale: 1, rotate: (i - 1) * 1.5 }}
                      transition={{ delay: i * 0.06, duration: 0.4 }}
                      className="overflow-hidden rounded-lg border border-line bg-paper shadow-card"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.render_url ?? p.satellite_url ?? ""}
                        alt=""
                        className="h-20 w-28 object-cover"
                      />
                    </motion.div>
                  ))}
                  {n > 3 && (
                    <div className="grid h-20 flex-1 place-items-center rounded-lg border border-dashed border-line text-xs text-ink-soft">
                      +{n - 3} more
                    </div>
                  )}
                </div>
              )}

              {/* Cost block */}
              <dl className="mt-6 divide-y divide-line rounded-xl border border-line bg-ivory">
                <Row label="Postcards" value={`${n}`} />
                <Row
                  label="Credits"
                  value={`–${n} (balance ${creditBalance.toLocaleString()})`}
                  warn={creditBalance < n}
                />
                <Row
                  label="Postage est."
                  value={`$${LOB_ESTIMATED_COST_USD.toFixed(2)} × ${n} = $${postage}`}
                />
                <Row label="Delivery" value="USPS first class · 3–5 days" />
              </dl>

              <p className="mt-3 text-xs text-ink-muted">
                Returns to:{" "}
                {returnAddress || (
                  <span className="italic text-ink-muted">(not set)</span>
                )}{" "}
                <Link href="/settings" className="link-underline ml-1 font-medium text-emerald">
                  Edit
                </Link>
              </p>

              {step === "confirm" && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-ochre/10 px-3 py-2.5 text-xs text-ink">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ochre" strokeWidth={2.2} />
                  Credits are non-refundable once mailing begins.
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => (step === "confirm" ? setStep("review") : handleClose(false))}
                  disabled={submitting}
                  className="btn-ghost h-10 px-4 text-sm"
                >
                  {step === "confirm" ? "Back" : "Cancel"}
                </button>
                {step === "review" ? (
                  <button
                    type="button"
                    onClick={() => setStep("confirm")}
                    disabled={n === 0 || creditBalance < n}
                    className="btn-primary h-10 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleConfirm}
                    disabled={submitting}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-emerald px-5 text-sm font-medium text-ivory transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" /> Mail {n} · ${postage}
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <dt className="num text-[11px] uppercase tracking-[0.18em] text-ink-muted">{label}</dt>
      <dd className={warn ? "font-medium text-crimson" : "text-ink"}>{value}</dd>
    </div>
  );
}

function SuccessView({ submitted }: { submitted: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.21, 0.61, 0.35, 1] }}
      className="bg-emerald p-10 text-center text-ivory"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 14 }}
        className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ivory/15"
      >
        <CheckCircle2 className="h-7 w-7 text-ivory" strokeWidth={2} />
      </motion.div>
      <h2 className="mt-6 display text-2xl font-medium tracking-tight">
        {submitted} postcard{submitted === 1 ? "" : "s"} heading to{" "}
        <span className="display-italic">USPS.</span>
      </h2>
      <p className="mt-3 text-sm text-ivory/80">
        3–5 business day delivery. We&apos;ll track every card and ping you when homeowners reply.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 text-xs num uppercase tracking-[0.2em] text-ivory/70">
        <Loader2 className="h-3 w-3 animate-spin" /> Opening your CRM…
      </div>
    </motion.div>
  );
}
