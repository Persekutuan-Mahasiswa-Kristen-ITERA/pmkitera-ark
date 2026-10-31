import { describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
vi.mock("@/lib/db/prisma", () => ({
  prisma: { user: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));

import { getUserFromSession, hasRoleAtLeast, ROLE_HIERARCHY } from "@/lib/auth/roles";

describe("ROLE_HIERARCHY", () => {
  it("orders jemaat < pengurus < admin", () => {
    expect(ROLE_HIERARCHY.jemaat).toBeLessThan(ROLE_HIERARCHY.pengurus);
    expect(ROLE_HIERARCHY.pengurus).toBeLessThan(ROLE_HIERARCHY.admin);
  });
});

describe("hasRoleAtLeast", () => {
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
  ] as const)("%s vs required %s -> %s", (role, required, expected) => {
    expect(hasRoleAtLeast(role, required)).toBe(expected);
  });
});

describe("getUserFromSession", () => {
  it("looks the user up by auth_id", async () => {
    findUnique.mockResolvedValue({ id: BigInt(1) });
    await expect(getUserFromSession("auth-123")).resolves.toEqual({ id: BigInt(1) });
    expect(findUnique).toHaveBeenCalledWith({ where: { auth_id: "auth-123" } });
  });
});
