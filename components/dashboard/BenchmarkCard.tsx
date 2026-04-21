import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getNiche } from "@/lib/niches";
import { cn, formatCurrency } from "@/lib/utils";
import type { NicheId } from "@/types";

type Props = { userId: string; niche: NicheId | "" };

type Benchmark = {
  niche: string;
  avg_response_rate: number;
  avg_close_rate: number;
  avg_deal_value: number;
  sample_size: number;
  updated_at: string;
};

type UserAggregates = {
  response_rate: number;
  close_rate: number;
  avg_deal: number;
};

export async function BenchmarkCard({ userId, niche }: Props) {
  if (!niche) return null;
  const nicheCfg = getNiche(niche as NicheId);
  if (!nicheCfg) return null;

  const supabase = createClient();

  const [{ data: benchmark }, userAgg] = await Promise.all([
    supabase
      .from("niche_benchmarks")
      .select("*")
      .eq("niche", niche)
      .maybeSingle() as unknown as Promise<{ data: Benchmark | null }>,
    computeUserAggregates(supabase, userId),
  ]);

  if (!benchmark) {
    return (
      <Card>
        <Header icon={nicheCfg.icon} label={nicheCfg.label} />
        <p className="mt-3 text-sm text-slate-400">
          Benchmarks update nightly once we have enough data.
        </p>
      </Card>
    );
  }

  const rows: Array<{
    label: string;
    platform: string;
    you: string;
    dir: "up" | "down" | "flat";
  }> = [
    {
      label: "Response rate",
      platform: `${(benchmark.avg_response_rate * 100).toFixed(1)}%`,
      you: `${(userAgg.response_rate * 100).toFixed(1)}%`,
      dir: compare(userAgg.response_rate, benchmark.avg_response_rate),
    },
    {
      label: "Close rate",
      platform: `${(benchmark.avg_close_rate * 100).toFixed(1)}%`,
      you: `${(userAgg.close_rate * 100).toFixed(1)}%`,
      dir: compare(userAgg.close_rate, benchmark.avg_close_rate),
    },
    {
      label: "Avg deal value",
      platform: benchmark.avg_deal_value ? formatCurrency(benchmark.avg_deal_value, true) : "—",
      you: userAgg.avg_deal ? formatCurrency(userAgg.avg_deal, true) : "—",
      dir: compare(userAgg.avg_deal, benchmark.avg_deal_value),
    },
  ];

  return (
    <Card>
      <Header icon={nicheCfg.icon} label={nicheCfg.label} />
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between text-sm">
            <div>
              <p className="text-slate-500">{r.label}</p>
              <p className="font-display text-base font-semibold text-slate-900">
                {r.platform}
              </p>
            </div>
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                r.dir === "up" && "bg-emerald-50 text-emerald-700",
                r.dir === "down" && "bg-red-50 text-red-600",
                r.dir === "flat" && "bg-slate-100 text-slate-500",
              )}
            >
              {r.dir === "up" ? (
                <ArrowUp className="h-3 w-3" />
              ) : r.dir === "down" ? (
                <ArrowDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              you: {r.you}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
        Based on {benchmark.sample_size.toLocaleString()}+ postcards · Updated nightly
      </p>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      {children}
    </section>
  );
}

function Header({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-500">
        {label} · Platform Benchmarks
      </h3>
    </div>
  );
}

function compare(user: number, platform: number): "up" | "down" | "flat" {
  if (!platform || Math.abs(user - platform) / Math.max(platform, 1e-6) < 0.02) return "flat";
  return user >= platform ? "up" : "down";
}

async function computeUserAggregates(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<UserAggregates> {
  const { data: events } = await supabase
    .from("conversion_events")
    .select("to_stage")
    .eq("profile_id", userId);
  const delivered = events?.filter((e) => e.to_stage === "delivered").length ?? 0;
  const responded = events?.filter((e) => e.to_stage === "responded").length ?? 0;
  const won = events?.filter((e) => e.to_stage === "closed_won").length ?? 0;

  const { data: wonLeads } = await supabase
    .from("leads")
    .select("deal_value")
    .eq("profile_id", userId)
    .eq("current_stage", "closed_won");

  const wonValues = (wonLeads ?? [])
    .map((l) => Number(l.deal_value ?? 0))
    .filter((v) => v > 0);
  const avgDeal = wonValues.length
    ? wonValues.reduce((a, b) => a + b, 0) / wonValues.length
    : 0;

  return {
    response_rate: delivered ? responded / delivered : 0,
    close_rate: responded ? won / responded : 0,
    avg_deal: avgDeal,
  };
}
