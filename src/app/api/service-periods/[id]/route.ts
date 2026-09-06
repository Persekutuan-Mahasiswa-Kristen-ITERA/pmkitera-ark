import { NextRequest } from "next/server";
import {
  updateServicePeriod,
  deleteServicePeriod,
} from "@/services/service-period-service";
import { requireRole } from "@/services/auth-service";
import { servicePeriodSchema } from "@/lib/validation/document";
import { jsonResponse } from "@/lib/utils/json";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = servicePeriodSchema.parse(body);
    const period = await updateServicePeriod(Number(id), parsed);
    return jsonResponse({ message: "Periode berhasil diperbarui", period });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return jsonResponse({ error: "Akses ditolak" }, 403);
    }
    return jsonResponse({ error: err.message || "Gagal memperbarui periode" }, 400);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
    const { id } = await ctx.params;
    await deleteServicePeriod(Number(id));
    return jsonResponse({ message: "Periode berhasil dihapus" });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return jsonResponse({ error: "Akses ditolak" }, 403);
    }
    return jsonResponse({ error: err.message || "Gagal menghapus periode" }, 400);
  }
}
