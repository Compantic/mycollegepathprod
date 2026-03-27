/**
 * Server-only: resolve a college name (or search phrase) to a Scorecard college ID.
 * Uses Scorecard API search; results are cached when fetched by id elsewhere.
 */
import { searchSchools } from "./client";
import { setCachedCollege } from "./cache";

export async function resolveCollegeNameToId(nameOrPhrase: string): Promise<number | null> {
  const trimmed = nameOrPhrase.trim().slice(0, 80);
  if (!trimmed) return null;
  const res = await searchSchools({
    schoolname: trimmed,
    "school.degrees_awarded.predominant": "3",
    per_page: 1,
  });
  const first = res.results?.[0];
  if (!first) return null;
  setCachedCollege(first.id, first);
  return first.id;
}
