import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCookieStore, type CookieStoreMock } from "../helpers/cookies";
import { OTHER_SESSION_SECRET, TEST_SESSION_SECRET } from "../helpers/secrets";

let cookieStore: CookieStoreMock;

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
}));

import {
  clearSessionCookie,
  createSessionToken,
  getSessionFromCookie,
  setSessionCookie,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/auth/session";

const payload: SessionPayload = { userId: 42, email: "pengurus@example.test", role: "pengurus" };

function decodePart(part: string) {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", TEST_SESSION_SECRET);
  cookieStore = createCookieStore();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createSessionToken / verifySessionToken", () => {
  it("round-trips the payload", async () => {
    const token = await createSessionToken(payload);
    expect(token.split(".")).toHaveLength(3);
    await expect(verifySessionToken(token)).resolves.toEqual(payload);
  });

  it("signs with HS256 and a 7 day expiry", async () => {
    const token = await createSessionToken(payload);
    const [header, body] = token.split(".");
    expect(decodePart(header)).toEqual({ alg: "HS256" });
    const claims = decodePart(body);
    expect(claims.exp - claims.iat).toBe(7 * 24 * 60 * 60);
  });

  it("rejects an expired token", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = await createSessionToken(payload);

    vi.setSystemTime(new Date("2026-01-07T23:59:00Z"));
    await expect(verifySessionToken(token)).resolves.toEqual(payload);

    vi.setSystemTime(new Date("2026-01-08T00:00:01Z"));
    await expect(verifySessionToken(token)).resolves.toBeNull();
  });

  it("rejects a token whose payload was tampered with", async () => {
    const token = await createSessionToken(payload);
    const [header, body, signature] = token.split(".");
    const forgedBody = Buffer.from(
      JSON.stringify({ ...decodePart(body), role: "admin" })
    ).toString("base64url");
    await expect(verifySessionToken(`${header}.${forgedBody}.${signature}`)).resolves.toBeNull();
  });

  it("rejects a token with a modified signature", async () => {
    const token = await createSessionToken(payload);
    const flipped = token.slice(0, -2) + (token.endsWith("AA") ? "BB" : "AA");
    await expect(verifySessionToken(flipped)).resolves.toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    vi.stubEnv("SESSION_SECRET", OTHER_SESSION_SECRET);
    const foreign = await createSessionToken(payload);
    vi.stubEnv("SESSION_SECRET", TEST_SESSION_SECRET);
    await expect(verifySessionToken(foreign)).resolves.toBeNull();
  });

  it("rejects garbage input", async () => {
    await expect(verifySessionToken("")).resolves.toBeNull();
    await expect(verifySessionToken("not-a-jwt")).resolves.toBeNull();
  });

  it("refuses to sign when SESSION_SECRET is missing or shorter than 32 chars", async () => {
    vi.stubEnv("SESSION_SECRET", "");
    await expect(createSessionToken(payload)).rejects.toThrow(/SESSION_SECRET/);
    vi.stubEnv("SESSION_SECRET", "x".repeat(31));
    await expect(createSessionToken(payload)).rejects.toThrow(/SESSION_SECRET/);
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    await expect(createSessionToken(payload)).resolves.toEqual(expect.any(String));
  });

  it("treats every token as invalid when SESSION_SECRET is missing", async () => {
    const token = await createSessionToken(payload);
    vi.stubEnv("SESSION_SECRET", "");
    await expect(verifySessionToken(token)).resolves.toBeNull();
  });
});

describe("session cookie helpers", () => {
  it("stores the token in an httpOnly, lax, 7 day cookie", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await setSessionCookie("token-value");
    expect(cookieStore.set).toHaveBeenCalledWith("pmk-ark-session", "token-value", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  });

  it("does not mark the cookie secure outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    await setSessionCookie("token-value");
    expect(cookieStore.set.mock.calls[0][2]).toMatchObject({ secure: false });
  });

  it("clears the session cookie", async () => {
    cookieStore.values.set("pmk-ark-session", "x");
    await clearSessionCookie();
    expect(cookieStore.delete).toHaveBeenCalledWith("pmk-ark-session");
    expect(cookieStore.values.has("pmk-ark-session")).toBe(false);
  });

  it("returns null without a session cookie", async () => {
    await expect(getSessionFromCookie()).resolves.toBeNull();
  });

  it("returns the payload for a valid session cookie", async () => {
    cookieStore.values.set("pmk-ark-session", await createSessionToken(payload));
    await expect(getSessionFromCookie()).resolves.toEqual(payload);
  });

  it("returns null for an invalid session cookie", async () => {
    cookieStore.values.set("pmk-ark-session", "broken.token.value");
    await expect(getSessionFromCookie()).resolves.toBeNull();
  });
});
