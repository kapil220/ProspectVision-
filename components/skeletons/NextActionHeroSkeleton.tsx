export function NextActionHeroSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-ivory-50 p-8 md:p-12">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="space-y-4">
          <div className="h-3 w-16 animate-pulse rounded-full bg-line" />
          <div className="h-10 w-3/4 animate-pulse rounded-lg bg-line" />
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-line" />
          <div className="h-10 w-44 animate-pulse rounded-full bg-line" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-line/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
