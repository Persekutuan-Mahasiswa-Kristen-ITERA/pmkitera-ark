import { getCurrentUser } from "@/services/auth-service";
import { jsonResponse } from "@/lib/utils/json";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonResponse({ user: null });
  return jsonResponse({ user });
}
