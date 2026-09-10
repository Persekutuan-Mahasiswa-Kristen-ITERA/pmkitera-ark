import { Header, Footer } from "@/components/public/Header";
import { Card } from "@/components/ui/Card";

export default function DocumentDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-app">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-6 animate-pulse">
          <div className="h-4 w-40 bg-line/60 rounded" />
        </div>

        <Card className="p-8 sm:p-10 bg-card animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-6 w-24 bg-line/70 rounded-md" />
            <div className="h-6 w-16 bg-line/50 rounded-md" />
          </div>

          <div className="h-10 w-3/4 bg-line/80 rounded-lg mb-6" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-y border-line mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-line/60 rounded" />
                <div className="space-y-1">
                  <div className="h-3 w-20 bg-line/40 rounded" />
                  <div className="h-4 w-28 bg-line/70 rounded" />
                </div>
              </div>
            ))}
          </div>

          <div className="mb-10 space-y-3">
            <div className="h-6 w-48 bg-line/70 rounded" />
            <div className="h-28 bg-app-alt/60 rounded-xl border border-line p-6" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-line">
            <div className="h-4 w-56 bg-line/50 rounded" />
            <div className="h-12 w-48 bg-line/80 rounded-xl w-full sm:w-auto" />
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
