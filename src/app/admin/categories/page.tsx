"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, FolderKanban } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const fetchCats = async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal membuat kategori");
      return;
    }
    setForm({ name: "", slug: "", description: "" });
    setIsModalOpen(false);
    fetchCats();
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Gagal menghapus");
      return;
    }
    setDeleteTarget(null);
    fetchCats();
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Kelola Kategori</h1>
          <p className="text-sm text-muted mt-1">Master data kategori dokumen (misal: Ibadah Jumat, Warta).</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Kategori
        </Button>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="py-12 text-center text-muted">Memuat...</div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center text-muted">Belum ada kategori.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 rounded-xl border border-line bg-app-alt/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-serif font-bold text-primary text-base flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-accent" /> {cat.name}
                    </span>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted mb-1 font-mono">slug: {cat.slug}</p>
                  <p className="text-sm text-muted">{cat.description || "Tidak ada deskripsi."}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Kategori Baru">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label required>Nama Kategori</Label>
            <Input
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm({ ...form, name, slug: generateSlug(name) });
              }}
              placeholder="Contoh: Ibadah Jumat"
              required
            />
          </div>
          <div>
            <Label required>Slug URL</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="ibadah-jumat"
              required
            />
          </div>
          <div>
            <Label>Deskripsi</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Penjelasan singkat kategori"
            />
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Kategori?">
        {deleteTarget && (
          <div>
            <p className="text-sm text-muted mb-4">
              Apakah Anda yakin ingin menghapus kategori <strong className="text-primary">{deleteTarget.name}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
              <Button variant="danger" onClick={() => handleDelete(deleteTarget.id)}>Hapus</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
