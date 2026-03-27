import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const APP_PREFIX = "/app";

function isAppRoute(pathname: string): boolean {
  return pathname === APP_PREFIX || pathname.startsWith(APP_PREFIX + "/");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API, static, and assets
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("firebase-id-token")?.value;

  if (isAppRoute(pathname) && !token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
