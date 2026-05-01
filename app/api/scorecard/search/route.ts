import { NextRequest, NextResponse } from "next/server";
import { searchSchools } from "@/lib/scorecard/client";
import { getApiErrorStatus, RateLimitError, ServiceUnavailableError } from "@/lib/errors/api";
import {
  meaningfulTokens,
  matchesSchoolNameFullQuery,
  matchesSchoolNameQuery,
  primarySearchToken,
  rankResultsByQuery,
  scorecardNameForSearch,
  withPrefixWildcard,
} from "../search-helpers";

/** Full Scorecard budget for search — short timeouts caused false failures and hid real API issues. */
const LIST_SEARCH_HTTP = { maxRetries: 5, timeoutMs: 20_000 } as const;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query") ?? req.nextUrl.searchParams.get("schoolname") ?? undefined;
  const state = req.nextUrl.searchParams.get("state") ?? undefined;
  const per_page = req.nextUrl.searchParams.get("per_page");
  const page = req.nextUrl.searchParams.get("page");
  const mode = req.nextUrl.searchParams.get("mode") ?? "";
  const normalizedQuery = query?.trim() || undefined;
  const perPage = Math.min(per_page ? parseInt(per_page, 10) : 20, 50);
  const currentPage = page ? parseInt(page, 10) : undefined;
  const isSuggest = mode === "suggest";

  try {
    /** Short token sent to Scorecard (full user string used only for ranking). */
    const apiName = normalizedQuery ? scorecardNameForSearch(normalizedQuery) ?? normalizedQuery : undefined;
    const schoolNameFilter = withPrefixWildcard(apiName);

    // Lightweight path for autocomplete: one API call, no multi-step fallbacks.
    if (isSuggest) {
      const primary = await searchSchools(
        {
          schoolname: schoolNameFilter,
          "school.state": state || undefined,
          per_page: Math.min(perPage, 10),
          page: currentPage ?? 0,
        },
        LIST_SEARCH_HTTP
      );
      const ranked = rankResultsByQuery(primary.results ?? [], normalizedQuery).slice(0, Math.min(perPage, 10));
      const suggestToken = primarySearchToken(normalizedQuery);
      const filtered = ranked.filter((r) => matchesSchoolNameQuery(r.name ?? "", suggestToken));
      return NextResponse.json({ ...primary, results: filtered, didYouMean: null });
    }

    const primary = await searchSchools(
      {
        schoolname: schoolNameFilter,
        "school.state": state || undefined,
        per_page: perPage,
        page: currentPage,
      },
      LIST_SEARCH_HTTP
    );

    let combinedResults = primary.results ?? [];

    // Extra tokens only if primary was empty (avoid repeating the same stanford* call).
    if (combinedResults.length === 0 && normalizedQuery?.includes(" ")) {
      const terms = meaningfulTokens(normalizedQuery);
      const start = terms[0]?.toLowerCase() === apiName?.toLowerCase() ? 1 : 0;
      for (const term of terms.slice(start, 4)) {
        const r = await searchSchools(
          {
            schoolname: withPrefixWildcard(term),
            "school.state": state || undefined,
            per_page: perPage,
            page: currentPage,
          },
          LIST_SEARCH_HTTP
        );
        if ((r.results?.length ?? 0) > 0) {
          combinedResults = r.results ?? [];
          break;
        }
      }
    }

    const nameFiltered = combinedResults.filter((r) => matchesSchoolNameFullQuery(r.name ?? "", normalizedQuery));
    const ranked = rankResultsByQuery(nameFiltered, normalizedQuery).slice(0, perPage);

    let didYouMean: { id: number; name: string } | null = null;
    if (ranked.length === 0 && normalizedQuery) {
      const first = meaningfulTokens(normalizedQuery)[0] ?? normalizedQuery.split(/\s+/).find((t) => t.length >= 2);
      if (first && first.toLowerCase() !== apiName?.toLowerCase()) {
        const dym = await searchSchools(
          {
            schoolname: withPrefixWildcard(first),
            "school.state": state || undefined,
            per_page: 8,
            page: 0,
          },
          LIST_SEARCH_HTTP
        );
        const dymFiltered = (dym.results ?? []).filter((row) => matchesSchoolNameQuery(row.name ?? "", first));
        const pool = rankResultsByQuery(dymFiltered, first);
        const top = pool[0];
        if (top?.id != null && top?.name) {
          didYouMean = { id: top.id, name: top.name };
        }
      }
    }

    return NextResponse.json({ ...primary, results: ranked, didYouMean });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message, results: [], didYouMean: null },
        { status: 429 }
      );
    }
    /** Upstream College Scorecard often returns 503/timeout — avoid error toasts; UI shows inline retry. */
    if (err instanceof ServiceUnavailableError) {
      const statusCode = err.statusCode ?? 503;
      const isAuthIssue = statusCode === 401 || statusCode === 403;
      const message = isAuthIssue
        ? "College Scorecard rejected the API key (401/403). Set SCORECARD_API_KEY or COLLEGE_SCORECARD_API_KEY in .env.local and restart."
        : "The college directory is temporarily busy or unreachable. Wait a few seconds and try again, or use a shorter name (e.g. “Stanford”).";
      return NextResponse.json(
        {
          results: [],
          didYouMean: null,
          unavailable: true,
          message,
        },
        { status: 200 }
      );
    }
    const status = getApiErrorStatus(err);
    if (status === 429) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Too many requests. Try again in a few minutes." },
        { status: 429 }
      );
    }
    const msg = err instanceof Error ? err.message : "Search failed";
    const isConfig = msg.includes("SCORECARD_API_KEY") || msg.includes("COLLEGE_SCORECARD_API_KEY");
    return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 });
  }
}
