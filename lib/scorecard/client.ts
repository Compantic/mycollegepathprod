import type { ScorecardSearchParams, ScorecardSearchResponse, ScorecardCollege, ScorecardRow } from "./types";
import { setCachedCollege } from "./cache";
import { RateLimitError, ServiceUnavailableError } from "@/lib/errors/api";

const FETCH_TIMEOUT_MS = 20000;
const RETRY_DELAY_MS = 750;
/** Upstream College Scorecard occasionally returns 503; retries must use a fresh AbortController each attempt. */
const MAX_RETRIES = 5;

function backoffMs(attempt: number): number {
  return Math.min(RETRY_DELAY_MS * 2 ** attempt, 8000);
}

async function fetchWithRetry(
  url: string,
  options: RequestInit & { next?: { revalidate?: number } },
  retryOptions?: { maxRetries?: number; timeoutMs?: number }
): Promise<Response> {
  const maxRetries = retryOptions?.maxRetries ?? MAX_RETRIES;
  const timeoutMs = retryOptions?.timeoutMs ?? FETCH_TIMEOUT_MS;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const { next, ...rest } = options;
      const res = await fetch(url, {
        ...rest,
        signal: controller.signal,
        ...(next ? { next } : {}),
      });
      clearTimeout(timeoutId);
      if (res.status === 429) return res;
      if (res.status >= 500 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, backoffMs(attempt)));
        continue;
      }
      return res;
    } catch (e) {
      clearTimeout(timeoutId);
      lastErr = e;
      if (e instanceof Error && e.name === "AbortError") {
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, backoffMs(attempt)));
          continue;
        }
        throw new ServiceUnavailableError("Request timed out. Please try again.");
      }
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, backoffMs(attempt)));
        continue;
      }
      throw lastErr instanceof Error ? lastErr : new ServiceUnavailableError("College data temporarily unavailable.");
    }
  }
  throw lastErr instanceof Error ? lastErr : new ServiceUnavailableError("College data temporarily unavailable.");
}

function normalizeRow(row: ScorecardRow): ScorecardCollege {
  const college: ScorecardCollege = {
    id: row.id,
    name: row["school.name"] ?? "Unknown",
    city: row["school.city"],
    state: row["school.state"],
    school_url: row["school.school_url"],
    location: row["school.location"],
    locale: row["school.locale"],
    ownership: row["school.ownership"],
    student: row["student.size"] != null ? { size: row["student.size"] } : undefined,
    admission: {
      admission_rate: row["admission.admission_rate"],
      sat_scores: (row["admission.sat_scores.midpoint.critical_reading"] != null || row["admission.sat_scores.midpoint.math"] != null)
        ? { midpoint: { critical_reading: row["admission.sat_scores.midpoint.critical_reading"], math: row["admission.sat_scores.midpoint.math"], writing: row["admission.sat_scores.midpoint.writing"] } }
        : undefined,
      act_scores: row["admission.act_scores.midpoint.cumulative"] != null ? { midpoint: { cumulative: row["admission.act_scores.midpoint.cumulative"] } } : undefined,
    },
    latest: (row["latest.student.size"] != null ||
      row["latest.admission.admission_rate"] != null ||
      row["latest.admissions.admission_rate.overall"] != null ||
      row["latest.admissions.sat_scores.25th_percentile.critical_reading"] != null ||
      row["latest.admissions.sat_scores.75th_percentile.critical_reading"] != null ||
      row["latest.admissions.sat_scores.25th_percentile.math"] != null ||
      row["latest.admissions.sat_scores.75th_percentile.math"] != null ||
      row["latest.admissions.act_scores.25th_percentile.cumulative"] != null ||
      row["latest.admissions.act_scores.75th_percentile.cumulative"] != null ||
      row["latest.cost.tuition.reported"] != null ||
      row["latest.cost.roomboard.reported"] != null ||
      row["latest.cost.attendance.academic_year"] != null ||
      row["latest.cost.avg_net_price.overall"] != null ||
      row["latest.cost.avg_net_price.by_income_level.0-30000"] != null ||
      row["latest.cost.avg_net_price.by_income_level.30001-48000"] != null ||
      row["latest.cost.avg_net_price.by_income_level.48001-75000"] != null ||
      row["latest.cost.avg_net_price.by_income_level.75001-110000"] != null ||
      row["latest.cost.avg_net_price.by_income_level.110001-plus"] != null ||
      row["latest.aid.median_debt.completers.monthly_payments"] != null ||
      row["latest.earnings.10_yrs_after_entry.median"] != null)
      ? {
          student: row["latest.student.size"] != null ? { size: row["latest.student.size"] } : undefined,
          admission: row["latest.admission.admission_rate"] != null ? { admission_rate: row["latest.admission.admission_rate"] } : undefined,
          admissions:
            row["latest.admissions.admission_rate.overall"] != null ||
            row["latest.admissions.sat_scores.25th_percentile.critical_reading"] != null ||
            row["latest.admissions.sat_scores.75th_percentile.critical_reading"] != null ||
            row["latest.admissions.sat_scores.25th_percentile.math"] != null ||
            row["latest.admissions.sat_scores.75th_percentile.math"] != null ||
            row["latest.admissions.act_scores.25th_percentile.cumulative"] != null ||
            row["latest.admissions.act_scores.75th_percentile.cumulative"] != null
              ? {
                  admission_rate:
                    row["latest.admissions.admission_rate.overall"] != null
                      ? { overall: row["latest.admissions.admission_rate.overall"] }
                      : undefined,
                  sat_scores:
                    row["latest.admissions.sat_scores.25th_percentile.critical_reading"] != null ||
                    row["latest.admissions.sat_scores.75th_percentile.critical_reading"] != null ||
                    row["latest.admissions.sat_scores.25th_percentile.math"] != null ||
                    row["latest.admissions.sat_scores.75th_percentile.math"] != null
                      ? {
                          "25th_percentile": {
                            critical_reading: row["latest.admissions.sat_scores.25th_percentile.critical_reading"],
                            math: row["latest.admissions.sat_scores.25th_percentile.math"],
                          },
                          "75th_percentile": {
                            critical_reading: row["latest.admissions.sat_scores.75th_percentile.critical_reading"],
                            math: row["latest.admissions.sat_scores.75th_percentile.math"],
                          },
                        }
                      : undefined,
                  act_scores:
                    row["latest.admissions.act_scores.25th_percentile.cumulative"] != null ||
                    row["latest.admissions.act_scores.75th_percentile.cumulative"] != null
                      ? {
                          "25th_percentile": {
                            cumulative: row["latest.admissions.act_scores.25th_percentile.cumulative"],
                          },
                          "75th_percentile": {
                            cumulative: row["latest.admissions.act_scores.75th_percentile.cumulative"],
                          },
                        }
                      : undefined,
                }
              : undefined,
          cost:
            row["latest.cost.tuition.reported"] != null ||
            row["latest.cost.roomboard.reported"] != null ||
            row["latest.cost.attendance.academic_year"] != null ||
            row["latest.cost.avg_net_price.overall"] != null ||
            row["latest.cost.avg_net_price.by_income_level.0-30000"] != null ||
            row["latest.cost.avg_net_price.by_income_level.30001-48000"] != null ||
            row["latest.cost.avg_net_price.by_income_level.48001-75000"] != null ||
            row["latest.cost.avg_net_price.by_income_level.75001-110000"] != null ||
            row["latest.cost.avg_net_price.by_income_level.110001-plus"] != null
            ? {
                tuition: row["latest.cost.tuition.reported"],
                roomboard: row["latest.cost.roomboard.reported"],
                attendance_academic_year: row["latest.cost.attendance.academic_year"],
                avg_net_price:
                  row["latest.cost.avg_net_price.overall"] != null ||
                  row["latest.cost.avg_net_price.by_income_level.0-30000"] != null ||
                  row["latest.cost.avg_net_price.by_income_level.30001-48000"] != null ||
                  row["latest.cost.avg_net_price.by_income_level.48001-75000"] != null ||
                  row["latest.cost.avg_net_price.by_income_level.75001-110000"] != null ||
                  row["latest.cost.avg_net_price.by_income_level.110001-plus"] != null
                    ? {
                        overall: row["latest.cost.avg_net_price.overall"],
                        by_income_level: {
                          "0-30000": row["latest.cost.avg_net_price.by_income_level.0-30000"],
                          "30001-48000": row["latest.cost.avg_net_price.by_income_level.30001-48000"],
                          "48001-75000": row["latest.cost.avg_net_price.by_income_level.48001-75000"],
                          "75001-110000": row["latest.cost.avg_net_price.by_income_level.75001-110000"],
                          "110001-plus": row["latest.cost.avg_net_price.by_income_level.110001-plus"],
                        },
                      }
                    : undefined,
              }
            : undefined,
          aid:
            row["latest.aid.median_debt.completers.monthly_payments"] != null
              ? { median_debt: { completers: { monthly_payments: row["latest.aid.median_debt.completers.monthly_payments"] } } }
              : undefined,
          earnings:
            row["latest.earnings.10_yrs_after_entry.median"] != null
              ? { "10_yrs_after_entry": { median: row["latest.earnings.10_yrs_after_entry.median"] } }
              : undefined,
        }
      : undefined,
  };
  
  // Strip undefined values to prevent Firestore crashes
  return JSON.parse(JSON.stringify(college));
}

const BASE = "https://api.data.gov/ed/collegescorecard/v1/schools";

/** College Scorecard error body: `{ "error": { "code": 400, "message": "..." } }` */
async function scorecardErrorSnippet(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const j = JSON.parse(text) as { error?: { message?: string } };
    if (j?.error?.message) return j.error.message;
  } catch {
    /* ignore */
  }
  return text.slice(0, 280);
}

function getApiKey(): string {
  const apiKey = process.env.SCORECARD_API_KEY ?? process.env.COLLEGE_SCORECARD_API_KEY;
  const trimmed = apiKey?.trim();
  if (!trimmed) {
    throw new Error(
      "Set SCORECARD_API_KEY or COLLEGE_SCORECARD_API_KEY in .env.local with your api.data.gov College Scorecard key, then restart the dev server."
    );
  }
  return trimmed;
}

function buildQuery(params: ScorecardSearchParams): string {
  const u = new URLSearchParams();
  u.set("api_key", getApiKey());
  const fields = "id,school.name,school.city,school.state,school.school_url,school.location,school.locale,school.ownership,student.size,admission.admission_rate,admission.sat_scores.midpoint.critical_reading,admission.sat_scores.midpoint.math,admission.sat_scores.midpoint.writing,admission.act_scores.midpoint.cumulative,latest.student.size,latest.admission.admission_rate,latest.admissions.admission_rate.overall,latest.admissions.sat_scores.25th_percentile.critical_reading,latest.admissions.sat_scores.75th_percentile.critical_reading,latest.admissions.sat_scores.25th_percentile.math,latest.admissions.sat_scores.75th_percentile.math,latest.admissions.act_scores.25th_percentile.cumulative,latest.admissions.act_scores.75th_percentile.cumulative,latest.cost.attendance.academic_year,latest.cost.avg_net_price.overall,latest.cost.avg_net_price.by_income_level.0-30000,latest.cost.avg_net_price.by_income_level.30001-48000,latest.cost.avg_net_price.by_income_level.48001-75000,latest.cost.avg_net_price.by_income_level.75001-110000,latest.cost.avg_net_price.by_income_level.110001-plus,latest.aid.median_debt.completers.monthly_payments,latest.earnings.10_yrs_after_entry.median";
  u.set("fields", params.fields ?? fields);
  u.set("per_page", String(params.per_page ?? 20));
  if (params.page) u.set("page", String(params.page));
  if (params.schoolname) u.set("school.name", params.schoolname);
  if (params["school.degrees_awarded.predominant"]) u.set("school.degrees_awarded.predominant", params["school.degrees_awarded.predominant"]);
  if (params["school.state"]) u.set("school.state", params["school.state"]);
  if (params["school.region_id"]) u.set("school.region_id", params["school.region_id"]);
  return u.toString();
}

/** Optional HTTP retry profile (College List API uses a shorter budget; matching uses defaults). */
export async function searchSchools(
  params: ScorecardSearchParams,
  retryProfile?: { maxRetries?: number; timeoutMs?: number }
): Promise<ScorecardSearchResponse> {
  const qs = buildQuery(params);
  const res = await fetchWithRetry(`${BASE}?${qs}`, { cache: "no-store" }, retryProfile);
  if (!res.ok) {
    if (res.status === 429) throw new RateLimitError("College search rate limit exceeded. Try again in a few minutes.");
    const details = await scorecardErrorSnippet(res);
    const msg = details
      ? `College search failed (${res.status}). ${details}`
      : `College search failed (${res.status}). Please try again later.`;
    throw new ServiceUnavailableError(msg, res.status);
  }
  const data = await res.json();
  const results = (data.results as ScorecardRow[] | undefined)?.map(normalizeRow);
  return { ...data, results };
}

export async function getSchoolById(id: number): Promise<ScorecardCollege | null> {
  const apiKey = getApiKey();
  const fields = "id,school.name,school.city,school.state,school.school_url,school.location,school.locale,school.ownership,student.size,admission.admission_rate,admission.sat_scores.midpoint.critical_reading,admission.sat_scores.midpoint.math,admission.sat_scores.midpoint.writing,admission.act_scores.midpoint.cumulative,latest.student.size,latest.admission.admission_rate,latest.admissions.admission_rate.overall,latest.admissions.sat_scores.25th_percentile.critical_reading,latest.admissions.sat_scores.75th_percentile.critical_reading,latest.admissions.sat_scores.25th_percentile.math,latest.admissions.sat_scores.75th_percentile.math,latest.admissions.act_scores.25th_percentile.cumulative,latest.admissions.act_scores.75th_percentile.cumulative,latest.cost.tuition.reported,latest.cost.roomboard.reported,latest.cost.attendance.academic_year,latest.cost.avg_net_price.overall,latest.cost.avg_net_price.by_income_level.0-30000,latest.cost.avg_net_price.by_income_level.30001-48000,latest.cost.avg_net_price.by_income_level.48001-75000,latest.cost.avg_net_price.by_income_level.75001-110000,latest.cost.avg_net_price.by_income_level.110001-plus,latest.aid.median_debt.completers.monthly_payments,latest.earnings.10_yrs_after_entry.median";
  const u = new URL(BASE);
  u.searchParams.set("api_key", apiKey);
  u.searchParams.set("id", String(id));
  u.searchParams.set("fields", fields);
  const res = await fetchWithRetry(u.toString(), { next: { revalidate: 3600 } });
  if (res.status === 404) return null;
  if (!res.ok) {
    if (res.status === 429) throw new RateLimitError("College data rate limit exceeded. Try again in a few minutes.");
    const details = await scorecardErrorSnippet(res);
    const msg = details
      ? `College data failed (${res.status}). ${details}`
      : `College data failed (${res.status}). Please try again.`;
    throw new ServiceUnavailableError(msg, res.status);
  }
  const data = await res.json();
  const raw = (data?.results as ScorecardRow[] | undefined)?.[0];
  if (!raw) return null;
  const college = normalizeRow(raw);
  setCachedCollege(college.id, college);
  return college;
}
