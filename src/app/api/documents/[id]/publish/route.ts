import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { publishDocument } from "@/services/document-service";
import { requireRole } from "@/services/auth-service";
import { jsonResponse } from "@/lib/utils/json";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
    const { id } = await ctx.params;
    const document = await publishDocument(Number(id));
    revalidatePath("/arsip");
    revalidatePath(`/arsip/${id}`);
    revalidatePath("/");
    return jsonResponse({ message: "Dokumen berhasil dipublikasikan", document });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return jsonResponse({ error: "Akses ditolak" }, 403);
    }
    return jsonResponse({ error: err.message || "Gagal mempublikasikan dokumen" }, 400);
  }
}
