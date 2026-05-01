"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/client";
import {
  getFavoriteColleges,
  addFavoriteCollege,
  removeFavoriteCollege,
} from "@/lib/firebase/firestore";
import { useToastOptional } from "@/components/ui/toast";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import type { CollegeMatch, MatchTier } from "@/lib/matching/types";
import { ChevronDown, ChevronUp, Star, Zap, MapPin, Building2, HelpCircle, BookOpen, Gauge } from "lucide-react";
import { markFirstTenStepDone } from "@/lib/activation/firstTen";

export function MatchingRun({ basePath = "/app/colleges" }: { basePath?: string }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [runId, setRunId] = useState<string | null>(null);
  const [matches, setMatches] = useState<CollegeMatch[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [runs, setRuns] = useState<{ runId: string; createdAt: string; matches: CollegeMatch[] }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [favoriteToggling, setFavoriteToggling] = useState<number | null>(null);

  const { toast } = useToastOptional();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    getFavoriteColleges(user.uid)
      .then((list) => setFavoriteIds(new Set(list.map((f) => f.collegeId))))
      .catch(() => {});
  }, [user]);

  // Load recent matching history on mount so the user can see past runs.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const res = await fetchWithAuth("/api/matching/history?limit=10", { method: "GET" });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load matching history");
        }
        if (cancelled) return;
        const loadedRuns = (data.runs ?? []) as { runId: string; createdAt: string; matches: CollegeMatch[] }[];
        setRuns(loadedRuns);
        if (!matches.length && loadedRuns.length > 0) {
          setRunId(loadedRuns[0].runId);
          setMatches(loadedRuns[0].matches ?? []);
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Could not load previous matches.";
        setHistoryError(msg);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }

    // Realistic "decaying" progress animation:
    // Starts fast, then slows down as it gets closer to 100%, but never quite reaches it until finished.
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98; // Stay at 98 until setLoading(false)
        
        const remaining = 100 - prev;
        // The closer we get, the smaller the increment
        const step = Math.random() * (remaining / 12) + 0.1;
        const next = prev + step;
        return next > 98 ? 98 : next;
      });
    }, 180);

    return () => clearInterval(timer);
  }, [loading]);

  async function runMatch() {
    setLoading(true);
    setError(null);
    setMatches([]);
    setRunId(null);
    try {
      const res = await fetchWithAuth("/api/matching/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        const message = res.status === 401 ? "Please sign in to run matching." : (data.error ?? "Matching failed");
        throw new Error(message);
      }
      const newRunId: string = data.runId ?? `run-${Date.now()}`;
      const newMatches: CollegeMatch[] = data.matches ?? [];
      setRunId(newRunId);
      setMatches(newMatches);
      setRuns((prev) => [
        { runId: newRunId, createdAt: new Date().toISOString(), matches: newMatches },
        ...prev,
      ]);
      markFirstTenStepDone(user?.uid, "matching");
      setProgress(100);
      toast({ description: "Matches updated.", variant: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      toast({ description: msg, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(m: CollegeMatch) {
    if (!user) return;
    setFavoriteToggling(m.id);
    try {
      const isFav = favoriteIds.has(m.id);
      if (isFav) {
        await removeFavoriteCollege(user.uid, m.id);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(m.id);
          return next;
        });
        toast({ description: "Removed from favorites.", variant: "success" });
      } else {
        await addFavoriteCollege(user.uid, m.id, m.name);
        setFavoriteIds((prev) => new Set(prev).add(m.id));
        toast({ description: "Added to favorites.", variant: "success" });
      }
    } catch {
      toast({ description: "Could not update favorites.", variant: "error" });
    } finally {
      setFavoriteToggling(null);
    }
  }

  const tierConfig: Record<MatchTier, { label: string; badgeClass: string; barClass: string; borderClass: string }> = {
    reach: { label: "Reach", badgeClass: "bg-amber-600 text-white", barClass: "bg-amber-500", borderClass: "border-l-amber-500" },
    match: { label: "Match", badgeClass: "bg-primary-500 text-white", barClass: "bg-primary-500", borderClass: "border-l-primary-500" },
    safety: { label: "Safety", badgeClass: "bg-emerald-600 text-white", barClass: "bg-emerald-500", borderClass: "border-l-emerald-500" },
  };

  const tierCounts = matches.reduce(
    (acc, m) => {
      acc[m.tier] += 1;
      return acc;
    },
    { reach: 0, match: 0, safety: 0 } as Record<MatchTier, number>
  );
  const totalMatches = matches.length || 1;
  const tierPct = {
    reach: Math.round((tierCounts.reach / totalMatches) * 100),
    match: Math.round((tierCounts.match / totalMatches) * 100),
    safety: Math.round((tierCounts.safety / totalMatches) * 100),
  };

  function portfolioAdvice(): string {
    if (!matches.length) return "";
    if (tierPct.reach > 40) {
      return "Your list is reach-heavy. Add 2-3 stronger safety/match schools to reduce admission risk.";
    }
    if (tierPct.safety < 15) {
      return "Safety coverage is low. Add at least 2 safety schools with high admit probability.";
    }
    if (tierPct.match < 35) {
      return "Match-school coverage is light. Add more realistic targets to improve outcome quality.";
    }
    return "Your portfolio looks balanced. Keep monitoring fit and application quality for top choices.";
  }

  return (
    <div className="space-y-6">
      {/* Run Matching CTA */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-primary-50/40 to-amber-50/30 p-6 shadow-onboarding-card sm:p-8">
        <div
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0f1b2d] via-primary-600 to-amber-400"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-20 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-primary-400/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/30">
              <Zap className="h-7 w-7" aria-hidden />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700">Ready when you are</p>
              <h2 className="text-xl font-semibold text-slate-900">Get your matches</h2>
              <p className="mt-1 text-sm text-slate-600">
                {user
                  ? "We use your saved profile and questionnaire answers. Update them in your profile if needed."
                  : "Sign in to run matching with your profile and questionnaire answers."}
              </p>
            </div>
          </div>
          <Button
            onClick={runMatch}
            disabled={loading}
            size="lg"
            className="shrink-0 rounded-xl border-0 bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 text-base font-bold text-white shadow-lg shadow-primary-600/25 transition-all hover:from-primary-600 hover:to-primary-700 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:opacity-60"
          >
            {loading ? "Finding matches…" : "Run Matching"}
          </Button>
        </div>
        {runs.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
            <div>
              <span className="font-semibold text-text-secondary">Previous runs:</span>{" "}
              <select
                value={runId ?? (runs[0]?.runId ?? "")}
                onChange={(e) => {
                  const id = e.target.value;
                  const selected = runs.find((r) => r.runId === id);
                  if (selected) {
                    setRunId(selected.runId);
                    setMatches(selected.matches ?? []);
                    setExpandedId(null);
                  }
                }}
                className="ml-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-text-primary shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500/60"
              >
                {runs.map((r) => (
                  <option key={r.runId} value={r.runId}>
                    {new Date(r.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </option>
                ))}
              </select>
            </div>
            {historyLoading && <span>Loading previous matches…</span>}
            {!historyLoading && historyError && (
              <span className="text-amber-700">{historyError}</span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="animate-in fade-in rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4 rounded-2xl border-2 border-primary-500/20 bg-gradient-to-b from-primary-50/50 to-white p-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-text-primary">Finding schools that fit your profile…</h3>
            <span className="text-sm font-bold tabular-nums text-primary-600">{Math.floor(progress)}%</span>
          </div>
          <div className="overflow-hidden rounded-xl bg-slate-200/80">
            <div
              className="h-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-xs text-text-muted">
            {progress < 100 ? "Searching your preferred states and scoring schools…" : "Done!"}
          </p>
        </div>
      )}

      {!loading && matches.length > 0 && (
        <div className="space-y-5">

          <div>
            <h3 className="flex items-center gap-2 text-xl font-bold text-text-primary">
              <Building2 className="h-6 w-6 text-primary-500" aria-hidden />
              Your matches ({matches.length})
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              Match scores use your GPA, test scores, activities, preferences, and onboarding questionnaire answers together with each school&apos;s data. Fill out more of your profile for even finer results.
            </p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-1" role="list">
            {matches.map((m, index) => {
              const tier = tierConfig[m.tier];
              const isExpanded = expandedId === m.id;
              return (
                <li
                  key={m.id}
                  className={`animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-2xl border-2 border-bg-border border-l-4 ${tier.borderClass} bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden`}
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
                >
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`${basePath}/${m.id}`}
                            className="font-bold text-lg text-text-primary hover:text-primary-500 hover:underline"
                          >
                            {m.name}
                          </Link>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tier.badgeClass}`}>
                            {tier.label}
                          </span>
                          {m.dataLimited && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800" title="Admission/SAT/ACT data for this school is limited in our dataset">
                              Limited data
                            </span>
                          )}
                        </div>
                        {(m.city || m.state) && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-text-muted">
                            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                            {[m.city, m.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="block text-2xl font-bold tabular-nums text-text-primary">{Number(m.matchScore).toFixed(1)}%</span>
                          <span className="text-xs text-text-muted">match</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite(m);
                          }}
                          disabled={favoriteToggling === m.id}
                          className="rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                          aria-label={favoriteIds.has(m.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star className="h-5 w-5" fill={favoriteIds.has(m.id) ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={m.matchScore} aria-valuemin={0} aria-valuemax={100}>
                      <div className={`h-full rounded-full transition-[width] duration-500 ${tier.barClass}`} style={{ width: `${m.matchScore}%` }} />
                    </div>
                    {m.factorBreakdown && (
                      <div className="mt-2 text-xs text-text-muted">
                        <span className="font-semibold text-text-secondary">Score breakdown:</span>{" "}
                        {Object.entries(m.factorBreakdown)
                          .filter(([, value]) => typeof value === "number" && value > 0)
                          .sort((a, b) => {
                            const order: Record<string, number> = {
                              gpa: 1,
                              sat: 2,
                              act: 3,
                              location: 4,
                              size: 5,
                              selectivity: 6,
                              activities: 7,
                              personality: 8,
                              budget: 9,
                              major: 10,
                            };
                            const ak = a[0];
                            const bk = b[0];
                            return (order[ak] ?? 99) - (order[bk] ?? 99);
                          })
                          .slice(0, 7)
                          .map(([key, value], idx, arr) => {
                            const labelMap: Record<string, string> = {
                              gpa: "GPA",
                              sat: "SAT",
                              act: "ACT",
                              location: "Location",
                              size: "Campus size",
                              selectivity: "Selectivity",
                              activities: "Activities",
                              personality: "Campus culture",
                              budget: "Budget Fit",
                              major: "Major Fit",
                            };
                            const label = labelMap[key] ?? key;
                            const suffix = idx === arr.length - 1 ? "" : ", ";
                            return `${label} ~${(value as number).toFixed(1)} pts${suffix}`;
                          })}
                      </div>
                    )}
                    {m.reasons.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-2" role="list">
                        {m.reasons.map((r, i) => (
                          <li key={i} className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm text-primary-800 border border-primary-100">
                            {r}
                          </li>
                        ))}
                      </ul>
                    )}
                    {m.improveTips.length > 0 && (
                      <div className="mt-5 border-t border-bg-border pt-4">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : m.id)}
                          className="flex w-full items-center justify-between gap-2 rounded-xl py-2 text-left text-sm font-semibold text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                          aria-expanded={isExpanded}
                        >
                          <span>How to improve your chances at {m.name}</span>
                          {isExpanded ? <ChevronUp className="h-5 w-5 shrink-0" /> : <ChevronDown className="h-5 w-5 shrink-0" />}
                        </button>
                        {isExpanded && (
                          <ul className="mt-3 space-y-2 pl-1" role="list">
                            {m.improveTips.map((tip, i) => (
                              <li key={i} className="flex gap-2 text-sm text-text-secondary">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" aria-hidden />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!loading && matches.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-500/30 bg-gradient-to-b from-primary-50/50 to-white py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/20 to-amber-500/20 text-primary-600 shadow-inner">
            <Zap className="h-10 w-10" aria-hidden />
          </div>
          <p className="mt-6 max-w-md text-lg font-semibold text-text-primary">
            Ready to discover colleges that fit you?
          </p>
          <p className="mt-2 max-w-sm text-sm text-text-muted">
            Click &quot;Run Matching&quot; above to get up to 20 personalized recommendations in your preferred states, with reach, match, and safety schools.
          </p>
        </div>
      )}
    </div>
  );
}
