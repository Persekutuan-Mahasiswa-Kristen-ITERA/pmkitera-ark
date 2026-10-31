import bcrypt from "bcryptjs";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createCookieStore, type CookieStoreMock } from "../helpers/cookies";
import { TEST_SESSION_SECRET } from "../helpers/secrets";

let cookieStore: CookieStoreMock;

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
}));

const findUnique = vi.fn();
vi.mock("@/lib/db/prisma", () => ({
  prisma: { user: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));

import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import {
  getCurrentUser,
  hashPassword,
  login,
  logout,
  requireRole,
  requireUser,
} from "@/services/auth-service";

const PLAIN = "correct horse battery staple";
let storedHash: string;

beforeAll(async () => {
  storedHash = await bcrypt.hash(PLAIN, 4);
});

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", TEST_SESSION_SECRET);
  cookieStore = createCookieStore();
  findUnique.mockReset();
});

async function signIn(role: "admin" | "pengurus" | "jemaat") {
  cookieStore.values.set(
    "pmk-ark-session",
    await createSessionToken({ userId: 7, email: `${role}@example.test`, role })
  );
}

describe("login", () => {
  it("rejects an unknown email without touching the cookie", async () => {
    findUnique.mockResolvedValue(null);
    await expect(login("nobody@example.test", PLAIN)).rejects.toThrow("Email atau kata sandi salah");
    expect(findUnique).toHaveBeenCalledWith({ where: { email: "nobody@example.test" } });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("rejects a user that has no password set", async () => {
    findUnique.mockResolvedValue({ id: BigInt(1), email: "a@example.test", password: null, role: "admin" });
    await expect(login("a@example.test", PLAIN)).rejects.toThrow("Email atau kata sandi salah");
  });

  it("rejects a wrong password with the same message", async () => {
    findUnique.mockResolvedValue({ id: BigInt(1), email: "a@example.test", password: storedHash, role: "admin" });
    await expect(login("a@example.test", "wrong password")).rejects.toThrow("Email atau kata sandi salah");
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("returns the user and sets a verifiable session cookie on success", async () => {
    findUnique.mockResolvedValue({
      id: BigInt(12),
      name: "Pengurus",
      email: "p@example.test",
      password: storedHash,
      role: "pengurus",
    });

    const user = await login("p@example.test", PLAIN);
    expect(user).toEqual({ id: 12, name: "Pengurus", email: "p@example.test", role: "pengurus" });

    expect(cookieStore.set).toHaveBeenCalledTimes(1);
    const [name, token] = cookieStore.set.mock.calls[0];
    expect(name).toBe("pmk-ark-session");
    await expect(verifySessionToken(token)).resolves.toEqual({
      userId: 12,
      email: "p@example.test",
      role: "pengurus",
    });
  });
});

describe("logout", () => {
  it("deletes the session cookie", async () => {
    await signIn("admin");
    await logout();
    expect(cookieStore.delete).toHaveBeenCalledWith("pmk-ark-session");
  });
});

describe("requireUser / requireRole", () => {
  it("getCurrentUser returns null when signed out", async () => {
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("requireUser throws UNAUTHORIZED when signed out", async () => {
    await expect(requireUser()).rejects.toThrow("UNAUTHORIZED");
  });

  it("requireRole throws UNAUTHORIZED when signed out", async () => {
    await expect(requireRole("jemaat")).rejects.toThrow("UNAUTHORIZED");
  });

  it.each([
    ["admin", "admin", true],
    ["admin", "pengurus", true],
    ["admin", "jemaat", true],
    ["pengurus", "admin", false],
    ["pengurus", "pengurus", true],
    ["pengurus", "jemaat", true],
    ["jemaat", "admin", false],
    ["jemaat", "pengurus", false],
    ["jemaat", "jemaat", true],
  ] as const)("%s requiring %s -> allowed=%s", async (role, required, allowed) => {
    await signIn(role);
    if (allowed) {
      await expect(requireRole(required)).resolves.toMatchObject({ role });
    } else {
      await expect(requireRole(required)).rejects.toThrow("FORBIDDEN");
    }
  });
});

describe("hashPassword", () => {
  it("produces a bcrypt hash (cost 10) that verifies against the input", async () => {
    const hash = await hashPassword(PLAIN);
    expect(hash).toMatch(/^\$2[aby]\$10\$/);
    expect(hash).not.toContain(PLAIN);
    await expect(bcrypt.compare(PLAIN, hash)).resolves.toBe(true);
    await expect(bcrypt.compare("something else", hash)).resolves.toBe(false);
  });
});
