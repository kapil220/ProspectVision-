export function PipelineOverviewSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-5 h-5 w-40 animate-pulse rounded bg-slate-100" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            <div className="ml-auto h-4 w-8 animate-pulse rounded bg-slate-100" />
            <div className="h-2 w-32 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
