export default function LeagueDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 bg-surface-border/50 rounded" />
        <div className="h-4 w-4 bg-surface-border/30 rounded" />
        <div className="h-4 w-24 bg-surface-border/50 rounded" />
      </div>

      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-surface-border rounded-lg" />
          <div className="h-5 w-20 bg-surface-border/50 rounded-full" />
        </div>
        <div className="h-10 w-28 bg-surface-border rounded-lg" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-4 border-b border-surface-border pb-2">
        <div className="h-8 w-20 bg-surface-border rounded" />
        <div className="h-8 w-20 bg-surface-border/50 rounded" />
        <div className="h-8 w-20 bg-surface-border/50 rounded" />
        <div className="h-8 w-20 bg-surface-border/50 rounded" />
      </div>

      {/* Content area skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-surface-alt border border-surface-border"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 bg-surface-border rounded" />
              <div className="h-5 w-16 bg-surface-border/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
