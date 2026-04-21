"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/PageContainer";
import { EmptyState } from "@/components/ui/EmptyState";
import { PropertyCard } from "@/components/scan/PropertyCard";
import { MailModal } from "@/components/scan/MailModal";
import { cn, formatDate } from "@/lib/utils";
import { getNiche } from "@/lib/niches";
import type { NicheId, Property, ScanBatch } from "@/types";

type Filter = "all" | "hot" | "warm" | "render" | "approved";
type Sort = "score_desc" | "score_asc" | "value_desc" | "newest";

type Props = {
  batch: ScanBatch;
  properties: Property[];
  creditBalance: number;
  returnAddress: string;
};

export function BatchReviewClient({
  batch,
  properties: initial,
  creditBalance,
  returnAddress,
}: Props) {
  const [properties, setProperties] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("score_desc");
  const [mailOpen, setMailOpen] = useState(false);
  const [approveAllPending, setApproveAllPending] = useState(false);

  const niche = getNiche(batch.niche as NicheId);
  const approvedIds = useMemo(
    () => properties.filter((p) => p.approved).map((p) => p.id),
    [properties],
  );

  const visible = useMemo(() => {
    let list = [...properties];
    switch (filter) {
      case "hot":
        list = list.filter((p) => (p.upgrade_score ?? 0) >= 90);
        break;
      case "warm":
        list = list.filter(
          (p) => (p.upgrade_score ?? 0) >= 70 && (p.upgrade_score ?? 0) < 90,
        );
        break;
      case "render":
        list = list.filter((p) => !!p.render_url);
        break;
      case "approved":
        list = list.filter((p) => p.approved);
        break;
    }
    list.sort((a, b) => {
      switch (sort) {
        case "score_desc":
          return (b.upgrade_score ?? 0) - (a.upgrade_score ?? 0);
        case "score_asc":
          return (a.upgrade_score ?? 0) - (b.upgrade_score ?? 0);
        case "value_desc":
          return (b.estimated_value ?? 0) - (a.estimated_value ?? 0);
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });
    return list;
  }, [properties, filter, sort]);

  function handleApprovalChange(id: string, approved: boolean) {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, approved } : p)),
    );
  }

  async function handleApproveAll() {
    const toApprove = properties.filter(
      (p) => !p.approved && (p.upgrade_score ?? 0) >= 70 && !p.suppressed,
    );
    if (!toApprove.length) {
      toast.info("Nothing new to approve");
      return;
    }
    setApproveAllPending(true);
    setProperties((prev) =>
      prev.map((p) =>
        toApprove.find((x) => x.id === p.id) ? { ...p, approved: true } : p,
      ),
    );
    const results = await Promise.allSettled(
      toApprove.map((p) =>
        fetch(`/api/properties/${p.id}/approve`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: true }),
        }),
      ),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed) toast.error(`${failed} approval${failed === 1 ? "" : "s"} failed`);
    else toast.success(`Approved ${toApprove.length} properties`);
    setApproveAllPending(false);
  }

  const title = `Review — ${(batch.zip_codes ?? []).join(", ")}`;
  const subtitle = `${properties.length} ${niche?.label ?? ""} propert${properties.length === 1 ? "y" : "ies"} · Batch from ${formatDate(batch.created_at)}`;

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "hot", label: "Score 90–100 🔥" },
    { id: "warm", label: "Score 70–89 ⚡" },
    { id: "render", label: "Has AI Render" },
    { id: "approved", label: "Approved Only" },
  ];

  return (
    <>
      <PageContainer>
        <div className="mb-6 flex items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-[26px] font-semibold text-slate-900">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleApproveAll}
                disabled={approveAllPending}
                className="border-teal-300 text-teal-700 hover:bg-teal-50"
              >
                {approveAllPending ? "Approving..." : "Approve All"}
              </Button>
              <Button
                onClick={() => setMailOpen(true)}
                disabled={approvedIds.length === 0}
                className="bg-brand hover:bg-brand-dark"
              >
                Mail {approvedIds.length} →
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              {approvedIds.length} credit{approvedIds.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </PageContainer>

      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-8 py-3">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  filter === f.id
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="score_desc">Highest Score</option>
              <option value="score_asc">Lowest Score</option>
              <option value="value_desc">Highest Value</option>
              <option value="newest">Newest</option>
            </select>
            <p className="text-xs text-slate-500">
              Approved:{" "}
              <span className="font-mono font-semibold text-slate-900">
                {approvedIds.length}
              </span>
              /{properties.length}
            </p>
          </div>
        </div>
      </div>

      <PageContainer>
        {properties.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={SearchX}
              title="No qualifying properties found"
              description="Try adjacent ZIP codes or different season."
            />
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white/50 p-10 text-center text-sm text-slate-500">
            No properties match the current filter.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onApprovalChange={handleApprovalChange}
              />
            ))}
          </div>
        )}
      </PageContainer>

      <MailModal
        open={mailOpen}
        onOpenChange={setMailOpen}
        approvedIds={approvedIds}
        creditBalance={creditBalance}
        returnAddress={returnAddress}
      />
    </>
  );
}
