import { NextRequest } from "next/server";
import { getCategoryById, updateCategory, deleteCategory } from "@/services/category-service";
import { requireRole } from "@/services/auth-service";
import { categorySchema } from "@/lib/validation/document";
import { jsonResponse } from "@/lib/utils/json";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const category = await getCategoryById(Number(id));
  if (!category) return jsonResponse({ error: "Kategori tidak ditemukan" }, 404);
  return jsonResponse({ category });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = categorySchema.parse(body);
    const category = await updateCategory(Number(id), parsed);
    return jsonResponse({ message: "Kategori berhasil diperbarui", category });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return jsonResponse({ error: "Akses ditolak" }, 403);
    }
    return jsonResponse({ error: err.message || "Gagal memperbarui kategori" }, 400);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
    const { id } = await ctx.params;
    await deleteCategory(Number(id));
    return jsonResponse({ message: "Kategori berhasil dihapus" });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return jsonResponse({ error: "Akses ditolak" }, 403);
    }
    return jsonResponse({ error: err.message || "Gagal menghapus kategori" }, 400);
  }
}
