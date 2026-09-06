"use client";

import { useState, useEffect } from "react";
import { DocumentUploadForm } from "@/components/admin/DocumentUploadForm";
import { DocumentList } from "@/components/admin/DocumentList";
import { Plus, List } from "lucide-react";

interface Category { id: number; name: string; slug: string; }
interface Period { id: number; name: string; }

export default function AdminDocumentsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [view, setView] = useState<"list" | "upload">("list");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/service-periods").then((r) => r.json()),
    ]).then(([cats, per]) => {
      setCategories(cats.categories || []);
      setPeriods(per.periods || []);
    });
  }, []);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Kelola Dokumen</h1>
          <p className="text-sm text-muted mt-1">Unggah, edit, dan publikasikan dokumen pelayanan.</p>
        </div>
        <div className="inline-flex bg-app-alt rounded-lg p-1">
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              view === "list" ? "bg-card text-primary shadow-xs" : "text-muted"
            }`}
          >
            <List className="w-4 h-4" /> Daftar
          </button>
          <button
            onClick={() => setView("upload")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              view === "upload" ? "bg-card text-primary shadow-xs" : "text-muted"
            }`}
          >
            <Plus className="w-4 h-4" /> Upload Baru
          </button>
        </div>
      </div>

      {view === "upload" ? (
        <DocumentUploadForm
          categories={categories}
          periods={periods}
          onUploadSuccess={() => {
            setRefresh((p) => p + 1);
            setView("list");
          }}
        />
      ) : (
        <DocumentList
          categories={categories}
          refreshTrigger={refresh}
        />
      )}
    </div>
  );
}
