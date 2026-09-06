"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { FileText, FolderKanban, CalendarDays, Archive } from "lucide-react";

interface Stats {
  totalDocuments: number;
  publishedDocuments: number;
  draftDocuments: number;
  totalCategories: number;
  totalPeriods: number;
  recentDocuments: any[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/documents?pageSize=10").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/service-periods").then((r) => r.json()),
    ])
      .then(([docsData, catsData, periodsData]) => {
        const allDocs = docsData.items || [];
        setStats({
          totalDocuments: docsData.total || allDocs.length,
          publishedDocuments: allDocs.filter((d: any) => d.status === "published").length,
          draftDocuments: allDocs.filter((d: any) => d.status === "draft").length,
          totalCategories: catsData.categories?.length || 0,
          totalPeriods: periodsData.periods?.length || 0,
          recentDocuments: allDocs.slice(0, 5),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-4 border-accent border-r-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: "Total Dokumen", value: stats?.totalDocuments ?? 0, icon: FileText, color: "text-blue-600 bg-blue-100" },
    { label: "Dipublikasikan", value: stats?.publishedDocuments ?? 0, icon: Archive, color: "text-emerald-600 bg-emerald-100" },
    { label: "Draft", value: stats?.draftDocuments ?? 0, icon: FileText, color: "text-amber-600 bg-amber-100" },
    { label: "Kategori", value: stats?.totalCategories ?? 0, icon: FolderKanban, color: "text-purple-600 bg-purple-100" },
    { label: "Periode", value: stats?.totalPeriods ?? 0, icon: CalendarDays, color: "text-accent bg-accent/10" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-primary mb-2">Dashboard</h1>
      <p className="text-muted mb-8">Selamat datang kembali! Berikut ringkasan arsip digital PMK ITERA.</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">{c.label}</p>
              <p className="text-2xl font-serif font-bold text-primary mt-1">{c.value}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-serif font-bold text-primary mb-4">Dokumen Terbaru</h2>
        {stats?.recentDocuments.length === 0 ? (
          <p className="text-sm text-muted">Belum ada dokumen.</p>
        ) : (
          <div className="divide-y divide-line">
            {stats?.recentDocuments.map((doc: any) => (
              <div key={doc.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">{doc.title}</p>
                  <p className="text-xs text-muted">
                    {doc.category?.name} • {new Date(doc.event_date).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${doc.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {doc.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
