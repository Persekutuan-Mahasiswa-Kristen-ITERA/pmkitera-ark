import { logout } from "@/services/auth-service";
import { jsonResponse } from "@/lib/utils/json";

export async function POST() {
  await logout();
  return jsonResponse({ message: "Berhasil keluar" });
}
