import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/PageContainer";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getNiche } from "@/lib/niches";
import type { NicheId } from "@/types";

export const dynamic = "force-dynamic";

type BatchRow = {
  id: string;
  created_at: string;
  niche: NicheId;
  zip_codes: string[];
  total_mailed: number;
};

type LeadLite = {
  current_stage: string;
  deal_value: number | null;
  property: { batch_id: string | null; upgrade_score: number | null; zip: string | null } | null;
};

export default async function AnalyticsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: batches }, { data: leads }] = await Promise.all([
    supabase
      .from("scan_batches")
      .select("id, created_at, niche, zip_codes, total_mailed")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("current_stage, deal_value, property:properties(batch_id, upgrade_score, zip)")
      .eq("profile_id", user.id),
  ]);

  const batchRows = (batches ?? []) as BatchRow[];
  const leadRows = (leads ?? []) as unknown as LeadLite[];

  // Per-batch metrics
  const batchMetrics = batchRows.map((b) => {
    const batchLeads = leadRows.filter((l) => l.property?.batch_id === b.id);
    const responded = batchLeads.filter((l) =>
      ["responded", "appointment_set", "quoted", "closed_won", "closed_lost"].includes(l.current_stage),
    ).length;
    const won = batchLeads.filter((l) => l.current_stage === "closed_won").length;
    const revenue = batchLeads
      .filter((l) => l.current_stage === "closed_won")
      .reduce((sum, l) => sum + Number(l.deal_value ?? 0), 0);
    const closeRate = responded ? won / responded : 0;
    return { ...b, responded, won, revenue, closeRate };
  });

  const bestBatch = [...batchMetrics]
    .filter((b) => b.responded > 0)
    .sort((a, b) => b.closeRate - a.closeRate)[0];

  // Score-range analysis
  const buckets = [
    { label: "90-100", min: 90, max: 100 },
    { label: "80-89", min: 80, max: 89 },
    { label: "70-79", min: 70, max: 79 },
    { label: "<70", min: 0, max: 69 },
  ];
  const scoreAnalysis = buckets.map((b) => {
    const inBucket = leadRows.filter((l) => {
      const s = l.property?.upgrade_score ?? -1;
      return s >= b.min && s <= b.max;
    });
    const won = inBucket.filter((l) => l.current_stage === "closed_won").length;
    const total = inBucket.length;
    return { ...b, total, won, closeRate: total ? won / total : 0 };
  });

  // ZIP performance
  const zipMap = new Map<string, { total: number; responded: number; won: number }>();
  for (const l of leadRows) {
    const zip = l.property?.zip;
    if (!zip) continue;
    const bucket = zipMap.get(zip) ?? { total: 0, responded: 0, won: 0 };
    bucket.total += 1;
    if (["responded", "appointment_set", "quoted", "closed_won", "closed_lost"].includes(l.current_stage)) {
      bucket.responded += 1;
    }
    if (l.current_stage === "closed_won") bucket.won += 1;
    zipMap.set(zip, bucket);
  }
  const zipRows = Array.from(zipMap.entries())
    .map(([zip, v]) => ({ zip, ...v, responseRate: v.total ? v.responded / v.total : 0 }))
    .sort((a, b) => b.responseRate - a.responseRate)
    .slice(0, 10);

  return (
    <PageContainer>
      <h1 className="font-display text-2xl font-semibold text-slate-900">Analytics</h1>
      <p className="mt-1 text-sm text-slate-500">
        Batch performance, score-range conversion, and top ZIPs.
      </p>

      {bestBatch ? (
        <section className="mt-6 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
            <Star className="h-4 w-4 fill-current" /> Best batch
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <p className="font-display text-lg font-bold text-slate-900">
              {formatDate(bestBatch.created_at)} · {getNiche(bestBatch.niche)?.label ?? bestBatch.niche}
            </p>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-amber-800">
              Close rate {(bestBatch.closeRate * 100).toFixed(0)}%
            </span>
            <span className="text-sm text-slate-600">
              {bestBatch.total_mailed} mailed · {bestBatch.responded} responses · {bestBatch.won} won ·{" "}
              {formatCurrency(bestBatch.revenue, true)} revenue
            </span>
          </div>
        </section>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-500">
            Batches
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Batch date</th>
              <th className="px-4 py-3">ZIPs</th>
              <th className="px-4 py-3">Niche</th>
              <th className="px-4 py-3">Mailed</th>
              <th className="px-4 py-3">Responses</th>
              <th className="px-4 py-3">Close rate</th>
              <th className="px-4 py-3">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {batchMetrics.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No batches yet.
                </td>
              </tr>
            ) : (
              batchMetrics.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 text-slate-600">{formatDate(b.created_at)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {b.zip_codes?.slice(0, 3).join(", ")}
                    {b.zip_codes && b.zip_codes.length > 3 ? ` +${b.zip_codes.length - 3}` : ""}
                  </td>
                  <td className="px-4 py-3 text-slate-900">{getNiche(b.niche)?.label ?? b.niche}</td>
                  <td className="px-4 py-3 text-slate-600">{b.total_mailed}</td>
                  <td className="px-4 py-3 text-slate-600">{b.responded}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {b.responded ? `${(b.closeRate * 100).toFixed(0)}%` : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {b.revenue ? formatCurrency(b.revenue, true) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-500">
            Score-range conversion
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Are high-score properties closing better?
          </p>
          <div className="mt-4 space-y-2.5">
            {scoreAnalysis.map((b) => {
              const pct = Math.max(2, b.closeRate * 100);
              return (
                <div key={b.label}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-mono font-medium text-slate-700">Score {b.label}</span>
                    <span className="text-slate-500">
                      {b.won}/{b.total} won · {(b.closeRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-500">
            Top ZIP performance
          </h2>
          <p className="mt-1 text-xs text-slate-500">Ranked by response rate.</p>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2 font-medium">ZIP</th>
                <th className="py-2 font-medium">Sent</th>
                <th className="py-2 font-medium">Responses</th>
                <th className="py-2 font-medium">Response %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {zipRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 text-center text-slate-400">
                    No leads yet.
                  </td>
                </tr>
              ) : (
                zipRows.map((z) => (
                  <tr key={z.zip}>
                    <td className="py-2 font-mono text-sm text-slate-900">{z.zip}</td>
                    <td className="py-2 text-slate-600">{z.total}</td>
                    <td className="py-2 text-slate-600">{z.responded}</td>
                    <td className="py-2 text-slate-600">{(z.responseRate * 100).toFixed(1)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </PageContainer>
  );
}
