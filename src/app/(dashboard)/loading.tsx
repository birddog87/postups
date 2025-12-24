export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-surface-border rounded-lg" />
        <div className="h-4 w-64 bg-surface-border/50 rounded" />
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-xl bg-surface-alt border border-surface-border"
          >
            <div className="space-y-3">
              <div className="h-5 w-32 bg-surface-border rounded" />
              <div className="h-4 w-20 bg-surface-border/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
