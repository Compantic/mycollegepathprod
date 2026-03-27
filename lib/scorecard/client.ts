import type { ScorecardSearchParams, ScorecardSearchResponse, ScorecardCollege, ScorecardRow } from "./types";
import { setCachedCollege } from "./cache";
import { RateLimitError, ServiceUnavailableError } from "@/lib/errors/api";

const FETCH_TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 2;

async function fetchWithRetry(
  url: string,
  options: RequestInit & { next?: { revalidate?: number } }
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.status === 429) return res;
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (e instanceof Error && e.name === "AbortError") {
        clearTimeout(timeoutId);
        throw new ServiceUnavailableError("Request timed out. Please try again.");
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        throw lastErr instanceof Error ? lastErr : new ServiceUnavailableError("College data temporarily unavailable.");
      }
    }
  }
  clearTimeout(timeoutId);
  throw lastErr instanceof Error ? lastErr : new ServiceUnavailableError("College data temporarily unavailable.");
}

function normalizeRow(row: ScorecardRow): ScorecardCollege {
  return {
    id: row.id,
    name: row["school.name"] ?? "Unknown",
    city: row["school.city"],
    state: row["school.state"],
    school_url: row["school.school_url"],
    location: row["school.location"],
    student: row["student.size"] != null ? { size: row["student.size"] } : undefined,
    admission: {
      admission_rate: row["admission.admission_rate"],
      sat_scores: (row["admission.sat_scores.midpoint.critical_reading"] != null || row["admission.sat_scores.midpoint.math"] != null)
        ? { midpoint: { critical_reading: row["admission.sat_scores.midpoint.critical_reading"], math: row["admission.sat_scores.midpoint.math"], writing: row["admission.sat_scores.midpoint.writing"] } }
        : undefined,
      act_scores: row["admission.act_scores.midpoint.cumulative"] != null ? { midpoint: { cumulative: row["admission.act_scores.midpoint.cumulative"] } } : undefined,
    },
    latest: (row["latest.student.size"] != null || row["latest.admission.admission_rate"] != null || row["latest.cost.tuition.reported"] != null || row["latest.cost.roomboard.reported"] != null)
      ? {
          student: row["latest.student.size"] != null ? { size: row["latest.student.size"] } : undefined,
          admission: row["latest.admission.admission_rate"] != null ? { admission_rate: row["latest.admission.admission_rate"] } : undefined,
          cost: (row["latest.cost.tuition.reported"] != null || row["latest.cost.roomboard.reported"] != null)
            ? { tuition: row["latest.cost.tuition.reported"], roomboard: row["latest.cost.roomboard.reported"] }
            : undefined,
        }
      : undefined,
  };
}

const BASE = "https://api.data.gov/ed/collegescorecard/v1/schools";

function getApiKey(): string {
  const apiKey = process.env.SCORECARD_API_KEY ?? process.env.COLLEGE_SCORECARD_API_KEY;
  if (!apiKey) {
    throw new Error("SCORECARD_API_KEY (or COLLEGE_SCORECARD_API_KEY) is not set");
  }
  return apiKey;
}

function buildQuery(params: ScorecardSearchParams): string {
  const u = new URLSearchParams();
  u.set("api_key", getApiKey());
  const fields = "id,school.name,school.city,school.state,school.school_url,school.location,student.size,admission.admission_rate,admission.sat_scores.midpoint.critical_reading,admission.sat_scores.midpoint.math,admission.sat_scores.midpoint.writing,admission.act_scores.midpoint.cumulative,latest.student.size,latest.admission.admission_rate";
  u.set("fields", params.fields ?? fields);
  u.set("per_page", String(params.per_page ?? 20));
  if (params.page) u.set("page", String(params.page));
  if (params.schoolname) u.set("school.name", params.schoolname);
  if (params["school.degrees_awarded.predominant"]) u.set("school.degrees_awarded.predominant", params["school.degrees_awarded.predominant"]);
  if (params["school.state"]) u.set("school.state", params["school.state"]);
  if (params["school.region_id"]) u.set("school.region_id", params["school.region_id"]);
  return u.toString();
}

export async function searchSchools(params: ScorecardSearchParams): Promise<ScorecardSearchResponse> {
  const qs = buildQuery(params);
  const res = await fetchWithRetry(`${BASE}?${qs}`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    if (res.status === 429) throw new RateLimitError("College search rate limit exceeded. Try again in a few minutes.");
    throw new ServiceUnavailableError(`College search failed (${res.status}). Please try again later.`);
  }
  const data = await res.json();
  const results = (data.results as ScorecardRow[] | undefined)?.map(normalizeRow);
  return { ...data, results };
}

export async function getSchoolById(id: number): Promise<ScorecardCollege | null> {
  const apiKey = getApiKey();
  const fields = "id,school.name,school.city,school.state,school.school_url,school.location,student.size,admission.admission_rate,admission.sat_scores.midpoint.critical_reading,admission.sat_scores.midpoint.math,admission.sat_scores.midpoint.writing,admission.act_scores.midpoint.cumulative,latest.student.size,latest.admission.admission_rate,latest.cost.tuition.reported,latest.cost.roomboard.reported";
  const url = `${BASE}?api_key=${apiKey}&id=${id}&fields=${encodeURIComponent(fields)}`;
  const res = await fetchWithRetry(url, { next: { revalidate: 3600 } });
  if (res.status === 404) return null;
  if (!res.ok) {
    if (res.status === 429) throw new RateLimitError("College data rate limit exceeded. Try again in a few minutes.");
    throw new ServiceUnavailableError(`College data failed (${res.status}). Please try again.`);
  }
  const data = await res.json();
  const raw = (data?.results as ScorecardRow[] | undefined)?.[0];
  if (!raw) return null;
  const college = normalizeRow(raw);
  setCachedCollege(college.id, college);
  return college;
}
