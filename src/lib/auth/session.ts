import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "pmk-ark-session";
const SESSION_DURATION_DAYS = 7;

// secret key minimal 32 bytes (wajib dari env SESSION_SECRET)
function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET wajib diset (minimal 32 karakter) di environment variable."
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: number; // bigint di-cast ke number untuk serialisasi JWT
  email: string;
  role: "admin" | "pengurus" | "jemaat";
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: Number(payload.userId),
      email: String(payload.email),
      role: payload.role as SessionPayload["role"],
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DURATION_DAYS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionFromCookie(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}
