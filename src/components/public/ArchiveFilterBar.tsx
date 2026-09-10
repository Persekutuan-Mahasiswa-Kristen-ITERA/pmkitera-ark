"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface ArchiveFilterBarProps {
  categories: Array<{ id: number | bigint; name: string }>;
  search?: string;
  categoryId?: number;
  month?: number;
  year?: number;
  totalGroups: number;
  years: number[];
  MONTHS: Array<{ value: string; label: string }>;
}

export function ArchiveFilterBar({
  categories,
  search,
  categoryId,
  month,
  year,
  totalGroups,
  years,
  MONTHS,
}: ArchiveFilterBarProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
  };

  const hasFilter = Boolean(categoryId || year || month || search);

  return (
    <form
      method="GET"
      action="/arsip"
      onSubmit={handleSubmit}
      className="mb-10 bg-card p-6 rounded-2xl border border-line shadow-xs"
    >
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
          Menemukan <strong className="text-primary">{totalGroups}</strong> ibadah (folder)
        </p>
        <div className="flex gap-2">
          {hasFilter && (
            <Link href="/arsip" onClick={() => setIsSubmitting(true)}>
              <Button variant="outline" size="sm" type="button">
                Reset Filter
              </Button>
            </Link>
          )}
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {isSubmitting ? "Memuat..." : "Terapkan Filter"}
          </Button>
        </div>
      </div>
    </form>
  );
}
