import { NextRequest, NextResponse } from "next/server";

/** GET /api/college/image?name=Harvard+University — returns a campus/college image URL (Unsplash or placeholder). */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name) {
    return NextResponse.json({ imageUrl: null }, { status: 200 });
  }

  const key = process.env.UNSPLASH_ACCESS_KEY ?? process.env.UNSPLASH_ACCESS_KEY_ID;
  const query = `${name} university campus`.slice(0, 100);

  if (key) {
    try {
      const url = new URL("https://api.unsplash.com/search/photos");
      url.searchParams.set("query", query);
      url.searchParams.set("per_page", "1");
      url.searchParams.set("orientation", "landscape");
      url.searchParams.set("client_id", key);

      const res = await fetch(url.toString(), { next: { revalidate: 86400 } }); // cache 24h
      if (!res.ok) {
        const text = await res.text();
        console.warn("[college/image] Unsplash error:", res.status, text?.slice(0, 200));
        return NextResponse.json({ imageUrl: getPlaceholderUrl(name) }, { status: 200 });
      }

      const data = (await res.json()) as { results?: Array<{ urls?: { regular?: string } }> };
      const imageUrl = data.results?.[0]?.urls?.regular ?? null;
      return NextResponse.json({
        imageUrl: imageUrl || getPlaceholderUrl(name),
      });
    } catch (e) {
      console.warn("[college/image] Fetch error:", e);
      return NextResponse.json({ imageUrl: getPlaceholderUrl(name) }, { status: 200 });
    }
  }

  return NextResponse.json({ imageUrl: getPlaceholderUrl(name) }, { status: 200 });
}

/** Deterministic placeholder when Unsplash is not configured or fails. */
function getPlaceholderUrl(collegeName: string): string {
  const seed = encodeURIComponent(collegeName.slice(0, 50));
  return `https://picsum.photos/seed/${seed}/1200/600`;
}
