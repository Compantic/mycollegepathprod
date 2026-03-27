/**
 * Server-only: get user from session token (e.g. cookie or Authorization header).
 * Use in API routes or server components.
 */
import { adminAuth } from "./admin";

export async function getSessionUser(token: string | null): Promise<{
  uid: string;
  email: string | null;
} | null> {
  if (!token || typeof token !== "string") return null;
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
 * Get session user from Next.js request (cookie or Authorization header).
 */
export async function getSessionUserFromRequest(request: Request): Promise<{
  uid: string;
  email: string | null;
} | null> {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (bearer) return getSessionUser(bearer);
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("firebase-id-token")?.value ?? null;
  return getSessionUser(cookieToken);
}

/**
 * Get session user from server component (cookies()).
 */
export async function getSessionUserFromCookies(): Promise<{
  uid: string;
  email: string | null;
} | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("firebase-id-token")?.value ?? null;
  return getSessionUser(token);
}
