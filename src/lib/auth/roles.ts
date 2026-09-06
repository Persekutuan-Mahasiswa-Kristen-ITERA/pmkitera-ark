import { prisma } from "@/lib/db/prisma";

export type AppRole = "admin" | "pengurus" | "jemaat";

export const ROLE_HIERARCHY: Record<AppRole, number> = {
  jemaat: 1,
  pengurus: 2,
  admin: 3,
};

export function hasRoleAtLeast(userRole: AppRole, required: AppRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

export async function getUserFromSession(authId: string) {
  return await prisma.user.findUnique({
    where: { auth_id: authId },
  });
}
