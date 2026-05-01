"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import type { CollegeMatch } from "@/lib/matching/types";
import { CheckCircle2, ClipboardCheck, Loader2, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";

type MatchRun = { runId: string; createdAt: string; matches: CollegeMatch[] };
type ApplyStatus = "not_started" | "researching" | "drafting" | "submitted";
type Item = {
  collegeId: number;
  name: string;
  tier?: "reach" | "match" | "safety";
  matchScore?: number;
  status: ApplyStatus;
};

const STATUS_OPTIONS: { value: ApplyStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "researching", label: "Researching" },
  { value: "drafting", label: "Drafting application" },
  { value: "submitted", label: "Submitted" },
];

const TIER_BADGE: Record<NonNullable<Item["tier"]>, string> = {
  reach: "border-amber-200 bg-amber-50 text-amber-900",
  match: "border-blue-200 bg-blue-50 text-blue-900",
  safety: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

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
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const selectedFromQuery = searchParams.get("runId");

  const [runs, setRuns] = useState<MatchRun[]>([]);
  const [runId, setRunId] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: reduceMotion ? 0 : 0.05,
          delayChildren: reduceMotion ? 0 : 0.06,
        },
      },
    }),
    [reduceMotion]
  );

  const itemVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 320, damping: 28 },
      },
    }),
    [reduceMotion]
  );

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
        const initial =
          selectedFromQuery && loaded.some((r) => r.runId === selectedFromQuery)
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

  const selectClass =
    "w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/15";

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      <section className="relative overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-white via-slate-50/90 to-primary-50/35 p-6 shadow-onboarding-card sm:p-8">
        <div
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0f1b2d] via-primary-600 to-amber-400"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 -top-12 h-44 w-44 rounded-full bg-primary-400/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-amber-300/18 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4 sm:gap-5">
            <motion.div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/35"
              whileHover={reduceMotion ? undefined : { scale: 1.04 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
            >
              <ClipboardCheck className="h-8 w-8" strokeWidth={1.75} aria-hidden />
            </motion.div>
            <div>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-700">
                <Sparkles className="h-3 w-3 text-amber-500" aria-hidden />
                Application hub
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Apply Now Shortlist
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                <span className="italic text-amber-600/90">One list, every deadline mindset.</span> Build a shortlist
                from a matching run and track each school&apos;s application status in one place.
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm ring-1 ring-blue-100/60">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-900/80">Selected schools</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{items.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm ring-1 ring-emerald-100/60">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-900/80">Submitted</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-700">{submittedCount}</p>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 shadow-sm ring-1 ring-violet-100/60">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-violet-900/80">Matching run</p>
            <select
              value={runId}
              onChange={(e) => setRunId(e.target.value)}
              disabled={runs.length === 0}
              className={cn(selectClass, "mt-2")}
              aria-label="Select matching run"
            >
              {runs.length === 0 ? (
                <option value="">No runs yet</option>
              ) : (
                runs.map((r) => (
                  <option key={r.runId} value={r.runId}>
                    {new Date(r.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </section>

      {loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-6 text-sm text-slate-600 shadow-md">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary-600" aria-hidden />
          Loading shortlist…
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm font-medium text-red-800 shadow-sm">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/90 to-white p-8 text-center shadow-inner">
          <p className="text-sm text-slate-600">
            No matching runs found. First run matching from{" "}
            <Link
              href="/app/documents"
              className="font-bold text-primary-700 underline-offset-2 hover:underline"
            >
              College Matching
            </Link>
            .
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <motion.section
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {items.map((item) => (
            <motion.div
              key={item.collegeId}
              variants={itemVariants}
              className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-900 sm:text-lg">{item.name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    {item.tier && (
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                          TIER_BADGE[item.tier]
                        )}
                      >
                        {item.tier}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                      <Target className="h-3.5 w-3.5 text-primary-600" aria-hidden />
                      {item.matchScore != null ? `${item.matchScore.toFixed(1)}% match` : "No score"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(e) => updateStatus(item.collegeId, e.target.value as ApplyStatus)}
                    className={selectClass}
                    aria-label={`Status for ${item.name}`}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Link
                    href={`/app/colleges/${item.collegeId}`}
                    className="inline-flex items-center justify-center rounded-xl border border-primary-500/80 bg-white px-4 py-2.5 text-sm font-bold text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
                  >
                    View school
                  </Link>
                </div>
              </div>
              {item.status === "submitted" && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Submitted
                </p>
              )}
            </motion.div>
          ))}
          <p className="text-center text-xs font-medium text-slate-500 sm:text-left">
            {saving ? "Saving changes…" : "All changes saved."}
          </p>
        </motion.section>
      )}
    </motion.div>
  );
}
