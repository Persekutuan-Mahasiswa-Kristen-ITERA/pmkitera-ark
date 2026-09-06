"use client";

import { useEffect, useState } from "react";
import { Search, Trash2, Eye, EyeOff, Download, Filter } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface Category { id: number; name: string; }
interface Document {
  id: number;
  title: string;
  speaker: string;
  event_date: string;
  status: "draft" | "published";
  file_type: string;
  category: Category;
}

interface Props {
  categories: Category[];
  refreshTrigger?: number;
}

export function DocumentList({ categories, refreshTrigger }: Props) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Document | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("q", search);
    if (categoryFilter) params.append("category", categoryFilter);
    if (statusFilter) params.append("includeDrafts", "true");
    // Tambah includeDrafts otomatis karena ini dashboard admin
    params.append("includeDrafts", "true");
    if (statusFilter) params.append("status", statusFilter);

    const res = await fetch(`/api/documents?${params}`);
    const data = await res.json();
    // Filter di client untuk status (API tidak support filter status langsung, hanya category+year+month)
    let items = data.items || [];
    if (statusFilter) items = items.filter((d: Document) => d.status === statusFilter);
    setDocs(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter, statusFilter, refreshTrigger]);

  const handlePublishToggle = async (doc: Document) => {
    const newStatus = doc.status === "published" ? "unpublish" : "publish";
    await fetch(`/api/documents/${doc.id}/${newStatus}`, { method: "POST" });
    fetchDocs();
  };

  const handleDelete = async (doc: Document) => {
    await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    setConfirmDelete(null);
    fetchDocs();
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <h2 className="text-xl font-serif font-bold text-primary">Daftar Dokumen</h2>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Filter className="w-4 h-4" />
          <span>{docs.length} dokumen</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul atau pengisi..."
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </Select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted">Memuat...</div>
      ) : docs.length === 0 ? (
        <div className="py-12 text-center text-muted">Tidak ada dokumen ditemukan.</div>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted bg-app-alt">
                <th className="px-6 py-3 font-semibold">Judul</th>
                <th className="px-6 py-3 font-semibold">Kategori</th>
                <th className="px-6 py-3 font-semibold">Tanggal</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-app-alt/40">
                  <td className="px-6 py-4">
                    <p className="font-medium text-primary line-clamp-1">{doc.title}</p>
                    <p className="text-xs text-muted mt-0.5">{doc.speaker} • {doc.file_type.toUpperCase()}</p>
                  </td>
                  <td className="px-6 py-4 text-muted">{doc.category?.name}</td>
                  <td className="px-6 py-4 text-muted">
                    {new Date(doc.event_date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={doc.status === "published" ? "published" : "draft"}>
                      {doc.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        onClick={async (e) => {
                          e.preventDefault();
                          const res = await fetch(`/api/documents/${doc.id}/download`);
                          const data = await res.json();
                          if (data.downloadUrl) window.open(data.downloadUrl, "_blank");
                        }}
                        title="Download"
                        className="p-2 rounded-md text-muted hover:bg-app-alt hover:text-primary"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handlePublishToggle(doc)}
                        title={doc.status === "published" ? "Unpublish" : "Publish"}
                        className="p-2 rounded-md text-muted hover:bg-app-alt hover:text-primary"
                      >
                        {doc.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(doc)}
                        title="Hapus"
                        className="p-2 rounded-md text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Hapus Dokumen?"
      >
        {confirmDelete && (
          <div>
            <p className="text-sm text-muted mb-1">Dokumen:</p>
            <p className="font-medium text-primary mb-4">{confirmDelete.title}</p>
            <p className="text-sm text-red-700 mb-6">
              Tindakan ini tidak dapat dibatalkan. File di Cloudflare R2 juga akan dihapus.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                Batal
              </Button>
              <Button variant="danger" onClick={() => handleDelete(confirmDelete)}>
                Hapus Permanen
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
