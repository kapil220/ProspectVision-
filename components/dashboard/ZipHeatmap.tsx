import { ArrowDown, ArrowUp, Minus, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn, formatCurrency } from "@/lib/utils";
import type { NicheId } from "@/types";

type Props = { userId: string; niche: NicheId | "" };

type GeoRow = {
  zip_code: string;
  niche: string;
  total_sent: number;
  total_delivered: number;
  total_responded: number;
  total_closed: number;
  avg_deal_value: number;
  response_rate: number;
  close_rate: number;
};

type Benchmark = {
  avg_response_rate: number;
  avg_close_rate: number;
};

export async function ZipHeatmap({ userId, niche }: Props) {
  if (!niche) return null;
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("service_area_zips")
    .eq("id", userId)
    .maybeSingle();

  const zips: string[] = profile?.service_area_zips ?? [];
  if (zips.length === 0) {
    return (
      <Card>
        <Header />
        <p className="mt-3 text-sm text-slate-400">
          Add service-area ZIP codes in settings to see per-ZIP performance.
        </p>
      </Card>
    );
  }

  const [{ data: rows }, { data: benchmark }] = await Promise.all([
    supabase
      .from("geo_performance")
      .select("*")
      .eq("niche", niche)
      .in("zip_code", zips) as unknown as Promise<{ data: GeoRow[] | null }>,
    supabase
      .from("niche_benchmarks")
      .select("avg_response_rate, avg_close_rate")
      .eq("niche", niche)
      .maybeSingle() as unknown as Promise<{ data: Benchmark | null }>,
  ]);

  const data = rows ?? [];
  if (data.length === 0) {
    return (
      <Card>
        <Header />
        <p className="mt-3 text-sm text-slate-400">
          No aggregated performance data yet. ZIP performance updates nightly.
        </p>
      </Card>
    );
  }

  const baseline = benchmark?.avg_response_rate ?? avg(data.map((r) => r.response_rate));
  const bestZip = [...data].sort((a, b) => b.response_rate - a.response_rate)[0]?.zip_code;

  return (
    <Card>
      <Header />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="py-2 pr-3 font-medium">ZIP</th>
              <th className="py-2 pr-3 font-medium">Sent</th>
              <th className="py-2 pr-3 font-medium">Response %</th>
              <th className="py-2 pr-3 font-medium">Close %</th>
              <th className="py-2 pr-3 font-medium">Avg deal</th>
              <th className="py-2 font-medium">Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((r) => {
              const dir = compare(r.response_rate, baseline);
              const isBest = r.zip_code === bestZip;
              return (
                <tr key={r.zip_code}>
                  <td className="py-2.5 pr-3 font-mono text-sm font-medium text-slate-900">
                    <span className="inline-flex items-center gap-1.5">
                      {r.zip_code}
                      {isBest ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          <Star className="h-2.5 w-2.5 fill-current" /> Best
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-600">{r.total_sent}</td>
                  <td className="py-2.5 pr-3 text-slate-600">
                    {(r.response_rate * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 pr-3 text-slate-600">
                    {(r.close_rate * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 pr-3 text-slate-600">
                    {r.avg_deal_value ? formatCurrency(r.avg_deal_value, true) : "—"}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                        dir === "up" && "bg-emerald-50 text-emerald-700",
                        dir === "down" && "bg-red-50 text-red-600",
                        dir === "flat" && "bg-slate-100 text-slate-500",
                      )}
                    >
                      {dir === "up" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : dir === "down" ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      {dir === "up" ? "Above avg" : dir === "down" ? "Below avg" : "At avg"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Aggregated nightly from conversion events.
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

function Header() {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-500">
        ZIP Performance
      </h3>
      <span className="text-[11px] text-slate-400">Updated nightly</span>
    </div>
  );
}

function compare(user: number, platform: number): "up" | "down" | "flat" {
  if (!platform || Math.abs(user - platform) / Math.max(platform, 1e-6) < 0.02) return "flat";
  return user >= platform ? "up" : "down";
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
