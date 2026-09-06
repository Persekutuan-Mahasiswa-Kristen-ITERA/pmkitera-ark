import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionFromCookie,
  SessionPayload,
} from "@/lib/auth/session";
import type { AppRole } from "@/lib/auth/roles";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    throw new Error("Email atau kata sandi salah");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error("Email atau kata sandi salah");
  }

  const role = user.role as AppRole;
  const token = await createSessionToken({
    userId: Number(user.id),
    email: user.email,
    role,
  });
  await setSessionCookie(token);

  return { id: Number(user.id), name: user.name, email: user.email, role };
}

export async function logout() {
  await clearSessionCookie();
}

export async function getCurrentUser(): Promise<SessionPayload | null> {
  return await getSessionFromCookie();
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

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}
