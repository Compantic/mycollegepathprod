"use client";

import Link from "next/link";
import { LogoWordmark } from "@/components/landing/LogoWordmark";

type Props = {
  active?: "home" | "pricing";
};

export function LandingMarketingNav({ active }: Props) {
  const linkClass = (isActive: boolean) =>
    isActive
      ? "text-sm font-semibold text-primary-600"
      : "text-sm font-medium text-slate-600 hover:text-primary-600";

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/20 bg-slate-50/80 backdrop-blur-md">
      <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:h-16 sm:min-h-0 sm:px-6 lg:h-[4.5rem] lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 max-w-[52%] shrink items-center transition-opacity hover:opacity-90 sm:max-w-none sm:shrink-0"
          aria-label="MyCollegePath home"
        >
          <LogoWordmark className="h-9 w-auto max-h-10 sm:h-12 sm:max-h-none lg:h-16" />
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/#how-it-works" className={linkClass(false)}>
            Features
          </Link>
          <Link href="/#how-it-works" className={linkClass(false)}>
            How It Works
          </Link>
          <Link href="/pricing" className={linkClass(active === "pricing")}>
            Pricing
          </Link>
          <Link href="/#trust" className={linkClass(false)}>
            Trust &amp; Privacy
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <Link
            href="/signin"
            className="rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 max-[420px]:px-2 max-[420px]:text-[11px] sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="max-[420px]:hidden">Log in</span>
            <span className="hidden max-[420px]:inline">Log</span>
          </Link>
          <Link
            href="/onboarding/step-1"
            className="whitespace-nowrap rounded-full bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 max-[420px]:px-2 max-[420px]:text-[11px] sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="hidden sm:inline">Start Free Trial</span>
            <span className="sm:hidden">Start Free</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
