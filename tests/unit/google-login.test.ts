import { describe, expect, it } from "vitest";
import { googleLoginError, handoffMatches, newHandoff, picoreGoogleUrl } from "@/lib/auth/google-login";
import { accessReason } from "@/lib/auth/access-messages";

describe("Google login through PI-CORE", () => {
  it("makes fresh 43-character base64url handoff values", () => {
    const a = newHandoff();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(newHandoff());
  });

  it("sends ARK's app key and the handoff to PI-CORE", () => {
    const u = new URL(picoreGoogleUrl("x".repeat(43)));
    expect(u.pathname).toBe("/auth/google");
    expect(u.searchParams.get("app")).toBe("ark");
    expect(u.searchParams.get("handoff")).toBe("x".repeat(43));
  });

  it("compares the handoff exactly", () => {
    expect(handoffMatches("abc", "abc")).toBe(true);
    expect(handoffMatches("abc", "abd")).toBe(false);
    expect(handoffMatches("abc", "abcd")).toBe(false);
    expect(handoffMatches(undefined, "abc")).toBe(false);
    expect(handoffMatches("abc", null)).toBe(false);
  });

  it("only lets known codes reach the login page", () => {
    expect(googleLoginError("notRegistered")).toBe("notRegistered");
    expect(googleLoginError("<script>")).toBe("failed");
    expect(accessReason("temporary_password")).toBe("temporary_password");
    expect(accessReason("anything")).toBe("no_role");
  });
});
