import { NextRequest } from "next/server";
import { listCategories, createCategory } from "@/services/category-service";
import { requireRole } from "@/services/auth-service";
import { categorySchema } from "@/lib/validation/document";
import { jsonResponse } from "@/lib/utils/json";

export async function GET() {
  const categories = await listCategories();
  return jsonResponse({ categories });
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("admin");
    const body = await req.json();
    const parsed = categorySchema.parse(body);
    const category = await createCategory(parsed);
    return jsonResponse({ message: "Kategori berhasil dibuat", category }, 201);
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return jsonResponse({ error: "Akses ditolak" }, 403);
    }
    return jsonResponse({ error: err.message || "Gagal membuat kategori" }, 400);
  }
}
