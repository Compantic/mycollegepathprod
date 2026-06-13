"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Old bookmarked URLs like `/#pricing` → clean `/pricing` route. */
export function LegacyHashRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;
    const hash = window.location.hash.toLowerCase();
    if (hash === "#pricing") {
      router.replace("/pricing");
    }
  }, [pathname, router]);

  return null;
}
