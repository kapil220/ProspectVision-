import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { CRMStage } from "@/types";

type Props = { userId: string };

const STAGES: {
  id: Exclude<CRMStage, "closed_won" | "closed_lost">;
  label: string;
  dot: string;
  bar: string;
}[] = [
  { id: "postcard_sent", label: "Postcard Sent", dot: "bg-slate-400", bar: "bg-slate-400" },
  { id: "delivered", label: "Delivered", dot: "bg-blue-500", bar: "bg-blue-500" },
  { id: "page_viewed", label: "Page Viewed", dot: "bg-violet-500", bar: "bg-violet-500" },
  { id: "responded", label: "Responded", dot: "bg-amber-500", bar: "bg-amber-500" },
  { id: "appointment_set", label: "Appointment Set", dot: "bg-orange-500", bar: "bg-orange-500" },
  { id: "quoted", label: "Quoted", dot: "bg-brand", bar: "bg-brand" },
];

export async function PipelineOverview({ userId }: Props) {
  const supabase = createClient();
  const { data } = await supabase
    .from("leads")
    .select("current_stage")
    .eq("profile_id", userId);

  const counts = new Map<string, number>();
  (data ?? []).forEach((row) => {
    counts.set(row.current_stage, (counts.get(row.current_stage) ?? 0) + 1);
  });
  const max = Math.max(1, ...STAGES.map((s) => counts.get(s.id) ?? 0));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Pipeline Overview
        </h2>
        <Link
          href="/crm"
          className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
        >
          View all leads <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="space-y-4">
        {STAGES.map((s) => {
          const count = counts.get(s.id) ?? 0;
          const pct = Math.round((count / max) * 100);
          return (
            <div key={s.id} className="flex items-center gap-3">
              <span className={cn("h-2.5 w-2.5 rounded-full", s.dot)} />
              <span className="text-sm font-medium text-slate-700">
                {s.label}
              </span>
              <span className="ml-auto inline-flex h-5 min-w-[28px] items-center justify-center rounded-full bg-slate-100 px-2 font-mono text-xs font-semibold text-slate-700">
                {count}
              </span>
              <div className="relative h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("absolute inset-y-0 left-0 rounded-full", s.bar)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
