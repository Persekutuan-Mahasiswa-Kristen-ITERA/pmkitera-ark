import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import { config, middleware } from "@/middleware";
import { OTHER_SESSION_SECRET, TEST_SESSION_SECRET } from "../helpers/secrets";

const COOKIE = "pmk-ark-session";
const BASE = "https://ark.example.test";

async function sign(
  claims: Record<string, unknown>,
  { secret = TEST_SESSION_SECRET, expiresIn = "7d" }: { secret?: string; expiresIn?: string | number } = {}
) {
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));
}

function request(pathname: string, token?: string) {
  const headers = new Headers();
  if (token) headers.set("cookie", `${COOKIE}=${token}`);
  return new NextRequest(new URL(pathname, BASE), { headers });
}

function expectPassThrough(res: Response) {
  expect(res.headers.get("x-middleware-next")).toBe("1");
  expect(res.headers.get("location")).toBeNull();
}

function expectRedirectToLogin(res: Response) {
  expect(res.status).toBe(307);
  expect(res.headers.get("location")).toBe(`${BASE}/admin/login`);
}

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", TEST_SESSION_SECRET);
});

describe("middleware matcher", () => {
  it("only runs on /admin routes", () => {
    expect(config.matcher).toEqual(["/admin/:path*"]);
  });
});

describe("middleware admin guard", () => {
  it("lets the login page through without a session", async () => {
    expectPassThrough(await middleware(request("/admin/login")));
  });

  it("redirects to login when there is no session cookie", async () => {
    expectRedirectToLogin(await middleware(request("/admin")));
    expectRedirectToLogin(await middleware(request("/admin/documents")));
  });

  it.each(["admin", "pengurus"])("allows a valid %s token", async (role) => {
    const token = await sign({ userId: 1, email: "u@example.test", role });
    expectPassThrough(await middleware(request("/admin/documents", token)));
  });

  it("redirects a valid jemaat token to login", async () => {
    const token = await sign({ userId: 2, email: "j@example.test", role: "jemaat" });
    expectRedirectToLogin(await middleware(request("/admin", token)));
  });

  it("redirects a token without a role", async () => {
    const token = await sign({ userId: 3, email: "x@example.test" });
    expectRedirectToLogin(await middleware(request("/admin", token)));
  });

  it("redirects and clears the cookie for a token signed with another secret", async () => {
    const token = await sign({ userId: 1, email: "u@example.test", role: "admin" }, { secret: OTHER_SESSION_SECRET });
    const res = await middleware(request("/admin", token));
    expectRedirectToLogin(res);
    expect(res.headers.get("set-cookie")).toMatch(new RegExp(`^${COOKIE}=;`));
  });

  it("redirects and clears the cookie for a tampered token", async () => {
    const token = await sign({ userId: 2, email: "j@example.test", role: "jemaat" });
    const [header, body, signature] = token.split(".");
    const claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    const forged = Buffer.from(JSON.stringify({ ...claims, role: "admin" })).toString("base64url");
    const res = await middleware(request("/admin", `${header}.${forged}.${signature}`));
    expectRedirectToLogin(res);
    expect(res.headers.get("set-cookie")).toMatch(new RegExp(`^${COOKIE}=;`));
  });

  it("redirects and clears the cookie for an expired token", async () => {
    const issuedLongAgo = Math.floor(Date.now() / 1000) - 60;
    const token = await sign({ userId: 1, email: "u@example.test", role: "admin" }, { expiresIn: issuedLongAgo });
    const res = await middleware(request("/admin", token));
    expectRedirectToLogin(res);
    expect(res.headers.get("set-cookie")).toMatch(new RegExp(`^${COOKIE}=;`));
  });

  it("rejects a real token when SESSION_SECRET is not configured", async () => {
    const token = await sign({ userId: 1, email: "u@example.test", role: "admin" });
    vi.stubEnv("SESSION_SECRET", "");
    expectRedirectToLogin(await middleware(request("/admin", token)));
  });

  // BUG (not fixed here, see report): when SESSION_SECRET is unset or shorter
  // than 32 chars, the middleware falls back to a hard-coded secret that is
  // visible in the source. A token signed with that public string passes the
  // /admin guard, so a misconfigured deployment lets anyone into the admin UI
  // (the API routes still reject it because session.ts throws instead).
  // Enable this test once the middleware fails closed without a secret.
  it.skip("rejects a token signed with the built-in fallback secret when SESSION_SECRET is missing", async () => {
    vi.stubEnv("SESSION_SECRET", "");
    const token = await sign(
      { userId: 1, email: "u@example.test", role: "admin" },
      { secret: "invalid-dummy-secret-to-prevent-bypass-000000000000" }
    );
    expectRedirectToLogin(await middleware(request("/admin", token)));
  });
});
