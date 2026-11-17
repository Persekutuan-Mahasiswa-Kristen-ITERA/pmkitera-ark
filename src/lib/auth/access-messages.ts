import { PICORE_URL } from "@/lib/picore/config";

/** Why a signed-in PI-CORE account cannot use ARK (from getAccessStatus). Safe for the browser. */
export type AccessReason = "no_role" | "temporary_password" | "inactive";

export function accessReason(raw: string | null | undefined): AccessReason {
  return raw === "temporary_password" || raw === "inactive" ? raw : "no_role";
}

export const ACCESS_MESSAGES: Record<AccessReason, string> = {
  no_role:
    "Akun PI-CORE Anda belum punya akses ke PMK ARK. Akses diatur super admin PI-CORE di menu Integrasi.",
  temporary_password: `Akun Anda masih memakai kata sandi sementara. Ganti dulu di PI-CORE (${PICORE_URL.replace(/^https?:\/\//, "")}), lalu masuk lagi.`,
  inactive: "Akun PI-CORE Anda tidak aktif. Hubungi admin PI-CORE.",
};
