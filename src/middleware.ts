import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Gate for /admin (PI-CORE D-16). Only checks that a PI-CORE session exists (JWT verified locally
 * by getClaims) and refreshes it; whether the person has an ARK role is decided on the server by
 * getAccessStatus() (pages and API routes), because that needs a call to PI-CORE.
 * Without the PI-CORE env every /admin request goes to the login page (fail closed).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_PICORE_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_PICORE_SUPABASE_PUBLISHABLE_KEY;
  const toLogin = () => NextResponse.redirect(new URL("/admin/login", req.url));
  if (!url || !key) return toLogin();

  const response = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  let userId: string | undefined;
  try {
    const { data } = await supabase.auth.getClaims();
    userId = data?.claims.sub;
  } catch {
    userId = undefined;
  }
  if (!userId) {
    const redirect = toLogin();
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
