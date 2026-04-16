import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type DeltaDir = "up" | "down" | "flat";

type StatCardProps = {
  label: string;
  value: string | number;
  delta?: string;
  deltaDir?: DeltaDir;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
};

export function StatCard({
  label,
  value,
  delta,
  deltaDir = "flat",
  icon: Icon,
  iconBg,
  iconColor,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
            <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card transition-shadow hover:shadow-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-900">
            {value}
          </p>
          {delta ? (
            <span
              className={cn(
                "mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                deltaDir === "up" && "bg-green-50 text-green-700",
                deltaDir === "down" && "bg-red-50 text-red-600",
                deltaDir === "flat" && "bg-slate-100 text-slate-600",
              )}
            >
              {deltaDir === "up" ? "↑ " : deltaDir === "down" ? "↓ " : ""}
              {delta}
            </span>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            iconBg,
          )}
        >
          <Icon
            className={cn("h-[22px] w-[22px]", iconColor)}
            strokeWidth={1.75}
          />
        </div>
      </div>
    </div>
  );
}
