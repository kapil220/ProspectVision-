export function FollowUpsDueSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-5 h-5 w-32 animate-pulse rounded bg-slate-100" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
          >
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="h-8 w-16 animate-pulse rounded-md bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
