"use client";

import { useEffect, useMemo, useState } from "react";

export const FIRST_TEN_ACTIVATION_STEPS = [
  { id: "profile", label: "Profilini tamamla", href: "/app/profile" },
  { id: "colleges", label: "En az 3 college ekle", href: "/app/colleges" },
  { id: "matching", label: "Bir matching sonucu al", href: "/app/matching" },
  { id: "roadmap", label: "Roadmap olustur", href: "/app/myroad" },
  { id: "chat", label: "AI Consultant ile ilk sorunu sor", href: "/app/chat" },
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
