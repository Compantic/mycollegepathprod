/**
 * Server-only: get user from session cookie or Authorization Bearer ID token.
 * Use in API routes or server components.
 */
import { adminAuth } from "./admin";

export type SessionUser = {
  uid: string;
  email: string | null;
};

async function userFromIdToken(token: string): Promise<SessionUser | null> {
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Prefer Firebase session cookie verification (5–14 day lifetime).
 * Fall back to ID token verification for legacy cookies minted before the session-cookie migration.
 */
async function userFromCookie(token: string): Promise<SessionUser | null> {
  try {
    const decoded = await adminAuth.verifySessionCookie(token, false);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
    };
  } catch {
    return userFromIdToken(token);
  }
}

export async function getSessionUser(token: string | null): Promise<SessionUser | null> {
  if (!token || typeof token !== "string") return null;
  return userFromCookie(token);
}

/**
 * Get session user from Next.js request (cookie or Authorization header).
 * Bearer tokens are always ID tokens from the client SDK.
 * Cookies are session cookies (or legacy ID tokens during migration).
 */
export async function getSessionUserFromRequest(request: Request): Promise<SessionUser | null> {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (bearer) return userFromIdToken(bearer);

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("__session")?.value ?? null;
  if (!cookieToken) return null;
  return userFromCookie(cookieToken);
}

/**
 * Get session user from server component (cookies()).
 */
export async function getSessionUserFromCookies(): Promise<SessionUser | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("__session")?.value ?? null;
  if (!token) return null;
  return userFromCookie(token);
}
