"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { signOut } from "@/lib/firebase/auth";
import { auth } from "@/lib/firebase/client";
import { setStudentProfile, getStudentProfile } from "@/lib/firebase/firestore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Target,
  User,
  LogOut,
  Menu,
  X,
  Edit3,
  Map,
  TrendingUp,
  Trophy,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import { LogoWordmark } from "@/components/landing/LogoWordmark";

const nav = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/colleges", label: "College List", icon: Building2 },
  { href: "/app/chat", label: "Consultant Chat", icon: MessageSquare },
  { href: "/app/essays", label: "Essays", icon: Edit3 },
  { href: "/app/documents", label: "College Matching", icon: Target },
  { href: "/app/myroad", label: "My Roadmap", icon: Map },
  { href: "/app/ai-score", label: "My Score", icon: Trophy },
  { href: "/app/profile", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
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

  const hideFloatingAi =
    pathname === "/app/chat" ||
    pathname === "/app/documents" ||
    pathname === "/app/myroad" ||
    pathname === "/app/dashboard" ||
    pathname === "/app/colleges" ||
    pathname === "/app/profile";

  const navLinkClass = (active: boolean) =>
    cn(
      "group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-300",
      active
        ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/35 ring-2 ring-amber-300/45"
        : "text-slate-600 hover:bg-white/90 hover:text-slate-900 hover:shadow-md hover:-translate-y-0.5"
    );

  const iconWrapClass = (active: boolean) =>
    cn(
      "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300",
      active ? "bg-white/20 text-white" : "bg-white/70 text-primary-600 shadow-sm group-hover:bg-primary-50 group-hover:text-primary-700"
    );

  return (
    <div className="flex min-h-screen bg-[#f7f9fb]">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/60 bg-slate-50/90 shadow-[0_25px_50px_-12px_rgba(15,27,45,0.12)] backdrop-blur-xl lg:flex"
        )}
        aria-label="App sidebar"
      >
        <div className="h-1 shrink-0 bg-gradient-to-r from-[#0f1b2d] via-primary-600 to-amber-400" aria-hidden />
        <div className="flex h-[4.5rem] shrink-0 items-center border-b border-slate-200/60 px-5">
          <Link href="/app/dashboard" className="group flex items-center gap-3" aria-label="Home">
            <LogoWordmark className="h-10 w-auto transition-transform duration-300 group-hover:scale-[1.02]" />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-5" aria-label="Main navigation">
          {nav.map(({ href, label, icon: Icon }, i) => {
            const active = pathname === href;
            return (
              <motion.div
                key={href}
                initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.04 + i * 0.03, type: "spring", stiffness: 320, damping: 28 }}
              >
                <Link href={href} onClick={() => setSidebarOpen(false)} className={navLinkClass(active)}>
                  <span className={iconWrapClass(active)}>
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  </span>
                  <span className="truncate">{label}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-slate-200/60 p-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-slate-500 transition-all hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 lg:hidden"
            aria-hidden
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,88vw)] flex-col border-r border-white/60 bg-slate-50/95 shadow-2xl backdrop-blur-xl animate-in slide-in-from-left-4 duration-200 lg:hidden"
            aria-label="App sidebar mobile"
          >
            <div className="h-1 shrink-0 bg-gradient-to-r from-[#0f1b2d] via-primary-600 to-amber-400" />
            <div className="flex items-center justify-between border-b border-slate-200/60 px-4 py-3">
              <Link href="/app/dashboard" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
                <LogoWordmark className="h-8 w-auto" />
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
              {nav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={navLinkClass(pathname === href)}
                >
                  <span className={iconWrapClass(pathname === href)}>
                    <Icon className="h-4 w-4 shrink-0" />
                  </span>
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </nav>
            <div className="border-t border-slate-200/60 p-3">
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  handleSignOut();
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-700"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </div>
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
        <header
          className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-white/50 bg-slate-50/80 px-4 shadow-sm backdrop-blur-md sm:px-6"
          aria-label="App top bar"
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center rounded-xl p-2 text-slate-600 transition-colors hover:bg-white hover:text-primary-700 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
        </header>
        <main className="relative flex-1 overflow-hidden bg-[#f7f9fb] bg-pattern p-4 sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-500/[0.04] via-transparent to-amber-200/10" aria-hidden />
          <div className="relative z-10">{children}</div>
        </main>
      </div>

      {!hideFloatingAi && (
        <div className="pointer-events-none fixed bottom-5 left-4 right-4 z-[35] flex justify-end sm:bottom-8 sm:left-auto sm:right-8">
          <motion.div
            className="pointer-events-auto max-w-full"
            animate={
              reduceMotion
                ? {}
                : {
                    y: [0, -7, 0],
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          >
            <motion.div
              className="rounded-2xl"
              animate={
                reduceMotion
                  ? {}
                  : {
                      boxShadow: [
                        "0 14px 40px -10px rgba(37, 99, 235, 0.45)",
                        "0 20px 50px -8px rgba(37, 99, 235, 0.58)",
                        "0 14px 40px -10px rgba(37, 99, 235, 0.45)",
                      ],
                    }
              }
              transition={
                reduceMotion ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <Link
                href="/app/chat"
                title="Open consultant chat"
                aria-label="Open consultant chat"
                className="group flex max-w-full items-center gap-2.5 overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-primary-600 via-primary-600 to-primary-800 pl-2.5 pr-3 py-2 text-white shadow-lg ring-2 ring-white/90 transition-transform duration-200 hover:scale-[1.02] hover:ring-amber-200/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300/60 sm:gap-3 sm:pl-3 sm:pr-4 sm:py-2.5"
              >
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                  <MessageSquare className="h-5 w-5" strokeWidth={2} aria-hidden />
                  <Sparkles className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 text-amber-300" strokeWidth={2.5} aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-left leading-tight">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-100/95">
                    Chat anytime
                  </span>
                  <span className="block truncate text-sm font-bold tracking-tight sm:text-[15px]">Consultant Chat</span>
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
