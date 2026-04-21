export function PlatformBenchmarksSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-6 w-6 animate-pulse rounded bg-slate-100" />
        <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
