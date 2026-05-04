"use client";

import { useLayoutEffect } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/** When streamed HTML omits head link tags; useLayoutEffect runs before paint (useEffect does not). */
export function Providers({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    function ensureStylesheet(href: string) {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
    ensureStylesheet("/app-shell-layout.css");
    ensureStylesheet("/compiled-styles.css");
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>{children}</ToastProvider>
    </ErrorBoundary>
  );
}
