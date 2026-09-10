import { Header, Footer } from "@/components/public/Header";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-app">
      <Header />

      {/* Hero Skeleton */}
      <section className="py-20 lg:py-28 bg-app-alt/60 border-b border-line animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <div className="h-6 w-48 bg-line/60 rounded-full mx-auto mb-6" />
          <div className="h-12 w-3/4 bg-line/80 rounded-xl mx-auto mb-4" />
          <div className="h-12 w-1/2 bg-line/60 rounded-xl mx-auto mb-6" />
          <div className="h-4 w-full bg-line/40 rounded mx-auto mb-2" />
          <div className="h-4 w-5/6 bg-line/40 rounded mx-auto mb-10" />
          <div className="h-12 w-48 bg-line/80 rounded-xl mx-auto" />
        </div>
      </section>

      {/* Content Skeleton */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="flex items-end justify-between mb-12 animate-pulse">
          <div>
            <div className="h-4 w-32 bg-line/60 rounded mb-2" />
            <div className="h-8 w-64 bg-line/80 rounded-lg" />
          </div>
          <div className="h-5 w-40 bg-line/60 rounded hidden sm:block" />
        </div>

        {/* Folder Card Skeleton */}
        <div className="bg-card rounded-2xl border border-line p-6 sm:p-8 shadow-xs animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-line/60" />
              <div className="space-y-2">
                <div className="h-6 w-64 bg-line/80 rounded" />
                <div className="h-4 w-48 bg-line/50 rounded" />
              </div>
            </div>
            <div className="h-10 w-28 bg-line/60 rounded-lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-app border border-line h-40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 w-20 bg-line/60 rounded" />
                    <div className="h-4 w-12 bg-line/50 rounded" />
                  </div>
                  <div className="h-5 w-3/4 bg-line/80 rounded mb-2" />
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
      </section>

      <Footer />
    </div>
  );
}
