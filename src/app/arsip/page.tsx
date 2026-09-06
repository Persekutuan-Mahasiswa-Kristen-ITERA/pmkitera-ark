import Link from "next/link";
import { Header, Footer } from "@/components/public/Header";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Search, Calendar, User, ArrowRight, BookOpen, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { listWorshipServices } from "@/services/document-service";
import { listCategories } from "@/services/category-service";

export const revalidate = 300; // Cache 5 menit, di-invalidate saat admin publish/update/delete

const MONTHS = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; year?: string; month?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const categoryId = params.category ? Number(params.category) : undefined;
  const year = params.year ? Number(params.year) : undefined;
  const month = params.month ? Number(params.month) : undefined;
  const search = params.q || undefined;
  const page = params.page ? Number(params.page) : 1;

  const [categories, result] = await Promise.all([
    listCategories(),
    listWorshipServices({ categoryId, year, month, search }, page, 6), // 6 grup per halaman
  ]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen flex flex-col bg-app">
      <Header />

      <section className="bg-app-alt/60 border-b border-line py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary mb-3">Arsip Pelayanan PMK ITERA</h1>
          <p className="text-muted max-w-xl">
            Cari dan unduh bahan pelayanan mingguan. Dikelompokkan per tanggal ibadah — satu ibadah = satu folder (PPT Ibadah, Warta Jemaat, PPT Khotbah).
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Filter Bar */}
        <form method="GET" action="/arsip" className="mb-10 bg-card p-6 rounded-2xl border border-line shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-muted" />
              <Input
                name="q"
                defaultValue={search || ""}
                placeholder="Cari judul dokumen atau nama pengkhotbah..."
                className="pl-9"
              />
            </div>

            <Select name="category" defaultValue={categoryId?.toString() || ""}>
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id.toString()} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <Select name="month" defaultValue={month?.toString() || ""}>
                <option value="">Bulan</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
              <Select name="year" defaultValue={year?.toString() || ""}>
                <option value="">Tahun</option>
                {years.map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
            <p className="text-xs text-muted">
              Menemukan <strong className="text-primary">{result.totalGroups}</strong> ibadah (folder)
            </p>
            <div className="flex gap-2">
              {(categoryId || year || month || search) && (
                <Link href="/arsip">
                  <Button variant="outline" size="sm">
                    Reset Filter
                  </Button>
                </Link>
              )}
              <Button type="submit" size="sm">
                Terapkan Filter
              </Button>
            </div>
          </div>
        </form>

        {/* Result Grid - Grup per Tanggal Ibadah */}
        {result.groups.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-line">
            <BookOpen className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-serif font-bold text-primary mb-1">Tidak ada ibadah ditemukan</h3>
            <p className="text-sm text-muted mb-6">Coba ubah kata kunci pencarian atau reset filter.</p>
            <Link href="/arsip">
              <Button variant="outline">Reset Semua Filter</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {result.groups.map((group) => {
              const formattedDate = new Date(group.event_date).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              const speaker = group.documents[0]?.speaker || "Tim Pelayanan";

              return (
                <div
                  key={group.date}
                  className="bg-card rounded-2xl border border-line p-6 sm:p-8 shadow-xs hover:border-accent/40 transition-colors"
                >
                  {/* Header Folder / Tanggal Ibadah */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-serif font-bold text-primary">
                          Ibadah Jum&apos;at — {formattedDate}
                        </h2>
                        <p className="text-xs text-muted mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> Pengkhotbah / Petugas: {speaker}
                          </span>
                          <span>•</span>
                          <span>{group.documents.length} Berkas Tersedia</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Daftar Dokumen dalam 1 Folder Tanggal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.documents.map((doc: any) => (
                      <Link key={doc.id.toString()} href={`/arsip/${doc.id.toString()}`} className="group">
                        <Card className="h-full p-5 transition-all duration-200 group-hover:border-accent group-hover:shadow-md flex flex-col justify-between bg-card">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-app-alt text-accent border border-line">
                                {doc.category?.name || "Dokumen"}
                              </span>
                              <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-app-alt text-muted border border-line">
                                {doc.file_type.toUpperCase()}
                              </span>
                            </div>
                            <h3 className="font-serif font-bold text-base text-primary group-hover:text-accent transition-colors line-clamp-2 mb-1">
                              {doc.title}
                            </h3>
                            {doc.description && (
                              <p className="text-xs text-muted line-clamp-2 mb-3">
                                {doc.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-3 border-t border-line flex items-center justify-between text-xs font-semibold text-accent">
                            <span className="inline-flex items-center gap-1">
                              <Download className="w-3.5 h-3.5" /> Unduh / Detail
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {result.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {result.page > 1 && (
                  <Link
                    href={`/arsip?${new URLSearchParams({
                      ...(categoryId && { category: categoryId.toString() }),
                      ...(year && { year: year.toString() }),
                      ...(month && { month: month.toString() }),
                      ...(search && { q: search }),
                      page: (result.page - 1).toString(),
                    }).toString()}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-line text-primary hover:bg-app-alt transition-colors text-sm font-medium"
                  >
                    <ChevronLeft className="w-4 h-4" /> Sebelumnya
                  </Link>
                )}
                <span className="px-4 text-sm text-muted">
                  Halaman {result.page} dari {result.totalPages}
                </span>
                {result.page < result.totalPages && (
                  <Link
                    href={`/arsip?${new URLSearchParams({
                      ...(categoryId && { category: categoryId.toString() }),
                      ...(year && { year: year.toString() }),
                      ...(month && { month: month.toString() }),
                      ...(search && { q: search }),
                      page: (result.page + 1).toString(),
                    }).toString()}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-line text-primary hover:bg-app-alt transition-colors text-sm font-medium"
                  >
                    Selanjutnya <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}