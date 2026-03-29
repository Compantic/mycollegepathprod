"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import type { CollegeMatch } from "@/lib/matching/types";
import { CheckCircle2, ClipboardCheck, Loader2, Target } from "lucide-react";

type MatchRun = { runId: string; createdAt: string; matches: CollegeMatch[] };
type ApplyStatus = "not_started" | "researching" | "drafting" | "submitted";
type Item = { collegeId: number; name: string; tier?: "reach" | "match" | "safety"; matchScore?: number; status: ApplyStatus };

const STATUS_OPTIONS: { value: ApplyStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "researching", label: "Researching" },
  { value: "drafting", label: "Drafting application" },
  { value: "submitted", label: "Submitted" },
];

function buildBalancedShortlist(matches: CollegeMatch[]): Item[] {
  const byTier = {
    match: matches.filter((m) => m.tier === "match").slice(0, 3),
    safety: matches.filter((m) => m.tier === "safety").slice(0, 2),
    reach: matches.filter((m) => m.tier === "reach").slice(0, 2),
  };
  const merged = [...byTier.match, ...byTier.safety, ...byTier.reach];
  const fallback = matches.filter((m) => !merged.some((x) => x.id === m.id)).slice(0, Math.max(0, 7 - merged.length));
  return [...merged, ...fallback].slice(0, 7).map((m) => ({
    collegeId: m.id,
    name: m.name,
    tier: m.tier,
    matchScore: m.matchScore,
    status: "not_started",
  }));
}

export function ApplyNowPageContent() {
  const searchParams = useSearchParams();
  const selectedFromQuery = searchParams.get("runId");

  const [runs, setRuns] = useState<MatchRun[]>([]);
  const [runId, setRunId] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRuns() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth("/api/matching/history?limit=10", { method: "GET" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load matching runs");
        if (cancelled) return;
        const loaded = (data.runs ?? []) as MatchRun[];
        setRuns(loaded);
        const initial = selectedFromQuery && loaded.some((r) => r.runId === selectedFromQuery)
          ? selectedFromQuery
          : (loaded[0]?.runId ?? "");
        setRunId(initial);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadRuns();
    return () => {
      cancelled = true;
    };
  }, [selectedFromQuery]);

  useEffect(() => {
    if (!runId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    async function loadShortlist() {
      setError(null);
      try {
        const res = await fetchWithAuth(`/api/apply-now?runId=${encodeURIComponent(runId)}`, { method: "GET" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load shortlist");
        if (cancelled) return;
        const existing = data.shortlist?.items as Item[] | undefined;
        if (existing?.length) {
          setItems(existing);
          return;
        }
        const run = runs.find((r) => r.runId === runId);
        if (!run) return;
        setItems(buildBalancedShortlist(run.matches));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load shortlist");
      }
    }
    loadShortlist();
    return () => {
      cancelled = true;
    };
  }, [runId, runs]);

  const submittedCount = useMemo(() => items.filter((i) => i.status === "submitted").length, [items]);

  async function saveNow(nextItems: Item[]) {
    if (!runId) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/apply-now", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, items: nextItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save shortlist");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save shortlist");
    } finally {
      setSaving(false);
    }
  }

  function updateStatus(collegeId: number, status: ApplyStatus) {
    const next = items.map((i) => (i.collegeId === collegeId ? { ...i, status } : i));
    setItems(next);
    void saveNow(next);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <ClipboardCheck className="h-6 w-6 text-primary-500" />
          Apply Now Shortlist
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Build an apply shortlist from a matching run and track each school&apos;s application status in one place.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Selected schools</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">{items.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Submitted</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{submittedCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Run</p>
            <select
              value={runId}
              onChange={(e) => setRunId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-text-primary"
            >
              {runs.map((r) => (
                <option key={r.runId} value={r.runId}>
                  {new Date(r.createdAt).toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-text-muted">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Loading shortlist...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-text-muted">
          No matching runs found. First run matching from{" "}
          <Link href="/app/documents" className="font-semibold text-primary-600 hover:underline">
            College Matching
          </Link>.
        </div>
      )}

      {!loading && items.length > 0 && (
        <section className="space-y-3">
          {items.map((item) => (
            <div key={item.collegeId} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-text-primary">{item.name}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                    <Target className="h-3.5 w-3.5 text-primary-500" />
                    {item.tier ? item.tier.toUpperCase() : "—"} · {item.matchScore != null ? `${item.matchScore.toFixed(1)}%` : "No score"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(e) => updateStatus(item.collegeId, e.target.value as ApplyStatus)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-text-primary"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Link
                    href={`/app/colleges/${item.collegeId}`}
                    className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100"
                  >
                    View school
                  </Link>
                </div>
              </div>
              {item.status === "submitted" && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Submitted
                </p>
              )}
            </div>
          ))}
          <p className="text-xs text-text-muted">{saving ? "Saving changes..." : "All changes saved."}</p>
        </section>
      )}
    </div>
  );
}
