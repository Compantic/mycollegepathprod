"use client";

import { useEffect, useMemo, useState } from "react";
import { isFirstTenStepDone } from "@/lib/activation/firstTen";

export const FIRST_TEN_ACTIVATION_STEPS = [
  { id: "colleges", label: "Add at least 3 colleges", href: "/app/colleges" },
  { id: "matching", label: "Run a matching session", href: "/app/matching" },
  { id: "roadmap", label: "Create a roadmap", href: "/app/myroad" },
  { id: "chat", label: "Ask your first question in AI Consultant", href: "/app/chat" },
] as const;

export function useFirstTenActivation(uid?: string, options?: { enabled?: boolean; savedCollegesCount?: number }) {
  const enabled = options?.enabled;
  const savedCollegesCount = options?.savedCollegesCount ?? 0;
  const storageKey = useMemo(() => `activation_first10_${uid ?? "anon"}`, [uid]);
  const [dismissed, setDismissed] = useState(false);
  const [flags, setFlags] = useState({ matching: false, roadmap: false, chat: false });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { done?: string[]; dismissed?: boolean };
      setDismissed(Boolean(parsed.dismissed));
    } catch {
      // noop
    }
  }, [storageKey]);

  useEffect(() => {
    setFlags({
      matching: isFirstTenStepDone(uid, "matching"),
      roadmap: isFirstTenStepDone(uid, "roadmap"),
      chat: isFirstTenStepDone(uid, "chat"),
    });
  }, [uid, savedCollegesCount]);

  function persist(nextDismissed = dismissed) {
    setDismissed(nextDismissed);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ dismissed: nextDismissed }));
    } catch {
      // noop
    }
  }

  const done = useMemo(() => {
    const ids: string[] = [];
    if (savedCollegesCount >= 3) ids.push("colleges");
    if (flags.matching) ids.push("matching");
    if (flags.roadmap) ids.push("roadmap");
    if (flags.chat) ids.push("chat");
    return ids;
  }, [savedCollegesCount, flags]);

  const show = Boolean(enabled) && !dismissed && done.length < FIRST_TEN_ACTIVATION_STEPS.length;

  return {
    steps: FIRST_TEN_ACTIVATION_STEPS,
    done,
    dismissed,
    show,
    persist,
  };
}
