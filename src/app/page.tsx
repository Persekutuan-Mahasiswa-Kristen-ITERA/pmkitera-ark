import Link from "next/link";
import { Header, Footer } from "@/components/public/Header";
import { QRCodeButton } from "@/components/public/QRCodeButton";
import { Button } from "@/components/ui/Button";
import { Archive, ArrowRight, Calendar, User, Download } from "lucide-react";
import { listWorshipServices } from "@/services/document-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Ambil 1 ibadah terbaru (minggu ini)
  const { groups: allGroups } = await listWorshipServices({}, 1, 10);
  
  // Cari ibadah minggu ini (berdasarkan hari Jumat terdekat atau yang paling baru)
  // Jika ada ibadah dengan event_date minggu ini, tampilkan itu; kalau tidak, tampilkan yang terbaru
  const today = new Date();
  let currentWeekGroup = allGroups[0] || null;
  
  // Cari grup yang event_date-nya paling dekat dengan hari Jumat minggu ini
  for (const group of allGroups) {
    const eventDate = new Date(group.event_date);
    const diffDays = Math.abs((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) { // dalam 1 minggu
      currentWeekGroup = group;
      break;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-app">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 bg-app-alt/60 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold tracking-wider uppercase mb-6">
              <Archive className="w-3.5 h-3.5" /> Repositori Resmi PMK ITERA
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-primary tracking-tight leading-[1.15] mb-6">
              Arsip & Resource Knowledge <span className="text-accent italic font-normal">Pelayanan</span>
            </h1>
            <p className="text-lg text-muted mb-10 leading-relaxed font-sans max-w-2xl mx-auto">
              Pusat penyimpanan terpusat untuk PPT Ibadah Jum&apos;at, Warta Mingguan, dan PPT Khotbah PMK ITERA. Dikelompokkan per tanggal ibadah secara rapi.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/arsip">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Jelajahi Semua Arsip <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Folder Ibadah Minggu Ini */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-accent mb-2 block">Folder Ibadah Minggu Ini</span>
            <h2 className="text-3xl font-serif font-bold text-primary">Bahan Ibadah Jum&apos;at Terbaru</h2>
          </div>
          <Link href="/arsip" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
            Lihat Arsip Minggu Sebelumnya <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {currentWeekGroup ? (
          <>
            <div className="space-y-12">
              <div key={currentWeekGroup.date} className="bg-card rounded-2xl border border-line p-6 sm:p-8 shadow-xs hover:border-accent/40 transition-colors">
                {/* Header Folder / Tanggal Ibadah */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif font-bold text-primary">
                        Ibadah Jum&apos;at — {new Date(currentWeekGroup.event_date).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </h3>
                      <p className="text-xs text-muted mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Pengkhotbah / Petugas: {currentWeekGroup.documents[0]?.speaker || "Tim Pelayanan"}</span>
                        <span>•</span>
                        <span>{currentWeekGroup.documents.length} Berkas Tersedia</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <QRCodeButton
                      title={`Ibadah Jumat — ${new Date(currentWeekGroup.event_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`}
                      dateStr={new Date(currentWeekGroup.event_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    />
                  </div>
                </div>

                {/* Daftar Dokumen dalam 1 Folder Tanggal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                  {currentWeekGroup.documents.map((doc: any) => (
                    <Link key={doc.id.toString()} href={`/arsip/${doc.id.toString()}`} className="group">
                      <div className="p-4 rounded-xl bg-app border border-line group-hover:border-accent transition-all h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-card text-accent border border-line">
                              {doc.category?.name || "Dokumen"}
                            </span>
                            <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-card text-muted border border-line">
                              {doc.file_type.toUpperCase()}
                            </span>
                          </div>
                          <h4 className="font-serif font-bold text-primary group-hover:text-accent transition-colors line-clamp-2 text-base mb-1">
                            {doc.title}
                          </h4>
                          {doc.description && (
                            <p className="text-xs text-muted line-clamp-2 mb-3">
                              {doc.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-line flex items-center justify-between text-xs font-semibold text-accent">
                          <span className="inline-flex items-center gap-1">
                            <Download className="w-3.5 h-3.5" /> Unduh / Lihat Detail
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href="/arsip">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                  <Archive className="w-4 h-4" /> Lihat Arsip Minggu Sebelumnya
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-card rounded-2xl border border-line">
            <Archive className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-serif font-bold text-primary mb-1">Belum ada bahan ibadah minggu ini dipublikasikan</h3>
            <p className="text-sm text-muted mb-6">Silakan unggah dan publish bahan melalui panel admin, atau cek arsip minggu sebelumnya.</p>
            <Link href="/arsip">
              <Button variant="outline" size="lg" className="gap-2">
                <Archive className="w-4 h-4" /> Jelajahi Arsip
              </Button>
            </Link>
          </div>
        )}

        <div className="mt-12 text-center sm:hidden">
          <Link href="/arsip">
            <Button variant="outline" size="lg" className="w-full gap-2">
              <Archive className="w-4 h-4" /> Lihat Arsip Minggu Sebelumnya
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}