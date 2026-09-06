import { NextRequest } from "next/server";
import { getDocument, generateDownloadUrl } from "@/services/document-service";
import { getCurrentUser } from "@/services/auth-service";
import { jsonResponse } from "@/lib/utils/json";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = await getCurrentUser();
    const isStaff = user && (user.role === "admin" || user.role === "pengurus");

    const doc = await getDocument(Number(id), !!isStaff);
    if (!doc) return jsonResponse({ error: "Dokumen tidak ditemukan" }, 404);

    const downloadUrl = await generateDownloadUrl(doc.file_path);
    return jsonResponse({ downloadUrl, filename: doc.title, fileType: doc.file_type });
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Gagal membuat URL unduhan" }, 400);
  }
}
