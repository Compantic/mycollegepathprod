"use client";

import { useEffect, useMemo, useState } from "react";

export const FIRST_TEN_ACTIVATION_STEPS = [
  { id: "profile", label: "Complete your profile", href: "/app/profile" },
  { id: "colleges", label: "Add at least 3 colleges", href: "/app/colleges" },
  { id: "matching", label: "Run a matching session", href: "/app/matching" },
  { id: "roadmap", label: "Create a roadmap", href: "/app/myroad" },
  { id: "chat", label: "Ask your first question in AI Consultant", href: "/app/chat" },
] as const;

export function useFirstTenActivation(uid?: string, enabled?: boolean) {
  const storageKey = useMemo(() => `activation_first10_${uid ?? "anon"}`, [uid]);
  const [done, setDone] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { done?: string[]; dismissed?: boolean };
      setDone(Array.isArray(parsed.done) ? parsed.done : []);
      setDismissed(Boolean(parsed.dismissed));
    } catch {
      // noop
    }
  }, [storageKey]);

  function persist(nextDone: string[], nextDismissed = dismissed) {
    setDone(nextDone);
    setDismissed(nextDismissed);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ done: nextDone, dismissed: nextDismissed }));
    } catch {
      // noop
    }
  }

  const show = Boolean(enabled) && !dismissed && done.length < FIRST_TEN_ACTIVATION_STEPS.length;

  return {
    steps: FIRST_TEN_ACTIVATION_STEPS,
    done,
    dismissed,
    show,
    persist,
  };
}
