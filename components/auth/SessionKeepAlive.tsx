"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const REFRESH_INTERVAL_MS = 45 * 60 * 1000;

/**
 * Keeps the httpOnly `__session` cookie aligned with Firebase Auth while the user
 * is in the authenticated app. Mints a long-lived Firebase session cookie via
 * `/api/auth/session` so middleware does not kick users out when the ~1h ID token expires.
 */
export function SessionKeepAlive() {
  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function syncSession() {
      const user = auth.currentUser;
      if (!user || cancelled) return;
      try {
        const token = await user.getIdToken(/* forceRefresh */ true);
        if (cancelled) return;
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          credentials: "include",
        });
      } catch {
        // Non-fatal: next navigation or API call can retry.
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (cancelled) return;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (!user) return;
      void syncSession();
      intervalId = setInterval(() => {
        void syncSession();
      }, REFRESH_INTERVAL_MS);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return null;
}
