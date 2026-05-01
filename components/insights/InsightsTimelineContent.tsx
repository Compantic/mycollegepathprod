"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { auth } from "@/lib/firebase/client";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import type { CollegeMatch } from "@/lib/matching/types";
import type { RoadmapResult } from "@/lib/roadmap/types";
import { TrendingUp, CalendarDays, Target, Map, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type MatchingRunHistory = { runId: string; createdAt: string; matches: CollegeMatch[] };
type RoadmapHistory = { roadmapId: string; createdAt: string; roadmap: RoadmapResult; completedItemIds?: string[] };

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InsightsTimelineContent() {
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchRuns, setMatchRuns] = useState<MatchingRunHistory[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapHistory[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: reduceMotion ? 0 : 0.06,
          delayChildren: reduceMotion ? 0 : 0.05,
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

  const completionKey = useMemo(() => {
    const uid = auth.currentUser?.uid ?? "anon";
    return `insightsCompletedActions_${uid}`;
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(completionKey);
      if (raw) setCompletedIds(JSON.parse(raw) as string[]);
    } catch {
      // noop
    }
  }, [completionKey]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [mRes, rRes] = await Promise.all([
          fetchWithAuth("/api/matching/history?limit=12", { method: "GET" }),
          fetchWithAuth("/api/roadmap/history?limit=12", { method: "GET" }),
        ]);
        const [mData, rData] = await Promise.all([mRes.json(), rRes.json()]);
        if (!mRes.ok) throw new Error(mData.error ?? "Failed to load matching timeline");
        if (!rRes.ok) throw new Error(rData.error ?? "Failed to load roadmap timeline");
        if (cancelled) return;
        setMatchRuns((mData.runs ?? []) as MatchingRunHistory[]);
        setRoadmaps((rData.runs ?? []) as RoadmapHistory[]);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load insights");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const matchTimeline = useMemo(() => {
    return matchRuns.map((r) => {
      const total = r.matches.length || 1;
      const avg = r.matches.reduce((s, m) => s + m.matchScore, 0) / total;
      const reach = r.matches.filter((m) => m.tier === "reach").length;
      const match = r.matches.filter((m) => m.tier === "match").length;
      const safety = r.matches.filter((m) => m.tier === "safety").length;
      return {
        ...r,
        avgScore: Math.round(avg * 10) / 10,
        reach,
        match,
        safety,
      };
    });
  }, [matchRuns]);

  const roadmapTimeline = useMemo(() => {
    return roadmaps.map((r) => {
      const critical = r.roadmap.gaps.filter((g) => g.severity === "critical").length;
      const important = r.roadmap.gaps.filter((g) => g.severity === "important").length;
      const items = r.roadmap.phases.flatMap((p) => p.items.map((i) => i.id));
      const serverCompleted = Array.isArray(r.completedItemIds) ? r.completedItemIds : [];
      const completed = items.filter(
        (id) => serverCompleted.includes(id) || completedIds.includes(`${r.roadmapId}:${id}`)
      ).length;
      return {
        ...r,
        critical,
        important,
        totalActions: items.length,
        completedActions: completed,
      };
    });
  }, [roadmaps, completedIds]);

  const latestRoadmap = roadmapTimeline[0];
  const latestActions = latestRoadmap
    ? latestRoadmap.roadmap.phases
        .flatMap((p) => p.items.map((i) => ({ id: `${latestRoadmap.roadmapId}:${i.id}`, text: i.text, priority: i.priority })))
        .slice(0, 12)
    : [];

  function toggleAction(id: string) {
    setCompletedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(completionKey, JSON.stringify(next));
      } catch {
        // noop
      }
      return next;
    });
  }

  function isActionChecked(actionId: string): boolean {
    if (!latestRoadmap) return completedIds.includes(actionId);
    const itemId = actionId.split(":").slice(1).join(":");
    const serverCompleted = Array.isArray(latestRoadmap.completedItemIds) ? latestRoadmap.completedItemIds : [];
    return serverCompleted.includes(itemId) || completedIds.includes(actionId);
  }

  const latestMatch = matchTimeline[0];
  const prevMatch = matchTimeline[1];
  const avgDelta =
    latestMatch && prevMatch ? Math.round((latestMatch.avgScore - prevMatch.avgScore) * 10) / 10 : null;

  const latestRoadRisk = latestRoadmap ? latestRoadmap.critical + latestRoadmap.important : null;
  const prevRoadRisk = roadmapTimeline[1] ? roadmapTimeline[1].critical + roadmapTimeline[1].important : null;
  const riskDelta =
    latestRoadRisk != null && prevRoadRisk != null ? latestRoadRisk - prevRoadRisk : null;

  const sectionHeaderClass =
    "mb-4 flex items-center gap-3 text-lg font-semibold text-slate-900 sm:text-xl";

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      <motion.section
        className="relative overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-white via-slate-50/90 to-primary-50/35 p-6 shadow-onboarding-card sm:p-8"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0f1b2d] via-primary-600 to-amber-400"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-16 -top-12 h-44 w-44 rounded-full bg-primary-400/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" aria-hidden />

        <div className="relative flex items-start gap-4 sm:gap-5">
          <motion.div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/35"
            whileHover={reduceMotion ? undefined : { scale: 1.04 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
          >
            <TrendingUp className="h-8 w-8" strokeWidth={1.75} aria-hidden />
          </motion.div>
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-700">
              <Sparkles className="h-3 w-3 text-amber-500" aria-hidden />
              Progress lens
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Insight Timeline</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              <span className="italic text-amber-600/90">See the arc, not just the moment.</span> Compare matching and
              roadmap history, spot trends, and check off actions from your latest plan.
            </p>
          </div>
        </div>
      </motion.section>

      {loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-5 text-sm font-medium text-slate-600 shadow-md">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary-500" aria-hidden />
          Loading insights…
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm font-medium text-red-800 shadow-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
          <motion.section className="grid gap-3 md:grid-cols-3" variants={itemVariants}>
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm ring-1 ring-blue-100/60">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-900/80">Latest avg match score</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-primary-600">
                {latestMatch ? `${latestMatch.avgScore}%` : "—"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {avgDelta == null ? "Need at least 2 runs." : `Delta vs previous run: ${avgDelta >= 0 ? "+" : ""}${avgDelta} pts`}
              </p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 shadow-sm ring-1 ring-violet-100/60">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-violet-900/80">Roadmap risk trend</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
                {latestRoadRisk != null ? latestRoadRisk : "—"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {riskDelta == null
                  ? "Need at least 2 roadmaps."
                  : `Critical+Important gaps delta: ${riskDelta >= 0 ? "+" : ""}${riskDelta}`}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm ring-1 ring-emerald-100/60">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-900/80">Completed actions</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
                {latestRoadmap ? `${latestRoadmap.completedActions}/${latestRoadmap.totalActions}` : "—"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">Based on your checklist below.</p>
            </div>
          </motion.section>

          <motion.section
            className="rounded-3xl border border-slate-200/90 bg-white/95 p-5 shadow-onboarding-card backdrop-blur-sm sm:p-6"
            variants={itemVariants}
          >
            <h2 className={sectionHeaderClass}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary-600 ring-1 ring-blue-100">
                <Target className="h-5 w-5" aria-hidden />
              </span>
              Matching Timeline
            </h2>
            <div className="space-y-3">
              {matchTimeline.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                  No matching runs yet.
                </p>
              )}
              <motion.div
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {matchTimeline.map((r) => (
                  <motion.div
                    key={r.runId}
                    variants={itemVariants}
                    className="rounded-2xl border border-slate-200/90 bg-gradient-to-r from-white to-slate-50/50 p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">{fmtDate(r.createdAt)}</p>
                      <p className="text-sm font-bold tabular-nums text-primary-600">{r.avgScore}% avg</p>
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-slate-600">
                      Reach: {r.reach} · Match: {r.match} · Safety: {r.safety}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            className="rounded-3xl border border-slate-200/90 bg-white/95 p-5 shadow-onboarding-card backdrop-blur-sm sm:p-6"
            variants={itemVariants}
          >
            <h2 className={sectionHeaderClass}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                <Map className="h-5 w-5" aria-hidden />
              </span>
              Roadmap Timeline
            </h2>
            <div className="space-y-3">
              {roadmapTimeline.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                  No roadmap runs yet.
                </p>
              )}
              <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
                {roadmapTimeline.map((r) => (
                  <motion.div
                    key={r.roadmapId}
                    variants={itemVariants}
                    className="rounded-2xl border border-slate-200/90 bg-gradient-to-r from-white to-violet-50/30 p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">{fmtDate(r.createdAt)}</p>
                      <p className="text-sm font-bold tabular-nums text-primary-600">{r.roadmap.phases.length} phases</p>
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-slate-600">
                      Critical gaps: {r.critical} · Important gaps: {r.important} · Completed actions:{" "}
                      {r.completedActions}/{r.totalActions}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            className="rounded-3xl border border-slate-200/90 bg-white/95 p-5 shadow-onboarding-card backdrop-blur-sm sm:p-6"
            variants={itemVariants}
          >
            <h2 className={cn(sectionHeaderClass, "mb-4")}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                <CalendarDays className="h-5 w-5" aria-hidden />
              </span>
              Action Completion Tracker (Latest Roadmap)
            </h2>
            {latestActions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                Generate a roadmap to track completed actions.
              </p>
            ) : (
              <motion.div className="space-y-2" variants={containerVariants} initial="hidden" animate="visible">
                {latestActions.map((a) => {
                  const checked = isActionChecked(a.id);
                  return (
                    <motion.label
                      key={a.id}
                      variants={itemVariants}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-2xl border p-3 text-sm shadow-sm transition-colors",
                        checked
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAction(a.id)}
                        className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-primary-600 focus:ring-primary-500/30"
                        aria-label={`Toggle: ${a.text}`}
                      />
                      <span className={cn("min-w-0 flex-1 font-medium", checked ? "text-slate-500 line-through" : "text-slate-900")}>
                        {a.text}
                      </span>
                      {checked && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />}
                    </motion.label>
                  );
                })}
              </motion.div>
            )}
          </motion.section>
        </motion.div>
      )}
    </motion.div>
  );
}
