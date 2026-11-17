import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { arkRoleFrom, type AppRole } from "@/lib/auth/roles";
import { ARK_APP_KEY } from "@/lib/picore/config";
import { createPicoreServerClient } from "@/lib/picore/server";

/**
 * Who is calling, from the PI-CORE session (PI-CORE D-16).
 *
 * The session cookie belongs to PI-CORE's Supabase Auth; ARK verifies it with getUser() and asks
 * PI-CORE for the caller's ARK roles (my_app_roles('ark')). The ARK `users` row is only a local
 * record for "uploaded by": it is found by auth_id, else by email (and then linked), else created.
 * Its `role` column mirrors the last known role for display and is never used for decisions.
 */
export interface SessionPayload {
  userId: number; // ARK users.id (bigint as number)
  email: string;
  name: string;
  role: "admin" | "pengurus";
}

export type AccessStatus =
  | { kind: "signed_out" }
  | { kind: "no_access"; email: string; reason: "no_role" | "temporary_password" | "inactive" }
  | { kind: "ok"; user: SessionPayload };

/** One evaluation per request (Server Components and Route Handlers share it). */
export const getAccessStatus = cache(async (): Promise<AccessStatus> => {
  const supabase = await createPicoreServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const authUser = auth.user;
  if (!authUser?.email) return { kind: "signed_out" };
  const email = authUser.email.toLowerCase();

  const [{ data: appRoles, error: rolesError }, { data: member }] = await Promise.all([
    supabase.rpc("my_app_roles", { p_app: ARK_APP_KEY }),
    supabase.from("members").select("full_name, is_active, must_change_password").eq("user_id", authUser.id).maybeSingle(),
  ]);
  if (rolesError) throw new Error(`PI-CORE my_app_roles: ${rolesError.message}`);

  const role = arkRoleFrom(appRoles as string[] | null);
  if (!role) {
    const reason = !member || !member.is_active ? "inactive" : member.must_change_password ? "temporary_password" : "no_role";
    return { kind: "no_access", email, reason };
  }

  const name = (member?.full_name as string | undefined) ?? email;
  const row = await linkUser(authUser.id, email, name, role);
  return { kind: "ok", user: { userId: Number(row.id), email, name, role } };
});

/** Finds the caller's ARK users row (auth_id, then email) and keeps it in step with PI-CORE. */
async function linkUser(authId: string, email: string, name: string, role: "admin" | "pengurus") {
  const byAuth = await prisma.user.findUnique({ where: { auth_id: authId } });
  if (byAuth) {
    if (byAuth.email !== email || byAuth.name !== name || byAuth.role !== role) {
      return prisma.user.update({ where: { id: byAuth.id }, data: { email, name, role } });
    }
    return byAuth;
  }
  const byEmail = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (byEmail) {
    return prisma.user.update({ where: { id: byEmail.id }, data: { auth_id: authId, email, name, role, password: null } });
  }
  return prisma.user.create({ data: { auth_id: authId, email, name, role, password: null } });
}

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const status = await getAccessStatus();
  return status.kind === "ok" ? status.user : null;
}

export async function requireUser(): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireRole(minRole: AppRole): Promise<SessionPayload> {
  const user = await requireUser();
  const order: Record<AppRole, number> = { jemaat: 1, pengurus: 2, admin: 3 };
  if (order[user.role] < order[minRole]) throw new Error("FORBIDDEN");
  return user;
}

/** Ends the PI-CORE session on this site (other PMK apps keep their own sessions). */
export async function logout() {
  const supabase = await createPicoreServerClient();
  await supabase.auth.signOut({ scope: "local" });
}
