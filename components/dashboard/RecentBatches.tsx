import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn, formatRelative } from "@/lib/utils";
import { getNiche } from "@/lib/niches";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BatchStatus, NicheId, ScanBatch } from "@/types";

type Props = { userId: string };

const STATUS_STYLES: Record<
  BatchStatus,
  { label: string; className: string; spin: boolean }
> = {
  queued: { label: "Queued", className: "bg-slate-100 text-slate-700", spin: false },
  scanning: { label: "Scanning", className: "bg-blue-50 text-blue-700", spin: true },
  scoring: { label: "Scoring", className: "bg-blue-50 text-blue-700", spin: true },
  rendering: { label: "Rendering", className: "bg-blue-50 text-blue-700", spin: true },
  enriching: { label: "Enriching", className: "bg-blue-50 text-blue-700", spin: true },
  ready: { label: "Ready", className: "bg-emerald-50 text-emerald-700", spin: false },
  mailed: { label: "Mailed", className: "bg-indigo-50 text-indigo-700", spin: false },
  error: { label: "Error", className: "bg-red-50 text-red-700", spin: false },
};

export async function RecentBatches({ userId }: Props) {
  const supabase = createClient();
  const { data } = await supabase
    .from("scan_batches")
    .select("*")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(6);

  const batches = (data ?? []) as ScanBatch[];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="mb-4 font-display text-base font-semibold text-slate-900">
        Recent Batches
      </h2>

      {batches.length === 0 ? (
        <EmptyState
          icon={ScanLine}
          title="No batches yet"
          description="Start your first scan to populate your pipeline."
          action={
            <Button asChild className="bg-brand hover:bg-brand-dark">
              <Link href="/scan">Run first scan</Link>
            </Button>
          }
        />
      ) : (
        <div className="divide-y divide-slate-100">
          {batches.map((b) => {
            const zips = (b.zip_codes ?? []) as string[];
            const visibleZips = zips.slice(0, 3);
            const extra = zips.length - visibleZips.length;
            const niche = getNiche(b.niche as NicheId);
            const status = STATUS_STYLES[b.status];
            const actionable = b.status === "ready" || b.status === "mailed";
            const actionLabel = b.status === "mailed" ? "View" : "Review";

            return (
              <div
                key={b.id}
                className="grid grid-cols-6 items-center gap-3 py-3 text-sm"
              >
                <div className="text-slate-500">
                  {formatRelative(b.created_at)}
                </div>
                <div className="col-span-2 flex flex-wrap gap-1">
                  {visibleZips.map((z) => (
                    <span
                      key={z}
                      className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700"
                    >
                      {z}
                    </span>
                  ))}
                  {extra > 0 ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
                      +{extra}
                    </span>
                  ) : null}
                </div>
                <div>
                  {niche ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                      <span>{niche.icon}</span>
                      {niche.label}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </div>
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      status.className,
                    )}
                  >
                    {status.spin ? (
                      <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                    ) : null}
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <span className="font-mono text-xs text-slate-500">
                    {b.total_approved}
                  </span>
                  {actionable ? (
                    <Link
                      href={`/batches/${b.id}`}
                      className="inline-flex items-center gap-0.5 text-xs font-medium text-brand hover:text-brand-dark"
                    >
                      {actionLabel} <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
