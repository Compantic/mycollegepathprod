export type CookiePreferences = {
  functional: boolean;
  analytics: boolean;
};

export const COOKIE_CONSENT_KEY = "mcp_cookie_consent";
export const COOKIE_CONSENT_EVENT = "mcp:cookie-consent";

export function readCookieConsent(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CookiePreferences;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return readCookieConsent()?.analytics === true;
}

export function dispatchCookieConsent(prefs: CookiePreferences) {
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: prefs }));
}
