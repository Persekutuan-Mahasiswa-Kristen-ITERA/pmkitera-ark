export type AppRole = "admin" | "pengurus" | "jemaat";

export const ROLE_HIERARCHY: Record<AppRole, number> = {
  jemaat: 1,
  pengurus: 2,
  admin: 3,
};

export function hasRoleAtLeast(userRole: AppRole, required: AppRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

/**
 * The ARK role from PI-CORE's my_app_roles('ark') (PI-CORE D-16). "admin" includes everything
 * "pengurus" may do. No ARK role in PI-CORE means no access to the admin area (null).
 */
export function arkRoleFrom(appRoles: readonly string[] | null | undefined): "admin" | "pengurus" | null {
  if (!appRoles) return null;
  if (appRoles.includes("admin")) return "admin";
  if (appRoles.includes("pengurus")) return "pengurus";
  return null;
}
