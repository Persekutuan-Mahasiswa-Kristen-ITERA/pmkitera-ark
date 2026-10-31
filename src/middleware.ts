import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "pmk-ark-session";

function getSecret(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET;
  // Di middleware (Edge), throw akan bikin request gagal. Tanpa secret yang valid,
  // kembalikan null agar semua token ditolak (jangan pakai secret cadangan yang
  // tertulis di kode, karena token yang ditandatangani dengannya akan lolos).
  if (!secret || secret.length < 32) return null;
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
      const secret = getSecret();
      if (!secret) throw new Error("SESSION_SECRET belum diset");
      const { payload } = await jwtVerify(token, secret);
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