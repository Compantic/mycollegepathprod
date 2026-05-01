import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const APP_PREFIX = "/app";
const PUBLIC_EXACT_PATHS = new Set(["/", "/login", "/terms", "/privacy", "/cookies", "/icon.png"]);
const PUBLIC_PREFIX_PATHS = ["/onboarding/"];

function isAppRoute(pathname: string): boolean {
  return pathname === APP_PREFIX || pathname.startsWith(APP_PREFIX + "/");
}

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIX_PATHS.some((prefix) => pathname.startsWith(prefix));
}

function decodeBase64Url(input: string): string | null {
  try {
    const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
    return atob(base64 + pad);
  } catch {
    return null;
  }
}

function hasValidSessionShapeAndExpiry(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const payloadRaw = decodeBase64Url(parts[1]);
  if (!payloadRaw) return false;
  try {
    const payload = JSON.parse(payloadRaw) as { exp?: number };
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Skip API, static, and assets
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    // Prevent login self-referential redirect loops like /login?from=/login...
    if (pathname === "/login") {
      const from = searchParams.get("from");
      if (from?.startsWith("/login")) {
        const cleanLoginUrl = new URL("/login", req.url);
        return NextResponse.redirect(cleanLoginUrl);
      }
    }
    return NextResponse.next();
  }

  const token = req.cookies.get("__session")?.value;
  const hasUsableToken = hasValidSessionShapeAndExpiry(token);
  
  if (process.env.NODE_ENV === "production" && isAppRoute(pathname)) {
    console.log(`Middleware Auth Check: Path=${pathname}, TokenUsable=${hasUsableToken}`);
  }

  if (isAppRoute(pathname) && !hasUsableToken) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    if (token) {
      const res = NextResponse.redirect(url);
      res.cookies.set("__session", "", { path: "/", maxAge: 0 });
      return res;
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Match only app routes — never run auth logic on /_next/*, /api/*, or static files.
// A too-broad matcher can interfere with dev asset serving and cause unstyled pages (CSS/JS 404).
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
