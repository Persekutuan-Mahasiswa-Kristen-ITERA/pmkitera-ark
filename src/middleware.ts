import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "pmk-ark-session";

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    // Di middleware (Edge), throw akan bikin request gagal — kembalikan key dummy (invalid) agar gagal verifikasi token & redirect ke login
    return new TextEncoder().encode("invalid-dummy-secret-to-prevent-bypass-000000000000");
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Izinkan halaman login tanpa session (hindari redirect loop)
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    try {
      const { payload } = await jwtVerify(token, getSecret());
      const role = payload.role as string;
      if (!["admin", "pengurus"].includes(role)) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
    } catch {
      // Token invalid / secret belum diset / expired
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};