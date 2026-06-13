"use client";

import Link from "next/link";
import { LogoWordmark } from "@/components/landing/LogoWordmark";
import { Sparkles, Zap, CreditCard, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/#how-it-works", label: "Features", icon: Zap },
  { href: "/#how-it-works", label: "How It Works", icon: Sparkles },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
];

export function PublicHeader() {
  return (
    <header
      role="banner"
      className="sticky top-0 z-50 w-full animate-in fade-in slide-in-from-top-2 duration-300"
    >
      {/* Top banner */}
      <div className="bg-primary-600 text-white text-center py-2 px-4">
        <p className="text-xs sm:text-sm font-medium tracking-wide">
          • JOIN 10,000+ STUDENTS ALREADY USING THIS PLATFORM
        </p>
      </div>
      {/* Glass nav bar */}
      <div
        className={cn(
          "border-b border-bg-border",
          "bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)]",
          "shadow-soft"
        )}
      >
        <div className="mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4 px-4 py-2 sm:min-h-16 max-w-6xl sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center shrink-0 transition-opacity hover:opacity-90"
            aria-label="MyCollegePath home"
          >
            <LogoWordmark className="h-12 w-auto sm:h-14" />
          </Link>
          <nav className="hidden sm:flex items-center gap-1" aria-label="Main navigation">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-button px-4 py-2.5 text-sm font-medium transition-colors duration-200",
                  "text-text-secondary hover:bg-secondary-100 hover:text-text-primary"
                )}
              >
                <Icon className="h-4 w-4 text-primary-500/80" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/signin" className="inline-flex">
              <Button
                variant="ghost"
                size="sm"
                className="text-text-secondary px-2 text-xs sm:text-sm"
              >
                Log in
              </Button>
            </Link>
            <Link href="/onboarding/step-1">
              <Button
                size="sm"
                className="shadow-soft px-3 text-xs sm:px-4 sm:text-sm"
              >
                Start Free
              </Button>
            </Link>
            {/* Mobile menu trigger: preserve for future drawer */}
            <button
              type="button"
              className="hidden sm:flex items-center justify-center rounded-button p-2 text-text-secondary hover:bg-secondary-100"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
