import { Header, Footer } from "@/components/public/Header";

export default function ArchiveLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-app">
      <Header />

      {/* Hero Skeleton */}
      <section className="bg-app-alt/60 border-b border-line py-12 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="h-8 w-72 bg-line/80 rounded-lg" />
          <div className="h-4 w-full max-w-xl bg-line/50 rounded" />
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Filter Bar Skeleton */}
        <div className="mb-10 bg-card p-6 rounded-2xl border border-line shadow-xs animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2 h-11 bg-line/60 rounded-lg" />
            <div className="h-11 bg-line/60 rounded-lg" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-11 bg-line/60 rounded-lg" />
              <div className="h-11 bg-line/60 rounded-lg" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-line">
            <div className="h-4 w-36 bg-line/50 rounded" />
            <div className="h-9 w-28 bg-line/70 rounded-lg" />
          </div>
        </div>

        {/* Worship Folder Cards Skeletons */}
        <div className="space-y-10 animate-pulse">
          {[1, 2].map((folderIndex) => (
            <div
              key={folderIndex}
              className="bg-card rounded-2xl border border-line p-6 sm:p-8 shadow-xs"
            >
              {/* Header Folder Skeleton */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-line/60" />
                  <div className="space-y-2">
                    <div className="h-6 w-64 bg-line/80 rounded" />
                    <div className="h-4 w-48 bg-line/50 rounded" />
                  </div>
                </div>
              </div>

              {/* Document Cards Grid Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((docIndex) => (
                  <div
                    key={docIndex}
                    className="p-5 rounded-xl bg-card border border-line h-44 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-4 w-24 bg-line/60 rounded" />
                        <div className="h-4 w-12 bg-line/50 rounded" />
                      </div>
                      <div className="h-5 w-4/5 bg-line/80 rounded mb-2" />
                      <div className="h-3 w-full bg-line/40 rounded" />
                    </div>
                    <div className="pt-3 border-t border-line flex justify-between">
                      <div className="h-4 w-28 bg-line/60 rounded" />
                      <div className="h-4 w-4 bg-line/60 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
