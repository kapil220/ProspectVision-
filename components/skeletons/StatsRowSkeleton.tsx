export function StatsRowSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-card"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-8 w-24 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
