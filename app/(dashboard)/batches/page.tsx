import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Loader2, ScanLine } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { cn, formatRelative } from "@/lib/utils";
import { getNiche } from "@/lib/niches";
import type { BatchStatus, NicheId, ScanBatch } from "@/types";

export const dynamic = "force-dynamic";

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

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "In progress" },
  { key: "ready", label: "Ready" },
  { key: "mailed", label: "Mailed" },
  { key: "error", label: "Error" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const ACTIVE_STATUSES: BatchStatus[] = [
  "queued",
  "scanning",
  "scoring",
  "rendering",
  "enriching",
];

function isFilterKey(v: string | undefined): v is FilterKey {
  return !!v && FILTERS.some((f) => f.key === v);
}

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const active: FilterKey = isFilterKey(searchParams.status)
    ? searchParams.status
    : "all";

  let query = supabase
    .from("scan_batches")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (active === "active") query = query.in("status", ACTIVE_STATUSES);
  else if (active === "ready") query = query.eq("status", "ready");
  else if (active === "mailed") query = query.eq("status", "mailed");
  else if (active === "error") query = query.eq("status", "error");

  const { data } = await query;
  const batches = (data ?? []) as ScanBatch[];

  const counts = batches.reduce(
    (acc, b) => {
      acc.total += 1;
      acc.approved += b.total_approved ?? 0;
      acc.mailed += b.total_mailed ?? 0;
      return acc;
    },
    { total: 0, approved: 0, mailed: 0 },
  );

  return (
    <PageContainer>
      <PageHeader
        title="Batches"
        subtitle={
          active === "all"
            ? `${counts.total} total · ${counts.approved} approved · ${counts.mailed} mailed`
            : `Filtered by ${FILTERS.find((f) => f.key === active)?.label.toLowerCase()}`
        }
        action={
          <Button asChild className="bg-brand hover:bg-brand-dark">
            <Link href="/scan">
              <ScanLine className="mr-2 h-4 w-4" strokeWidth={1.75} />
              New Scan
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const isActive = f.key === active;
          const href = f.key === "all" ? "/batches" : `/batches?status=${f.key}`;
          return (
            <Link
              key={f.key}
              href={href}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-brand bg-brand text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        {batches.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={ScanLine}
              title={active === "all" ? "No batches yet" : "No batches match this filter"}
              description={
                active === "all"
                  ? "Start your first scan to populate your pipeline."
                  : "Try a different filter or run a new scan."
              }
              action={
                <Button asChild className="bg-brand hover:bg-brand-dark">
                  <Link href="/scan">Run a scan</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">ZIPs</th>
                  <th className="px-6 py-3">Niche</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Scanned</th>
                  <th className="px-6 py-3 text-right">Approved</th>
                  <th className="px-6 py-3 text-right">Mailed</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => {
                  const zips = (b.zip_codes ?? []) as string[];
                  const visibleZips = zips.slice(0, 3);
                  const extra = zips.length - visibleZips.length;
                  const niche = getNiche(b.niche as NicheId);
                  const status = STATUS_STYLES[b.status];
                  const inProgress = ACTIVE_STATUSES.includes(b.status);
                  // Every batch is now clickable — /batches/[id] handles
                  // active/error/ready/mailed surfaces.
                  const viewable = true;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60">
                      <td className="px-6 py-3 text-slate-500">
                        {formatRelative(b.created_at)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-1">
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
                      </td>
                      <td className="px-6 py-3">
                        {niche ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                            <span>{niche.icon}</span>
                            {niche.label}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
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
                        {inProgress && typeof b.progress_pct === "number" ? (
                          <div className="mt-1 text-[10px] font-mono text-slate-400">
                            {b.progress_pct}%
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-xs text-slate-600">
                        {b.total_scanned ?? 0}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-xs text-slate-600">
                        {b.total_approved ?? 0}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-xs text-slate-600">
                        {b.total_mailed ?? 0}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          href={`/batches/${b.id}`}
                          className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald hover:text-ink"
                        >
                          {b.status === "mailed"
                            ? "View"
                            : b.status === "ready"
                              ? "Review"
                              : b.status === "error"
                                ? "See error"
                                : "Track"}{" "}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
