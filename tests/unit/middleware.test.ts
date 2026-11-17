import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getClaims = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getClaims: () => getClaims() } }),
}));

import { config, middleware } from "@/middleware";

const BASE = "https://ark.example.test";
const request = (pathname: string) => new NextRequest(new URL(pathname, BASE));

function expectPassThrough(res: Response) {
  expect(res.headers.get("x-middleware-next")).toBe("1");
  expect(res.headers.get("location")).toBeNull();
}
function expectRedirectToLogin(res: Response) {
  expect(res.status).toBe(307);
  expect(res.headers.get("location")).toBe(`${BASE}/admin/login`);
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_PICORE_SUPABASE_URL", "https://picore.example.test");
  vi.stubEnv("NEXT_PUBLIC_PICORE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  getClaims.mockReset();
});

describe("middleware (PI-CORE session gate)", () => {
  it("only runs for /admin", () => {
    expect(config.matcher).toEqual(["/admin/:path*"]);
  });

  it("lets the login page through without a session", async () => {
    expectPassThrough(await middleware(request("/admin/login")));
    expect(getClaims).not.toHaveBeenCalled();
  });

  it("lets a verified PI-CORE session through", async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
    expectPassThrough(await middleware(request("/admin/documents")));
  });

  it("sends people without a session to the login page", async () => {
    getClaims.mockResolvedValue({ data: null });
    expectRedirectToLogin(await middleware(request("/admin/documents")));
  });

  it("treats a failing verification as no session", async () => {
    getClaims.mockRejectedValue(new Error("bad token"));
    expectRedirectToLogin(await middleware(request("/admin")));
  });

  it("fails closed without the PI-CORE env", async () => {
    vi.stubEnv("NEXT_PUBLIC_PICORE_SUPABASE_URL", "");
    getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
    expectRedirectToLogin(await middleware(request("/admin/documents")));
    expect(getClaims).not.toHaveBeenCalled();
  });
});
