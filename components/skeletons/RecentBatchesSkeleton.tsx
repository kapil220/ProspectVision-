export function RecentBatchesSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-5 h-5 w-36 animate-pulse rounded bg-slate-100" />
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 items-center gap-3 py-3">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
            <div className="col-span-2 h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-12 animate-pulse rounded bg-slate-100 justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  );
}
