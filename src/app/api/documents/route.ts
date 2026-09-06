import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import {
  listDocuments,
  createDocument,
} from "@/services/document-service";
import { requireRole, getCurrentUser } from "@/services/auth-service";
import { createDocumentSchema } from "@/lib/validation/document";
import { jsonResponse } from "@/lib/utils/json";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user = await getCurrentUser();
  const isStaff = Boolean(user && (user.role === "admin" || user.role === "pengurus"));

  const filter = {
    categoryId: searchParams.get("category") ? Number(searchParams.get("category")) : undefined,
    year: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
    month: searchParams.get("month") ? Number(searchParams.get("month")) : undefined,
    search: searchParams.get("q") || undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : 12,
    includeDrafts: isStaff && searchParams.get("includeDrafts") === "true",
  };

  const result = await listDocuments(filter);
  return jsonResponse(result);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("pengurus");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return jsonResponse({ error: "File wajib diunggah" }, 400);
    }

    const metadata = {
      title: formData.get("title") as string,
      category_id: formData.get("category_id") as string,
      service_period_id: formData.get("service_period_id") as string,
      event_date: formData.get("event_date") as string,
      speaker: formData.get("speaker") as string,
      description: (formData.get("description") as string) || "",
      status: (formData.get("status") as "draft" | "published") || "draft",
    };

    const parsed = createDocumentSchema.parse(metadata);

    const buffer = Buffer.from(await file.arrayBuffer());
    const document = await createDocument(
      parsed,
      {
        buffer,
        contentType: file.type,
        filename: file.name,
        size: file.size,
      },
      user.userId
    );

    revalidatePath("/arsip");
    revalidatePath("/");

    return jsonResponse({ message: "Dokumen berhasil diunggah", document }, 201);
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return jsonResponse({ error: "Akses ditolak" }, 403);
    }
    return jsonResponse({ error: err.message || "Gagal mengunggah dokumen" }, 400);
  }
}
