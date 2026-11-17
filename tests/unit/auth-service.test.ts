import { beforeEach, describe, expect, it, vi } from "vitest";

// Fake PI-CORE session: getUser, my_app_roles and the caller's own members row.
const { state, signOut, rpc } = vi.hoisted(() => {
  const state: {
  user: { id: string; email: string } | null;
  roles: string[] | null;
  rolesError: { message: string } | null;
  member: { full_name: string; is_active: boolean; must_change_password: boolean } | null;
  } = { user: null, roles: [], rolesError: null, member: null };
  return { state, signOut: vi.fn(), rpc: vi.fn() };
});

vi.mock("@/lib/picore/server", () => ({
  createPicoreServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }), signOut },
    rpc: (...args: unknown[]) => {
      rpc(...args);
      return Promise.resolve({ data: state.roles, error: state.rolesError });
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.member }) }) }) }),
  }),
}));

const { user } = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
}));
vi.mock("@/lib/db/prisma", () => ({ prisma: { user } }));

// React's cache() is per request in Next; in tests every call is a fresh request.
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T>(fn: T) => fn }));

import { getAccessStatus, getCurrentUser, logout, requireRole, requireUser } from "@/services/auth-service";

const ACTIVE = { full_name: "Febrian", is_active: true, must_change_password: false };

beforeEach(() => {
  state.user = { id: "auth-1", email: "Febrian@Example.com" };
  state.roles = [];
  state.rolesError = null;
  state.member = ACTIVE;
  Object.values(user).forEach((f) => f.mockReset());
  signOut.mockReset();
  rpc.mockReset();
});

describe("getAccessStatus", () => {
  it("is signed_out without a PI-CORE session", async () => {
    state.user = null;
    await expect(getAccessStatus()).resolves.toEqual({ kind: "signed_out" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("asks PI-CORE for the ARK roles of the caller", async () => {
    state.roles = ["pengurus"];
    user.findUnique.mockResolvedValue({ id: BigInt(7), email: "febrian@example.com", name: "Febrian", role: "pengurus" });
    await getAccessStatus();
    expect(rpc).toHaveBeenCalledWith("my_app_roles", { p_app: "ark" });
  });

  it.each([
    [ACTIVE, "no_role"],
    [{ ...ACTIVE, must_change_password: true }, "temporary_password"],
    [{ ...ACTIVE, is_active: false }, "inactive"],
    [null, "inactive"],
  ] as const)("explains a refusal (member %j -> %s) and touches no ARK row", async (member, reason) => {
    state.member = member;
    await expect(getAccessStatus()).resolves.toEqual({ kind: "no_access", email: "febrian@example.com", reason });
    expect(user.findUnique).not.toHaveBeenCalled();
    expect(user.create).not.toHaveBeenCalled();
  });

  it("throws when PI-CORE cannot answer (never guesses access)", async () => {
    state.rolesError = { message: "boom" };
    await expect(getAccessStatus()).rejects.toThrow(/my_app_roles/);
  });
});

describe("ARK users row", () => {
  it("reuses the row linked by auth_id without writing when nothing changed", async () => {
    state.roles = ["admin", "pengurus"];
    user.findUnique.mockResolvedValue({ id: BigInt(7), email: "febrian@example.com", name: "Febrian", role: "admin" });
    await expect(getCurrentUser()).resolves.toEqual({ userId: 7, email: "febrian@example.com", name: "Febrian", role: "admin" });
    expect(user.update).not.toHaveBeenCalled();
  });

  it("links an existing row by email (case-insensitive) and clears its old password", async () => {
    state.roles = ["pengurus"];
    user.findUnique.mockResolvedValue(null);
    user.findFirst.mockResolvedValue({ id: BigInt(3) });
    user.update.mockResolvedValue({ id: BigInt(3) });
    await expect(getCurrentUser()).resolves.toMatchObject({ userId: 3, role: "pengurus" });
    expect(user.findFirst).toHaveBeenCalledWith({ where: { email: { equals: "febrian@example.com", mode: "insensitive" } } });
    expect(user.update).toHaveBeenCalledWith({
      where: { id: BigInt(3) },
      data: { auth_id: "auth-1", email: "febrian@example.com", name: "Febrian", role: "pengurus", password: null },
    });
  });

  it("creates a row for a first-time user", async () => {
    state.roles = ["admin"];
    user.findUnique.mockResolvedValue(null);
    user.findFirst.mockResolvedValue(null);
    user.create.mockResolvedValue({ id: BigInt(9) });
    await expect(getCurrentUser()).resolves.toMatchObject({ userId: 9, role: "admin" });
    expect(user.create).toHaveBeenCalledWith({
      data: { auth_id: "auth-1", email: "febrian@example.com", name: "Febrian", role: "admin", password: null },
    });
  });
});

describe("requireUser / requireRole / logout", () => {
  it("refuses without ARK access", async () => {
    await expect(requireUser()).rejects.toThrow("UNAUTHORIZED");
  });

  it("enforces admin over pengurus", async () => {
    state.roles = ["pengurus"];
    user.findUnique.mockResolvedValue({ id: BigInt(7), email: "febrian@example.com", name: "Febrian", role: "pengurus" });
    await expect(requireRole("pengurus")).resolves.toMatchObject({ role: "pengurus" });
    await expect(requireRole("admin")).rejects.toThrow("FORBIDDEN");
  });

  it("signs out of PI-CORE on this site only", async () => {
    await logout();
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
