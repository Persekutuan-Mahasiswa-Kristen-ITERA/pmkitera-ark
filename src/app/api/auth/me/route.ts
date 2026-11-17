import { getAccessStatus } from "@/services/auth-service";
import { jsonResponse } from "@/lib/utils/json";

/** The admin shell asks who is signed in. `access` explains a refusal (no ARK role, temporary password). */
export async function GET() {
  const status = await getAccessStatus();
  if (status.kind === "ok") return jsonResponse({ user: status.user });
  if (status.kind === "no_access") return jsonResponse({ user: null, access: status.reason });
  return jsonResponse({ user: null });
}
