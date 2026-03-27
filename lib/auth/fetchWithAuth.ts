"use client";

import { auth } from "@/lib/firebase/client";

/**
 * Fetch with Firebase ID token. On 401, refreshes the token, updates the session cookie,
 * and retries once. If still 401, redirects to /login?from=<current path>.
 * Use for API calls that require authentication so token expiry is handled in one place.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const doFetch = (t: string | null) => {
    const headers = new Headers(init?.headers);
    if (t) headers.set("Authorization", `Bearer ${t}`);
    return fetch(input, { ...init, headers, credentials: "include" });
  };

  let res = await doFetch(token);
  if (res.status === 401 && user) {
    const newToken = await user.getIdToken(true);
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: newToken }),
      credentials: "include",
    });
    res = await doFetch(newToken);
  }
  if (res.status === 401 && typeof window !== "undefined") {
    const from = encodeURIComponent(window.location.pathname + window.location.search);
    setTimeout(() => {
      window.location.href = `/login?from=${from}`;
    }, 150);
  }
  return res;
}
