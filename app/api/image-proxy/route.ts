import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "lh3.googleusercontent.com",
]);

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return new NextResponse("Missing url", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    return new NextResponse("Unsupported protocol", { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      cache: "no-store",
      headers: {
        Accept: "image/*,*/*;q=0.8",
      },
    });
    if (!upstream.ok) {
      return new NextResponse("Image fetch failed", { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Unsupported content type", { status: 415 });
    }
    const body = upstream.body;
    if (!body) {
      return new NextResponse("Empty image body", { status: 502 });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        "X-Compantic-Image-Proxy": "ok",
      },
    });
  } catch (err) {
    console.error("image-proxy fetch failed", err);
    return new NextResponse("Proxy error", { status: 502 });
  }
}
