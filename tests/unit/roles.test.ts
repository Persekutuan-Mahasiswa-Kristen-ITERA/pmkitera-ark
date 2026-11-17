import { describe, expect, it } from "vitest";
import { arkRoleFrom, hasRoleAtLeast, ROLE_HIERARCHY } from "@/lib/auth/roles";

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

describe("arkRoleFrom (PI-CORE my_app_roles)", () => {
  it.each([
    [["admin", "pengurus"], "admin"],
    [["admin"], "admin"],
    [["pengurus"], "pengurus"],
    [["something_else"], null],
    [[], null],
    [null, null],
  ] as const)("%j -> %s", (roles, expected) => {
    expect(arkRoleFrom(roles)).toBe(expected);
  });
});
