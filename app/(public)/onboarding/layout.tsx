"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { LogoWordmark } from "@/components/landing/LogoWordmark";
import {
  ShieldCheck,
  Lock,
  Sparkles,
  Route,
  Target,
} from "lucide-react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-[#f7f9fb]" aria-hidden>
        <div className="bg-pattern absolute inset-0 opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/[0.06] via-transparent to-slate-200/40" />
        <motion.div
          className="absolute -left-20 top-20 h-[28rem] w-[28rem] rounded-full bg-primary-400/15 blur-3xl"
          animate={
            reduceMotion
              ? {}
              : {
                  x: [0, 24, 0],
                  y: [0, -16, 0],
                }
          }
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-0 h-[22rem] w-[22rem] rounded-full bg-amber-300/20 blur-3xl"
          animate={
            reduceMotion
              ? {}
              : {
                  x: [0, -20, 0],
                  y: [0, 12, 0],
                }
          }
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute bottom-1/3 right-1/4 h-64 w-64 rounded-full bg-violet-400/10 blur-3xl animate-onboarding-aurora" />
      </div>

      <header className="sticky top-0 z-40 shrink-0">
        <div className="h-1 bg-gradient-to-r from-[#0f1b2d] via-primary-600 to-amber-400" aria-hidden />
        <div className="border-b border-white/20 bg-slate-50/80 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="group flex items-center text-primary-700 transition-colors hover:text-primary-600"
              aria-label="MyCollegePath home"
            >
              <LogoWordmark className="h-10 w-auto transition-transform duration-300 group-hover:scale-[1.02]" />
            </Link>
          </div>
          <OnboardingProgress />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <motion.div
          className="flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-4 text-sm text-emerald-900 shadow-sm backdrop-blur-sm sm:gap-5 sm:px-5 sm:py-4"
          initial={reduceMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-700 shadow-sm">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800/90">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Your data &amp; privacy
            </p>
            <p className="mt-2 leading-relaxed text-emerald-950/80">
              Your answers are used only to personalize your college guidance. We never sell your data, and you can request deletion at any time.
            </p>
            <Link
              href="/privacy"
              className="mt-2 inline-flex text-xs font-semibold text-primary-700 underline-offset-2 hover:text-primary-600 hover:underline"
            >
              Learn more in our privacy policy
            </Link>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
          <div className="min-w-0">{children}</div>
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-4">
              <motion.div
                className="rounded-2xl border border-blue-200 bg-blue-50/90 p-5 shadow-md backdrop-blur-sm"
                initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: reduceMotion ? 0 : 0.05,
                  type: "spring",
                  stiffness: 280,
                  damping: 30,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-700 shadow-sm ring-1 ring-blue-100">
                    <Sparkles className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary-700">
                    Real-time personalization
                  </p>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-700">
                  As you answer each question, we improve your matching and roadmap outputs.
                </p>
              </motion.div>

              <motion.div
                className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-md backdrop-blur-sm"
                initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: reduceMotion ? 0 : 0.1,
                  type: "spring",
                  stiffness: 280,
                  damping: 30,
                }}
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                    <Route className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    What unlocks next?
                  </p>
                </div>
                <ul className="mt-4 space-y-3 text-xs text-slate-700">
                  <li className="flex items-start gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2.5">
                    <Target className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    <span>Better reach / match / safety balance</span>
                  </li>
                  <li className="flex items-start gap-2 rounded-xl border border-blue-200/80 bg-blue-50/80 px-3 py-2.5">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden />
                    <span>More specific guidance</span>
                  </li>
                  <li className="flex items-start gap-2 rounded-xl border border-violet-200/80 bg-violet-50/80 px-3 py-2.5">
                    <Route className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden />
                    <span>Stronger roadmap priorities</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
