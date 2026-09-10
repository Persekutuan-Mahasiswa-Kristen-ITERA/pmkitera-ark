export default function DocumentsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-56 bg-line/80 rounded-lg mb-2" />
          <div className="h-4 w-72 bg-line/50 rounded" />
        </div>
        <div className="h-10 w-40 bg-line/80 rounded-lg" />
      </div>

      <div className="p-4 bg-card rounded-xl border border-line flex flex-col sm:flex-row gap-4">
        <div className="h-10 flex-1 bg-line/60 rounded-lg" />
        <div className="h-10 w-36 bg-line/60 rounded-lg" />
      </div>

      <div className="bg-card rounded-xl border border-line overflow-hidden p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-line/50 last:border-0">
            <div className="space-y-2">
              <div className="h-5 w-64 bg-line/80 rounded" />
              <div className="h-3 w-40 bg-line/50 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-16 bg-line/60 rounded" />
              <div className="h-8 w-8 bg-line/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
