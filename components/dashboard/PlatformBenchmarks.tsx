import { createClient } from "@/lib/supabase/server";
import { cn, formatCurrency } from "@/lib/utils";
import { getNiche } from "@/lib/niches";
import type { NicheId } from "@/types";

type Props = { userId: string; niche: NicheId | "" };

type Benchmark = {
  avg_response_rate: number | null;
  avg_close_rate: number | null;
  avg_deal_value: number | null;
  sample_size: number | null;
};

export async function PlatformBenchmarks({ userId, niche }: Props) {
  const supabase = createClient();

  const effectiveNiche = (niche || "landscaping") as NicheId;
  const nicheCfg = getNiche(effectiveNiche);

  const [bRes, leadsRes, sentRes] = await Promise.all([
    supabase
      .from("niche_benchmarks")
      .select("avg_response_rate, avg_close_rate, avg_deal_value, sample_size")
      .eq("niche", effectiveNiche)
      .maybeSingle(),
    supabase
      .from("leads")
      .select("current_stage, deal_value")
      .eq("profile_id", userId),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", userId)
      .neq("lob_status", "not_mailed"),
  ]);

  const b = (bRes.data ?? {}) as Benchmark;
  const leads = leadsRes.data ?? [];
  const sent = sentRes.count ?? 0;

  const responded = leads.filter((l) =>
    ["responded", "appointment_set", "quoted", "closed_won", "closed_lost"].includes(
      l.current_stage as string,
    ),
  ).length;
  const quoted = leads.filter((l) =>
    ["quoted", "closed_won", "closed_lost"].includes(l.current_stage as string),
  ).length;
  const won = leads.filter((l) => l.current_stage === "closed_won");

  const myResponseRate = sent > 0 ? (responded / sent) * 100 : 0;
  const myCloseRate = quoted > 0 ? (won.length / quoted) * 100 : 0;
  const myAvgDeal =
    won.length > 0
      ? won.reduce((sum, l) => sum + Number(l.deal_value ?? 0), 0) / won.length
      : 0;

  const bench = {
    response: b.avg_response_rate != null ? Number(b.avg_response_rate) * 100 : null,
    close: b.avg_close_rate != null ? Number(b.avg_close_rate) * 100 : null,
    deal: b.avg_deal_value != null ? Number(b.avg_deal_value) : null,
  };

  const rows = [
    {
      label: "Response Rate",
      bench: bench.response !== null ? `${bench.response.toFixed(1)}%` : "—",
      mine: `${myResponseRate.toFixed(1)}%`,
      up: bench.response !== null ? myResponseRate >= bench.response : null,
    },
    {
      label: "Close Rate",
      bench: bench.close !== null ? `${bench.close.toFixed(0)}%` : "—",
      mine: `${myCloseRate.toFixed(0)}%`,
      up: bench.close !== null ? myCloseRate >= bench.close : null,
    },
    {
      label: "Avg Deal Value",
      bench: bench.deal !== null ? formatCurrency(bench.deal, true) : "—",
      mine: formatCurrency(myAvgDeal, true),
      up: bench.deal !== null ? myAvgDeal >= bench.deal : null,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-xl">{nicheCfg?.icon ?? "📊"}</span>
        <h2 className="font-display text-base font-semibold text-slate-900">
          {nicheCfg?.label ?? "Benchmarks"}
        </h2>
      </div>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.label}>
            <p className="text-xs text-slate-500">{r.label}</p>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="font-display text-lg font-semibold text-slate-900">
                {r.bench}
              </span>
              {r.up !== null ? (
                <span
                  className={cn(
                    "text-xs font-medium",
                    r.up ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  you: {r.mine} {r.up ? "↑" : "↓"}
                </span>
              ) : (
                <span className="text-xs text-slate-400">you: {r.mine}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-slate-400">
        Based on {b.sample_size ?? 0}+ postcards
      </p>
    </div>
  );
}
