import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { sessionPostBodySchema } from "@/lib/validation/api";
import {
  SESSION_COOKIE_NAME,
  sessionExpiresInMs,
  sessionMaxAgeSeconds,
} from "@/lib/auth/sessionCookie";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return NextResponse.json({
      user: {
        uid: decoded.uid,
        email: decoded.email ?? undefined,
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = sessionPostBodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join("; ") || "token required";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const idToken = parsed.data.token;
    // Ensure the ID token is valid before minting a long-lived session cookie.
    await adminAuth.verifyIdToken(idToken);

    const keepSignedIn = parsed.data.keepSignedIn === true;
    const expiresIn = sessionExpiresInMs(keepSignedIn);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionMaxAgeSeconds(keepSignedIn),
    });
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid token";
    console.error("createSessionCookie error:", message);
    return NextResponse.json({ error: message || "Invalid token" }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
