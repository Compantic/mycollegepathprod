import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { sessionPostBodySchema } from "@/lib/validation/api";

const COOKIE_NAME = "__session";

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
    await adminAuth.verifyIdToken(parsed.data.token);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, parsed.data.token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: parsed.data.keepSignedIn ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
    });
    return res;
  } catch (error: any) {
    console.error("verifyIdToken error:", error);
    return NextResponse.json({ error: error?.message || "Invalid token" }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
