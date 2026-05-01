const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "of",
  "at",
  "in",
  "college",
  "university",
  "school",
  "medical",
  "medicine",
  "institute",
  "center",
  "centre",
  "hospital",
  "program",
  "programs",
]);

/**
 * Value for Scorecard `school.name`.
 * Do **not** append `*` — upstream often returns **HTTP 500** for queries like `columbia*` or `stan*`.
 * Plain tokens (`columbia`, `stanford`) return 200 and match schools as documented.
 */
export function withPrefixWildcard(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

export function meaningfulTokens(query: string): string[] {
  return query
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t.toLowerCase()));
}

/**
 * College Scorecard `school.name` filter works best with a short prefix token.
 * Long multi-word queries like "stanford medical school*" often time out or 503 upstream.
 */
export function scorecardNameForSearch(query: string | undefined): string | undefined {
  const t = query?.trim();
  if (!t) return undefined;
  if (t.length <= 2) return t;
  const tokens = meaningfulTokens(t);
  if (tokens.length >= 1) return tokens[0].slice(0, 48);
  const firstWord = t.split(/\s+/).find((w) => w.length >= 1);
  return (firstWord ?? t).slice(0, 48);
}

export function rankResultsByQuery<T extends { id?: number; name?: string }>(results: T[], query?: string): T[] {
  const q = query?.trim().toLowerCase();
  if (!q) return results;
  const terms = q.split(/\s+/).filter(Boolean);
  const unique = new Map<number | string, T>();
  for (const r of results) unique.set(r.id ?? `${r.name ?? ""}`, r);
  return Array.from(unique.values()).sort((a, b) => {
    const an = (a.name ?? "").toLowerCase();
    const bn = (b.name ?? "").toLowerCase();
    const aStarts = an.startsWith(q) ? 2 : 0;
    const bStarts = bn.startsWith(q) ? 2 : 0;
    const aTermHits = terms.reduce((n, t) => n + (an.includes(t) ? 1 : 0), 0);
    const bTermHits = terms.reduce((n, t) => n + (bn.includes(t) ? 1 : 0), 0);
    const aScore = aStarts + aTermHits;
    const bScore = bStarts + bTermHits;
    if (aScore !== bScore) return bScore - aScore;
    return an.localeCompare(bn);
  });
}

/** First typed word — autocomplete should match this while the user is still typing the rest. */
export function primarySearchToken(query: string | undefined): string | undefined {
  const t = query?.trim();
  if (!t) return undefined;
  return t.split(/\s+/)[0] ?? t;
}

const WORD_SPLIT = /[\s\-–—,.]+/;

/**
 * Strict name match for autocomplete: avoids upstream wildcard noise (e.g. "State" schools for "stan").
 * Uses word-prefix or whole-name prefix; 4+ char tokens may also match as substring.
 */
export function matchesSchoolNameQuery(name: string, query: string | undefined): boolean {
  const raw = query?.trim();
  if (!raw) return true;
  const q = raw.toLowerCase();
  const n = name.toLowerCase();
  const words = n.split(WORD_SPLIT).filter(Boolean);

  if (q.length <= 2) {
    return n.startsWith(q) || words.some((w) => w.startsWith(q));
  }
  if (q.length === 3) {
    return words.some((w) => w.startsWith(q)) || n.startsWith(q);
  }
  return (
    words.some((w) => w.startsWith(q)) ||
    n.startsWith(q) ||
    (q.length >= 5 && n.includes(q))
  );
}

/**
 * Full grid search: every meaningful token must match (stopwords stripped). If none remain, first word is used.
 */
export function matchesSchoolNameFullQuery(name: string, query: string | undefined): boolean {
  const raw = query?.trim();
  if (!raw) return true;
  let tokens = meaningfulTokens(raw);
  if (tokens.length === 0) {
    const first = raw.split(/\s+/).find((w) => w.length >= 2);
    if (first) tokens = [first];
  }
  if (tokens.length === 0) return true;
  const n = name.toLowerCase();
  const words = n.split(WORD_SPLIT).filter(Boolean);
  return tokens.every((token) => {
    const t = token.toLowerCase();
    if (t.length <= 2) return true;
    return words.some((w) => w.startsWith(t)) || (t.length >= 4 && n.includes(t));
  });
}
