import { Mail, TrendingUp, DollarSign, Target } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import type { NicheId } from "@/types";

type DashboardStats = {
  total_sent: number;
  pipeline_value: number;
  closed_revenue: number;
  total_won: number;
  total_quoted: number;
};

type Props = { userId: string; niche: NicheId | "" };

export async function StatsRow({ userId, niche }: Props) {
  const supabase = createClient();

  const [statsRes, benchmarkRes] = await Promise.all([
    supabase.rpc("get_dashboard_stats", { p_user_id: userId }),
    niche
      ? supabase
          .from("niche_benchmarks")
          .select("avg_close_rate")
          .eq("niche", niche)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const stats = (statsRes.data as DashboardStats | null) ?? {
    total_sent: 0,
    pipeline_value: 0,
    closed_revenue: 0,
    total_won: 0,
    total_quoted: 0,
  };

  const closeRate =
    stats.total_quoted > 0
      ? Math.round((stats.total_won / stats.total_quoted) * 100)
      : 0;

  const benchmarkRate = benchmarkRes.data?.avg_close_rate
    ? Math.round(Number(benchmarkRes.data.avg_close_rate) * 100)
    : null;

  let rateDelta: string | undefined;
  let rateDir: "up" | "down" | "flat" | undefined;
  if (benchmarkRate !== null) {
    const diff = closeRate - benchmarkRate;
    rateDelta = `${diff >= 0 ? "+" : ""}${diff}% vs avg`;
    rateDir = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Postcards Sent"
        value={stats.total_sent}
        icon={Mail}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
      />
      <StatCard
        label="Pipeline Value"
        value={formatCurrency(Number(stats.pipeline_value), true)}
        icon={TrendingUp}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
      />
      <StatCard
        label="Closed Revenue"
        value={formatCurrency(Number(stats.closed_revenue), true)}
        icon={DollarSign}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
      />
      <StatCard
        label="Close Rate"
        value={`${closeRate}%`}
        icon={Target}
        iconBg="bg-red-50"
        iconColor="text-red-600"
        delta={rateDelta}
        deltaDir={rateDir}
      />
    </div>
  );
}
