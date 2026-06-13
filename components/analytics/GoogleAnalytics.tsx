"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_EVENT,
  hasAnalyticsConsent,
  type CookiePreferences,
} from "@/lib/analytics/consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-D4R6MBJ5KB";

function applyConsentMode(granted: boolean) {
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export function GoogleAnalytics() {
  const [analyticsGranted, setAnalyticsGranted] = useState(false);

  useEffect(() => {
    setAnalyticsGranted(hasAnalyticsConsent());

    function onConsent(prefs: CookiePreferences) {
      const granted = prefs.analytics === true;
      setAnalyticsGranted(granted);
      applyConsentMode(granted);
    }

    function onCustomEvent(e: Event) {
      const detail = (e as CustomEvent<CookiePreferences>).detail;
      if (detail) onConsent(detail);
    }

    function onStorage(e: StorageEvent) {
      if (e.key !== "mcp_cookie_consent" || !e.newValue) return;
      try {
        onConsent(JSON.parse(e.newValue) as CookiePreferences);
      } catch {
        /* ignore */
      }
    }

    window.addEventListener(COOKIE_CONSENT_EVENT, onCustomEvent);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, onCustomEvent);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    applyConsentMode(analyticsGranted);
  }, [analyticsGranted]);

  if (!GA_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            wait_for_update: 500
          });
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
