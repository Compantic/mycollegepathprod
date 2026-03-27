"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import type { RoadmapResult } from "@/lib/roadmap/types";

export type RoadmapHistoryRun = {
  roadmapId: string;
  createdAt: string;
  roadmap: RoadmapResult;
  completedItemIds?: string[];
};

export function useRoadmapHistory(enabled: boolean) {
  const [history, setHistory] = useState<RoadmapHistoryRun[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [completionMap, setCompletionMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const res = await fetchWithAuth("/api/roadmap/history?limit=10", { method: "GET" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load roadmap history");
        if (cancelled) return;
        const runs = (data.runs ?? []) as RoadmapHistoryRun[];
        const nextMap: Record<string, string[]> = {};
        for (const run of runs) {
          nextMap[run.roadmapId] = Array.isArray(run.completedItemIds) ? run.completedItemIds : [];
        }
        setHistory(runs);
        setCompletionMap(nextMap);
      } catch (err) {
        if (!cancelled) {
          setHistoryError(err instanceof Error ? err.message : "Could not load saved roadmaps.");
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    history,
    setHistory,
    historyLoading,
    historyError,
    completionMap,
    setCompletionMap,
  };
}
