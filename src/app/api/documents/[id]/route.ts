import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getDocument,
  updateDocument,
  deleteDocument,
} from "@/services/document-service";
import { requireRole, getCurrentUser } from "@/services/auth-service";
import { updateDocumentSchema } from "@/lib/validation/document";
import { jsonResponse } from "@/lib/utils/json";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  const isStaff = user && (user.role === "admin" || user.role === "pengurus");
  const doc = await getDocument(Number(id), !!isStaff);
  if (!doc) return jsonResponse({ error: "Dokumen tidak ditemukan" }, 404);
  return jsonResponse({ document: doc });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("pengurus");
    const { id } = await ctx.params;

    const contentType = req.headers.get("content-type") || "";
    let metadata: any;
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      file = formData.get("file") as File | null;
      metadata = {
        title: formData.get("title") as string,
        category_id: formData.get("category_id") as string,
        service_period_id: formData.get("service_period_id") as string,
        event_date: formData.get("event_date") as string,
        speaker: formData.get("speaker") as string,
        description: (formData.get("description") as string) || "",
        status: (formData.get("status") as "draft" | "published") || undefined,
      };
    } else {
      metadata = await req.json();
    }

    const parsed = updateDocumentSchema.parse(metadata);

    let uploadedFile;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      uploadedFile = {
        buffer,
        contentType: file.type,
        filename: file.name,
        size: file.size,
      };
    }

    const document = await updateDocument(Number(id), parsed, undefined, uploadedFile);
    revalidatePath("/arsip");
    revalidatePath(`/arsip/${id}`);
    revalidatePath("/");
    return jsonResponse({ message: "Dokumen berhasil diperbarui", document });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return jsonResponse({ error: "Akses ditolak" }, 403);
    }
    return jsonResponse({ error: err.message || "Gagal memperbarui dokumen" }, 400);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
    const { id } = await ctx.params;
    await deleteDocument(Number(id));
    revalidatePath("/arsip");
    revalidatePath("/");
    return jsonResponse({ message: "Dokumen berhasil dihapus" });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return jsonResponse({ error: "Akses ditolak" }, 403);
    }
    return jsonResponse({ error: err.message || "Gagal menghapus dokumen" }, 400);
  }
}
