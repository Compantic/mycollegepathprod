"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface OnboardingStepCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  /** Footer slot: e.g. Skip for now + Next button */
  actions?: ReactNode;
  /** Show privacy footer below card */
  showPrivacyFooter?: boolean;
  className?: string;
  /** Optional form id for live answer completion stats. */
  formId?: string;
}

export function OnboardingStepCard({
  title,
  subtitle,
  icon,
  children,
  actions,
  showPrivacyFooter = true,
  className,
  formId,
}: OnboardingStepCardProps) {
  const reduceMotion = useReducedMotion();
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!formId || typeof document === "undefined") return;
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const formEl = form;

    function collectFields() {
      const controls = Array.from(
        formEl.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
          "input, select, textarea"
        )
      ).filter((el) => {
        if (el.type === "hidden") return false;
        if (el.classList.contains("sr-only")) return false;
        return true;
      });

      const keyed = new Map<string, (typeof controls)[number][]>();
      controls.forEach((el, i) => {
        const key = el.name ? `${el.tagName}:${el.name}` : `${el.tagName}:${el.id || i}`;
        if (!keyed.has(key)) keyed.set(key, []);
        keyed.get(key)!.push(el);
      });

      let answered = 0;
      let total = 0;
      keyed.forEach((group) => {
        total += 1;
        const first = group[0];
        if (first instanceof HTMLInputElement && (first.type === "radio" || first.type === "checkbox")) {
          if (group.some((g) => (g as HTMLInputElement).checked)) answered += 1;
        } else if (first instanceof HTMLSelectElement) {
          if (first.value && first.value.trim() !== "") answered += 1;
        } else if (first instanceof HTMLTextAreaElement || first instanceof HTMLInputElement) {
          if ((first.value ?? "").trim() !== "") answered += 1;
        }
      });

      setAnsweredCount(answered);
      setTotalCount(total);
    }

    collectFields();
    formEl.addEventListener("input", collectFields);
    formEl.addEventListener("change", collectFields);
    return () => {
      formEl.removeEventListener("input", collectFields);
      formEl.removeEventListener("change", collectFields);
    };
  }, [formId]);

  const completionPercent = useMemo(() => {
    if (!totalCount) return 0;
    return Math.round((answeredCount / totalCount) * 100);
  }, [answeredCount, totalCount]);

  const completionText = useMemo(() => {
    if (!totalCount) return "Start answering to build your profile snapshot.";
    if (completionPercent >= 85) return "Great progress! Your profile insight is getting very accurate.";
    if (completionPercent >= 50) return "Solid progress. Keep going to unlock better recommendations.";
    return "Nice start. Fill more answers for stronger personalization.";
  }, [completionPercent, totalCount]);

  const spring = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 320, damping: 30 };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <motion.div
        className="onboarding-card relative overflow-hidden p-6 sm:p-9 lg:p-10"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-600 via-amber-300 to-primary-500"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary-500/12 blur-3xl animate-onboarding-pulse-soft" />
        <div
          className="pointer-events-none absolute -left-20 bottom-0 h-44 w-44 rounded-full bg-amber-300/15 blur-3xl animate-onboarding-pulse-soft"
          style={{ animationDelay: "1.2s" }}
        />
        <div className="pointer-events-none absolute right-1/4 top-1/3 h-32 w-32 rounded-full bg-violet-400/10 blur-3xl animate-onboarding-aurora" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-7">
          {icon && (
            <motion.div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-xl ring-4 ring-white/90 [&>svg]:h-8 [&>svg]:w-8"
              style={{ boxShadow: "0 12px 40px rgba(31, 77, 184, 0.45)" }}
              initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...spring, delay: reduceMotion ? 0 : 0.08 }}
              whileHover={reduceMotion ? undefined : { scale: 1.04, rotate: -2 }}
            >
              {icon}
            </motion.div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
              <motion.h1
                className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
                initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: reduceMotion ? 0 : 0.1 }}
              >
                {title}
              </motion.h1>
              <motion.span
                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 to-amber-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-900 shadow-sm"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...spring, delay: reduceMotion ? 0 : 0.14 }}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                Guided intake
              </motion.span>
            </div>
            {subtitle && (
              <motion.p
                className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduceMotion ? 0 : 0.18, duration: reduceMotion ? 0 : 0.35 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>

        {formId && (
          <motion.div
            className="relative mt-6 overflow-hidden rounded-2xl border border-primary-200/60 bg-gradient-to-br from-white/95 to-slate-50/90 p-4 shadow-sm backdrop-blur-sm sm:mt-8"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.12, ...spring }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-primary-500/5 to-transparent" />
            </div>
            <div className="relative flex items-center justify-between gap-2 text-xs">
              <p className="font-bold uppercase tracking-wider text-slate-500">Live completion</p>
              <span className="tabular-nums text-sm font-bold text-primary-700">
                {totalCount ? `${answeredCount}/${totalCount}` : "0/0"}
              </span>
            </div>
            <div className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-500 shadow-sm"
                initial={false}
                animate={{ width: `${completionPercent}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 26 }}
              />
            </div>
            <p className="relative mt-3 inline-flex items-start gap-2 text-[13px] leading-snug text-slate-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              {completionText}
            </p>
          </motion.div>
        )}

        <div className="relative mt-6 sm:mt-9 animate-in-stagger">{children}</div>
        {actions && (
          <motion.div
            className="relative mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 pt-8"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduceMotion ? 0 : 0.2, duration: reduceMotion ? 0 : 0.35 }}
          >
            {actions}
          </motion.div>
        )}
      </motion.div>
      {showPrivacyFooter && (
        <motion.p
          className="text-center text-xs leading-relaxed text-slate-500"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.25 }}
        >
          Your information is safe with us. We use it only to help you find your best college match.
        </motion.p>
      )}
    </div>
  );
}
