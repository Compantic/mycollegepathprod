import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/sessionCookie";

const APP_PREFIX = "/app";
const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/pricing",
  "/signin",
  "/terms",
  "/privacy",
  "/cookies",
  "/icon.png",
]);
const CANONICAL_HOST = "mycollegepath.ai";
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

/** Ensure CSS applies even when streamed HTML is fragmentary (missing <link> tags). */
function attachCompiledStylesheet(res: NextResponse) {
  res.headers.append("Link", "</app-shell-layout.css>; rel=stylesheet");
  res.headers.append("Link", "</compiled-styles.css>; rel=stylesheet");
  return res;
}

/**
 * Edge-safe JWT shape + exp check for Firebase session cookies (and legacy ID tokens).
 * Full cryptographic verification happens in API routes / server components via Admin SDK.
 */
function hasValidSessionShapeAndExpiry(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const payloadRaw = decodeBase64Url(parts[1]);
  if (!payloadRaw) return false;
  try {
    const payload = JSON.parse(payloadRaw) as { exp?: number };
    if (typeof payload.exp !== "number") return false;
    // Small clock-skew allowance so near-expiry cookies are not cleared mid-navigation.
    return payload.exp * 1000 > Date.now() - 30_000;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  const host = req.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (host === `www.${CANONICAL_HOST}`) {
    const dest = new URL(req.nextUrl.pathname + req.nextUrl.search, "https://mycollegepath.ai");
    return NextResponse.redirect(dest, 308);
  }

  // Skip API, static, and assets
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Legacy entrypoint: /login currently loops on standalone in production.
  // Route all traffic to /signin while preserving a safe `from` destination.
  if (pathname === "/login") {
    const url = new URL("/signin", req.url);
    const from = searchParams.get("from");
    if (from?.startsWith("/app")) url.searchParams.set("from", from);
    return NextResponse.redirect(url);
  }

  if (isPublicRoute(pathname)) {
    return attachCompiledStylesheet(NextResponse.next());
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasUsableToken = hasValidSessionShapeAndExpiry(token);

  if (isAppRoute(pathname) && !hasUsableToken) {
    const url = new URL("/signin", req.url);
    url.searchParams.set("from", pathname);
    if (token) {
      const res = NextResponse.redirect(url);
      res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
      return res;
    }
    return NextResponse.redirect(url);
  }

  return attachCompiledStylesheet(NextResponse.next());
}

// Match only app routes — never run auth logic on /_next/*, /api/*, or static files.
// A too-broad matcher can interfere with dev asset serving and cause unstyled pages (CSS/JS 404).
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
