"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/firebase/auth";
import { auth } from "@/lib/firebase/client";
import { setStudentProfile, getStudentProfile } from "@/lib/firebase/firestore";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, MessageSquare, Target, User, LogOut, Menu, X, Edit3, Map, TrendingUp, Trophy, ClipboardCheck } from "lucide-react";
import { LogoIcon } from "@/components/landing/LogoIcon";

const nav = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/colleges", label: "College List", icon: Building2 },
  { href: "/app/chat", label: "AI Consultant", icon: MessageSquare },
  { href: "/app/essays", label: "Essays", icon: Edit3 },
  { href: "/app/documents", label: "College Matching", icon: Target },
  { href: "/app/apply-now", label: "Apply Now", icon: ClipboardCheck },
  { href: "/app/myroad", label: "My Roadmap", icon: Map },
  { href: "/app/ai-score", label: "My AI Score", icon: Trophy },
  { href: "/app/insights", label: "Insights", icon: TrendingUp },
  { href: "/app/profile", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem("onboardingAnswers") : null;
      if (!raw) return;
      try {
        const data = JSON.parse(raw) as Record<string, unknown>;
        const existing = await getStudentProfile(user.uid);
        const updates: Parameters<typeof setStudentProfile>[1] = {};
        if (data.graduationYear != null && existing?.graduationYear == null) updates.graduationYear = Number(data.graduationYear);
        if (data.gpa != null && existing?.gpa == null) updates.gpa = Number(data.gpa);
        if (data.satScore != null && existing?.satScore == null) updates.satScore = Number(data.satScore);
        if (data.actScore != null && existing?.actScore == null) updates.actScore = Number(data.actScore);
        if (data.preferredSize && existing?.preferredSize == null) updates.preferredSize = data.preferredSize as "small" | "medium" | "large";
        if (Array.isArray(data.preferredStates) && data.preferredStates.length && !existing?.preferredStates?.length) updates.preferredStates = data.preferredStates as string[];
        if (Object.keys(updates).length > 0) await setStudentProfile(user.uid, updates);
        localStorage.removeItem("onboardingAnswers");
      } catch {
        // ignore
      }
    });
    return () => unsub();
  }, []);

  async function handleSignOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-bg-main bg-pattern bg-glow flex">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:z-30",
          "border-r border-bg-border bg-gradient-to-b from-bg-card/95 via-bg-main/95 to-bg-main/100 backdrop-blur-xl",
          "shadow-[0_18px_45px_rgba(15,23,42,0.20)]"
        )}
        aria-label="App sidebar"
      >
        <div className="flex h-20 items-center px-5 border-b border-bg-border/80 shrink-0">
          <Link href="/app/dashboard" className="flex items-center gap-3" aria-label="Home">
            <LogoIcon className="h-9 w-9 shrink-0" />
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-text-primary">
                MyCollegePath
              </span>
              <span className="text-[11px] font-medium text-text-muted">
                Student dashboard
              </span>
            </div>
          </Link>
        </div>
        <nav
          className="flex-1 overflow-y-auto py-5 px-4 flex flex-col gap-1"
          aria-label="Main navigation"
        >
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary-500 text-white shadow-[0_14px_32px_rgba(37,99,235,0.45)]"
                    : "text-text-secondary hover:bg-secondary-100/80 hover:text-text-primary hover:-translate-y-[1px]"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl text-primary-500 transition-colors",
                    active ? "bg-white/15 text-white" : "bg-white/40 group-hover:bg-white/70"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                </span>
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-bg-border p-3 space-y-0.5">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-button px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-secondary-100 hover:text-text-primary transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay + drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
            aria-hidden
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-80 flex flex-col lg:hidden",
              "border-r border-bg-border bg-gradient-to-b from-bg-card via-bg-main to-bg-main shadow-glow-lg",
              "animate-in slide-in-from-left-4 duration-250"
            )}
            aria-label="App sidebar mobile"
          >
            <div className="flex h-18 items-center justify-between px-4 border-b border-bg-border">
              <Link
                href="/app/dashboard"
                className="flex items-center gap-3"
                onClick={() => setSidebarOpen(false)}
              >
                <LogoIcon className="h-8 w-8" />
                <span className="font-bold text-base text-text-primary">MyCollegePath</span>
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-button p-2 text-text-secondary hover:bg-secondary-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-5 px-4 flex flex-col gap-1">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium",
                    pathname === href
                      ? "bg-primary-500 text-white shadow-[0_14px_32px_rgba(37,99,235,0.45)]"
                      : "text-text-secondary hover:bg-secondary-100/80 hover:text-text-primary"
                  )}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/40 text-primary-500 group-hover:bg-white/70">
                    <Icon className="h-4 w-4 shrink-0" />
                  </span>
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </nav>
            <div className="border-t border-bg-border p-3 space-y-0.5">
              <button
                type="button"
                onClick={() => { setSidebarOpen(false); handleSignOut(); }}
                className="flex w-full items-center gap-3 rounded-button px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-secondary-100"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        {/* Topbar */}
        <header
          className={cn(
            "sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-bg-border",
            "bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] px-4 sm:px-6 shadow-soft"
          )}
          aria-label="App top bar"
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center rounded-button p-2 text-text-secondary hover:bg-secondary-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
