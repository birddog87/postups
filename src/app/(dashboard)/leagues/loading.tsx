export default function LeaguesLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-surface-border rounded-lg" />
          <div className="h-4 w-56 bg-surface-border/50 rounded" />
        </div>
        <div className="h-10 w-36 bg-surface-border rounded-lg" />
      </div>

      {/* League cards skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-6 rounded-xl bg-surface-alt border border-surface-border"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="h-5 w-28 bg-surface-border rounded" />
                <div className="h-5 w-16 bg-surface-border/50 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-surface-border/50 rounded" />
                <div className="h-4 w-16 bg-surface-border/50 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
