import { NextRequest, NextResponse } from "next/server";

/** GET /api/college/image?name=Harvard+University — returns a campus/college image URL (Unsplash or placeholder). */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  const city = request.nextUrl.searchParams.get("city")?.trim();
  const state = request.nextUrl.searchParams.get("state")?.trim();
  if (!name) {
    return NextResponse.json({ imageUrl: null }, { status: 200 });
  }

  const key = process.env.UNSPLASH_ACCESS_KEY ?? process.env.UNSPLASH_ACCESS_KEY_ID;
  const query = `${name}${city ? ` ${city}` : ""}${state ? ` ${state}` : ""} university campus`.slice(0, 100);

  // First try Wikimedia (no API key required, generally more school-relevant images).
  const wikiUrl = await fetchWikimediaImageUrl(name, city, state);
  if (wikiUrl) {
    return NextResponse.json({ imageUrl: wikiUrl }, { status: 200 });
  }

  if (key) {
    try {
      const url = new URL("https://api.unsplash.com/search/photos");
      url.searchParams.set("query", query);
      url.searchParams.set("per_page", "8");
      url.searchParams.set("orientation", "landscape");
      url.searchParams.set("content_filter", "high");
      url.searchParams.set("client_id", key);

      const res = await fetch(url.toString(), { next: { revalidate: 86400 } }); // cache 24h
      if (!res.ok) {
        const text = await res.text();
        console.warn("[college/image] Unsplash error:", res.status, text?.slice(0, 200));
        return NextResponse.json({ imageUrl: null }, { status: 200 });
      }

      const data = (await res.json()) as {
        results?: Array<{
          urls?: { regular?: string };
          alt_description?: string | null;
          description?: string | null;
          tags?: Array<{ title?: string | null }>;
        }>;
      };
      const imageUrl = pickBestImageUrl(data.results ?? [], name);
      return NextResponse.json({
        imageUrl,
      });
    } catch (e) {
      console.warn("[college/image] Fetch error:", e);
      return NextResponse.json({ imageUrl: null }, { status: 200 });
    }
  }

  return NextResponse.json({ imageUrl: null }, { status: 200 });
}

async function fetchWikimediaImageUrl(
  name: string,
  city?: string,
  state?: string
): Promise<string | null> {
  try {
    const endpoint = new URL("https://en.wikipedia.org/w/api.php");
    endpoint.searchParams.set("action", "query");
    endpoint.searchParams.set("format", "json");
    endpoint.searchParams.set("origin", "*");
    endpoint.searchParams.set("generator", "search");
    endpoint.searchParams.set("gsrsearch", `${name} ${city ?? ""} ${state ?? ""} university campus`.trim());
    endpoint.searchParams.set("gsrlimit", "6");
    endpoint.searchParams.set("prop", "pageimages|info");
    endpoint.searchParams.set("piprop", "original|thumbnail");
    endpoint.searchParams.set("pithumbsize", "1600");
    endpoint.searchParams.set("inprop", "url");

    const res = await fetch(endpoint.toString(), { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          {
            title?: string;
            original?: { source?: string };
            thumbnail?: { source?: string };
          }
        >;
      };
    };
    const pages = Object.values(data.query?.pages ?? {});
    if (!pages.length) return null;

    const tokens = name
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 4 && !["university", "college", "school", "institute"].includes(t));
    const primaryToken = tokens[0];

    let best: { score: number; url: string | null } = { score: -1, url: null };
    for (const page of pages) {
      const title = (page.title ?? "").toLowerCase();
      const url = page.thumbnail?.source ?? page.original?.source ?? null;
      if (!url) continue;
      if (primaryToken && !title.includes(primaryToken)) continue;
      const score = tokens.length
        ? tokens.reduce((n, token) => n + (title.includes(token) ? 1 : 0), 0)
        : 1;
      if (score > best.score) best = { score, url };
    }
    if (tokens.length > 0 && best.score <= 0) return null;
    return best.url;
  } catch {
    return null;
  }
}

function pickBestImageUrl(
  results: Array<{
    urls?: { regular?: string };
    alt_description?: string | null;
    description?: string | null;
    tags?: Array<{ title?: string | null }>;
  }>,
  collegeName: string
): string | null {
  if (!results.length) return null;
  const tokens = collegeName
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4 && !["university", "college", "school", "institute"].includes(t));

  let best: { score: number; url: string | null } = { score: -1, url: null };
  for (const row of results) {
    const text = [
      row.alt_description ?? "",
      row.description ?? "",
      ...(row.tags ?? []).map((t) => t.title ?? ""),
    ]
      .join(" ")
      .toLowerCase();
    const url = row.urls?.regular ?? null;
    if (!url) continue;

    const hits = tokens.reduce((n, token) => n + (text.includes(token) ? 1 : 0), 0);
    const score = tokens.length === 0 ? 1 : hits;
    if (score > best.score) best = { score, url };
  }

  if (tokens.length > 0 && best.score <= 0) return null;
  return best.url;
}
