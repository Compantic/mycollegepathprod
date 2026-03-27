import type { ScorecardCollege } from "./types";

const memory = new Map<number, { data: ScorecardCollege; expires: number }>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

export function getCachedCollege(id: number): ScorecardCollege | null {
  const entry = memory.get(id);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

export function setCachedCollege(id: number, data: ScorecardCollege): void {
  memory.set(id, { data, expires: Date.now() + TTL_MS });
}
