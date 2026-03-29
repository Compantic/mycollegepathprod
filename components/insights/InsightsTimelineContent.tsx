"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import type { CollegeMatch } from "@/lib/matching/types";
import type { RoadmapResult } from "@/lib/roadmap/types";
import { TrendingUp, CalendarDays, Target, Map, CheckCircle2 } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchRuns, setMatchRuns] = useState<MatchingRunHistory[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapHistory[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

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
      const completed = items.filter((id) => serverCompleted.includes(id) || completedIds.includes(`${r.roadmapId}:${id}`)).length;
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
  const prevRoadRisk =
    roadmapTimeline[1] ? roadmapTimeline[1].critical + roadmapTimeline[1].important : null;
  const riskDelta =
    latestRoadRisk != null && prevRoadRisk != null ? latestRoadRisk - prevRoadRisk : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <TrendingUp className="h-6 w-6 text-primary-500" />
          Insight Timeline
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Compare matching and roadmap history, see progress trends, and track completed actions.
        </p>
      </div>

      {loading && <div className="rounded-xl border border-bg-border bg-white p-4 text-sm text-text-muted">Loading insights…</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      {!loading && !error && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-bg-border bg-white p-4">
              <p className="text-xs font-semibold uppercase text-text-muted">Latest Avg Match Score</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{latestMatch ? `${latestMatch.avgScore}%` : "—"}</p>
              <p className="mt-1 text-xs text-text-muted">
                {avgDelta == null ? "Need at least 2 runs." : `Delta vs previous run: ${avgDelta >= 0 ? "+" : ""}${avgDelta} pts`}
              </p>
            </div>
            <div className="rounded-xl border border-bg-border bg-white p-4">
              <p className="text-xs font-semibold uppercase text-text-muted">Roadmap Risk Trend</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{latestRoadRisk != null ? latestRoadRisk : "—"}</p>
              <p className="mt-1 text-xs text-text-muted">
                {riskDelta == null ? "Need at least 2 roadmaps." : `Critical+Important gaps delta: ${riskDelta >= 0 ? "+" : ""}${riskDelta}`}
              </p>
            </div>
            <div className="rounded-xl border border-bg-border bg-white p-4">
              <p className="text-xs font-semibold uppercase text-text-muted">Completed Actions</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">
                {latestRoadmap ? `${latestRoadmap.completedActions}/${latestRoadmap.totalActions}` : "—"}
              </p>
              <p className="mt-1 text-xs text-text-muted">Based on your checklist below.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-bg-border bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
              <Target className="h-5 w-5 text-primary-500" />
              Matching Timeline
            </h2>
            <div className="space-y-3">
              {matchTimeline.length === 0 && <p className="text-sm text-text-muted">No matching runs yet.</p>}
              {matchTimeline.map((r) => (
                <div key={r.runId} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-text-primary">{fmtDate(r.createdAt)}</p>
                    <p className="text-sm font-bold text-primary-600">{r.avgScore}% avg</p>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    Reach: {r.reach} · Match: {r.match} · Safety: {r.safety}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-bg-border bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
              <Map className="h-5 w-5 text-primary-500" />
              Roadmap Timeline
            </h2>
            <div className="space-y-3">
              {roadmapTimeline.length === 0 && <p className="text-sm text-text-muted">No roadmap runs yet.</p>}
              {roadmapTimeline.map((r) => (
                <div key={r.roadmapId} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-text-primary">{fmtDate(r.createdAt)}</p>
                    <p className="text-sm font-bold text-primary-600">{r.roadmap.phases.length} phases</p>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    Critical gaps: {r.critical} · Important gaps: {r.important} · Completed actions: {r.completedActions}/{r.totalActions}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-bg-border bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-primary">
              <CalendarDays className="h-5 w-5 text-primary-500" />
              Action Completion Tracker (Latest Roadmap)
            </h2>
            {latestActions.length === 0 ? (
              <p className="text-sm text-text-muted">Generate a roadmap to track completed actions.</p>
            ) : (
              <div className="space-y-2">
                {latestActions.map((a) => {
                  const checked = isActionChecked(a.id);
                  return (
                    <label key={a.id} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAction(a.id)}
                        className="mt-0.5"
                      />
                      <span className={checked ? "text-text-muted line-through" : "text-text-primary"}>
                        {a.text}
                      </span>
                      {checked && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />}
                    </label>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

