import { NextRequest } from "next/server";
import { listServicePeriods, createServicePeriod } from "@/services/service-period-service";
import { requireRole } from "@/services/auth-service";
import { servicePeriodSchema } from "@/lib/validation/document";
import { jsonResponse } from "@/lib/utils/json";

export async function GET() {
  const periods = await listServicePeriods();
  return jsonResponse({ periods });
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("admin");
    const body = await req.json();
    const parsed = servicePeriodSchema.parse(body);
    const period = await createServicePeriod(parsed);
    return jsonResponse({ message: "Periode pelayanan berhasil dibuat", period }, 201);
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return jsonResponse({ error: "Akses ditolak" }, 403);
    }
    return jsonResponse({ error: err.message || "Gagal membuat periode" }, 400);
  }
}
