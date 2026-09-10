export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-line/80 rounded-lg" />
          <div className="h-4 w-64 bg-line/50 rounded" />
        </div>
        <div className="h-10 w-32 bg-line/70 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-card rounded-xl border border-line space-y-3">
            <div className="h-4 w-24 bg-line/50 rounded" />
            <div className="h-8 w-16 bg-line/80 rounded" />
          </div>
        ))}
      </div>

      <div className="p-6 bg-card rounded-xl border border-line space-y-4">
        <div className="h-6 w-36 bg-line/70 rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-app-alt/60 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
