"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  approvedIds: string[];
  creditBalance: number;
  returnAddress: string;
};

export function MailModal({
  open,
  onOpenChange,
  approvedIds,
  creditBalance,
  returnAddress,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const n = approvedIds.length;

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_ids: approvedIds }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Mailing failed");
      toast.success(`${json.mailed} postcards sent to printer`);
      onOpenChange(false);
      router.push("/crm");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Confirm mailing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">
              {n} personalized postcard{n === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {n} credit{n === 1 ? "" : "s"} will be deducted (balance:{" "}
              <span className="font-mono font-semibold text-slate-900">
                {creditBalance}
              </span>
              )
            </p>
          </div>

          <div className="text-xs text-slate-600">
            From: {returnAddress || <span className="italic text-slate-400">(not set)</span>}{" "}
            <Link
              href="/settings"
              className="ml-1 font-medium text-brand hover:text-brand-dark"
            >
              Edit in Settings →
            </Link>
          </div>

          <p className="text-xs text-slate-500">
            Est. delivery: 3–5 business days
          </p>

          <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            Credits are non-refundable once mailing begins.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || n === 0 || creditBalance < n}
            className="bg-brand hover:bg-brand-dark"
          >
            {submitting ? "Mailing..." : `Mail ${n} Postcard${n === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
