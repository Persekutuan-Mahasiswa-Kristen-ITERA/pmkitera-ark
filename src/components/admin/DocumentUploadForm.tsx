"use client";

import { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";

interface Category {
  id: number;
  name: string;
  slug: string;
}
interface ServicePeriod {
  id: number;
  name: string;
}

interface Props {
  categories: Category[];
  periods: ServicePeriod[];
  onUploadSuccess?: () => void;
}

const ACCEPTED_TYPES = [
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/pdf",
];
const MAX_SIZE = 50 * 1024 * 1024;

export function DocumentUploadForm({ categories, periods, onUploadSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    category_id: "",
    service_period_id: "",
    event_date: new Date().toISOString().substring(0, 10),
    speaker: "",
    description: "",
    status: "draft" as "draft" | "published",
  });

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) return "Tipe file harus .pptx atau .pdf";
    if (f.size > MAX_SIZE) return `Ukuran file maksimal 50MB (file: ${(f.size / 1024 / 1024).toFixed(1)}MB)`;
    return null;
  };

  const handleFileChange = (f: File | null) => {
    setError("");
    if (!f) {
      setFile(null);
      return;
    }
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setFile(f);
    // Auto-fill title dari nama file (tanpa ekstensi)
    if (!form.title) {
      const baseName = f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      setForm((prev) => ({ ...prev, title: baseName }));
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileChange(dropped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Wajib mengunggah file dokumen.");
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", form.title);
      formData.append("category_id", form.category_id);
      formData.append("service_period_id", form.service_period_id);
      formData.append("event_date", form.event_date);
      formData.append("speaker", form.speaker);
      formData.append("description", form.description);
      formData.append("status", form.status);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah");

      setSuccess(`Dokumen "${form.title}" berhasil diunggah sebagai ${form.status === "published" ? "Published" : "Draft"}!`);
      setFile(null);
      setForm({
        title: "",
        category_id: "",
        service_period_id: "",
        event_date: new Date().toISOString().substring(0, 10),
        speaker: "",
        description: "",
        status: "draft",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUploadSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fileSizeLabel = file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "";

  return (
    <Card className="p-6">
      <h2 className="text-xl font-serif font-bold text-primary mb-6">Upload Dokumen Baru</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Drag & Drop Zone */}
        <div>
          <Label required>File Dokumen</Label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragOver
                    ? "border-accent bg-accent/5"
                    : file
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-line bg-app-alt/40 hover:bg-app-alt"
                }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pptx,.pdf"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? (
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2" />
                <p className="font-medium text-primary">{file.name}</p>
                <p className="text-sm text-muted">{fileSizeLabel} • {file.type === "application/pdf" ? "PDF" : "PPTX"}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="mt-3 text-xs text-red-600 hover:underline"
                >
                  Hapus file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <UploadCloud className={`w-10 h-10 ${isDragOver ? "text-accent" : "text-muted"} mb-2`} />
                <p className="font-medium text-primary">
                  Tarik & letakkan file di sini, atau <span className="text-accent underline">klik untuk pilih</span>
                </p>
                <p className="text-xs text-muted mt-1">.pptx atau .pdf • Maks 50MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label required>Judul</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: PPT Ibadah Jumat - Hidup Bermakna"
              maxLength={200}
            />
          </div>

          <div>
            <Label required>Kategori</Label>
            <Select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              required
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label required>Periode Pelayanan</Label>
            <Select
              value={form.service_period_id}
              onChange={(e) => setForm({ ...form, service_period_id: e.target.value })}
              required
            >
              <option value="">-- Pilih Periode --</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label required>Tanggal Kegiatan</Label>
            <Input
              type="date"
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label required>Pengisi / Pengkhotbah</Label>
            <Input
              value={form.speaker}
              onChange={(e) => setForm({ ...form, speaker: e.target.value })}
              placeholder="Nama pengkhotbah atau pelayan"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Deskripsi Singkat</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Opsional: topik, ringkasan, atau catatan penting."
              maxLength={2000}
            />
          </div>

          <div>
            <Label required>Status Publikasi</Label>
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })}
            >
              <option value="draft">Draft (hanya pengurus & admin)</option>
              <option value="published">Published (tampil di publik)</option>
            </Select>
            <p className="mt-1 text-xs text-muted">
              Default: Draft. Admin bisa publish nanti dari halaman daftar.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
            <FileWarning className="w-4 h-4 mt-0.5" /> {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="flex items-center justify-end pt-2 border-t border-line">
          <Button type="submit" size="lg" isLoading={isLoading}>
            Unggah Dokumen
          </Button>
        </div>
      </form>
    </Card>
  );
}
