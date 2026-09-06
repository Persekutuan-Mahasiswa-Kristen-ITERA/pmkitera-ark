import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/public/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Calendar, User, FolderKanban, Download, ArrowLeft, Shield } from "lucide-react";
import { getDocument, generateDownloadUrl } from "@/services/document-service";

export const revalidate = 300; // Cache 5 menit

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const docId = Number(id);
  if (Number.isNaN(docId)) notFound();

  const doc = await getDocument(docId, false);
  if (!doc) notFound();

  let downloadUrl = "#";
  try {
    downloadUrl = await generateDownloadUrl(doc.file_path);
  } catch {
    downloadUrl = "#";
  }

  return (
    <div className="min-h-screen flex flex-col bg-app">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-6">
          <Link href="/arsip" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-accent">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Arsip
          </Link>
        </div>

        <Card className="p-8 sm:p-10 bg-card">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-md bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider">
              {doc.category.name}
            </span>
            <span className="px-3 py-1 rounded-md bg-app-alt text-muted text-xs font-semibold uppercase tracking-wider">
              {doc.file_type.toUpperCase()}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary mb-6 leading-tight">
            {doc.title}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-y border-line mb-8 text-sm text-muted">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-accent" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted/70">Tanggal Kegiatan</p>
                <p className="font-medium text-primary">
                  {new Date(doc.event_date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-accent" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted/70">Pengisi / Pelayan</p>
                <p className="font-medium text-primary">{doc.speaker}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <FolderKanban className="w-4 h-4 text-accent" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted/70">Periode Pelayanan</p>
                <p className="font-medium text-primary">{(doc as any).service_period?.name || "-"}</p>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="font-serif font-bold text-lg text-primary mb-3">Deskripsi / Catatan Dokumen</h2>
            <div className="text-muted leading-relaxed whitespace-pre-wrap bg-app-alt/30 p-6 rounded-xl border border-line">
              {doc.description || "Tidak ada deskripsi tambahan untuk dokumen ini."}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-line">
            <div className="text-xs text-muted flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" /> Terverifikasi aman & resmi dari PMK ITERA
            </div>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2">
                <Download className="w-4 h-4" /> Unduh Dokumen ({doc.file_type.toUpperCase()})
              </Button>
            </a>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
