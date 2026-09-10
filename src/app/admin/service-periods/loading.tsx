export default function ServicePeriodsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-56 bg-line/80 rounded-lg mb-2" />
          <div className="h-4 w-72 bg-line/50 rounded" />
        </div>
        <div className="h-10 w-40 bg-line/80 rounded-lg" />
      </div>

      <div className="bg-card rounded-xl border border-line p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-line/50 last:border-0">
            <div className="space-y-1">
              <div className="h-5 w-48 bg-line/80 rounded" />
              <div className="h-3 w-32 bg-line/50 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-line/60 rounded" />
              <div className="h-8 w-16 bg-line/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
