"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";

interface Period {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

export default function AdminServicePeriodsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Period | null>(null);

  const [form, setForm] = useState({
    name: "2025/2026",
    start_date: "2025-07-01",
    end_date: "2026-06-30",
  });

  const fetchPeriods = async () => {
    setLoading(true);
    const res = await fetch("/api/service-periods");
    const data = await res.json();
    setPeriods(data.periods || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/service-periods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal membuat periode");
      return;
    }
    setIsModalOpen(false);
    fetchPeriods();
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/service-periods/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Gagal menghapus");
      return;
    }
    setDeleteTarget(null);
    fetchPeriods();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Kelola Periode Pelayanan</h1>
          <p className="text-sm text-muted mt-1">Periode kepengurusan (misal: 2025/2026) untuk pengarsipan rapi.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Tambah Periode
        </Button>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="py-12 text-center text-muted">Memuat...</div>
        ) : periods.length === 0 ? (
          <div className="py-12 text-center text-muted">Belum ada periode pelayanan.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {periods.map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-line bg-app-alt/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-serif font-bold text-primary text-base flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-accent" /> {p.name}
                    </span>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted">
                    Mulai: {new Date(p.start_date).toLocaleDateString("id-ID")}
                  </p>
                  <p className="text-xs text-muted">
                    Selesai: {new Date(p.end_date).toLocaleDateString("id-ID")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Periode Pelayanan">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label required>Nama Periode</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: 2025/2026"
              required
            />
          </div>
          <div>
            <Label required>Tanggal Mulai</Label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              required
            />
          </div>
          <div>
            <Label required>Tanggal Selesai</Label>
            <Input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Periode?">
        {deleteTarget && (
          <div>
            <p className="text-sm text-muted mb-4">
              Apakah Anda yakin ingin menghapus periode <strong className="text-primary">{deleteTarget.name}</strong>?
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
