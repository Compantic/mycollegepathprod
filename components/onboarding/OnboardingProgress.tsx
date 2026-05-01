"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { TOTAL_ONBOARDING_STEPS, STEP_CONFIG } from "@/lib/onboarding/stepConfig";
import {
  User,
  Brain,
  Briefcase,
  FileCheck,
  Award,
  ClipboardCheck,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_ICONS = [User, Brain, Briefcase, FileCheck, Award, ClipboardCheck, UserPlus] as const;

export function OnboardingProgress() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const step = pathname?.match(/\/onboarding\/step-(\d)/)?.[1];
  const current = step ? parseInt(step, 10) : 0;
  const percent =
    current >= 1 && current <= TOTAL_ONBOARDING_STEPS
      ? Math.round((current / TOTAL_ONBOARDING_STEPS) * 100)
      : 0;
  const config = current >= 1 && current <= TOTAL_ONBOARDING_STEPS ? STEP_CONFIG[current] : null;

  return (
    <div className="border-t border-white/30 bg-gradient-to-b from-slate-50/90 to-slate-50/40 px-4 py-5 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <div className="flex w-full items-center">
          {Array.from({ length: TOTAL_ONBOARDING_STEPS }, (_, i) => i + 1).map((s) => {
            const Icon = STEP_ICONS[s - 1];
            const isActive = s === current;
            const isPast = s < current;
            return (
              <div key={s} className="flex min-w-0 flex-1 items-center">
                <div className="flex shrink-0 flex-col items-center gap-1.5">
                  <motion.div
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-colors duration-300 sm:h-11 sm:w-11",
                      isPast && "border-primary-600 bg-primary-600 text-white shadow-md",
                      isActive &&
                        "border-primary-600 bg-primary-600 text-white shadow-lg ring-4 ring-amber-300/45",
                      !isPast && !isActive && "border-slate-200 bg-white text-slate-400 shadow-sm"
                    )}
                    layout
                    initial={false}
                    animate={
                      reduceMotion
                        ? {}
                        : isActive
                          ? { scale: [1, 1.06, 1] }
                          : { scale: 1 }
                    }
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    whileHover={reduceMotion ? undefined : { scale: 1.05 }}
                  >
                    {Icon && <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" aria-hidden />}
                  </motion.div>
                  <span
                    className={cn(
                      "hidden text-[10px] font-bold uppercase tracking-wide sm:block",
                      isActive
                        ? "text-primary-700"
                        : isPast
                          ? "text-primary-600"
                          : "text-slate-400"
                    )}
                  >
                    {s}
                  </span>
                </div>
                {s < TOTAL_ONBOARDING_STEPS && (
                  <div className="mx-1 h-1 flex-1 overflow-hidden rounded-full bg-slate-200/90 sm:mx-1.5 min-w-[6px]">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-500"
                      initial={false}
                      animate={{ width: s < current ? "100%" : "0%" }}
                      transition={{ type: "spring", stiffness: 180, damping: 22 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-800">
            Step{" "}
            {current >= 1 && current <= TOTAL_ONBOARDING_STEPS ? current : 0} of {TOTAL_ONBOARDING_STEPS}
          </span>
          <span className="text-lg font-bold tabular-nums text-primary-700">{percent}%</span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90 shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-amber-400 shadow-sm"
            initial={false}
            animate={{ width: `${percent}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          />
        </div>

        <AnimatePresence mode="wait">
          {config && (
            <motion.p
              key={current}
              className="text-center text-sm leading-relaxed text-slate-600 sm:text-left"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
            >
              {config.description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
