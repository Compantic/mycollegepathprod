"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Sparkles, X } from "lucide-react";

export function FirstTenActivationCard({
  steps,
  done,
  onDismiss,
}: {
  steps: readonly { id: string; label: string; href: string }[];
  done: string[];
  onDismiss: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const pct = (done.length / steps.length) * 100;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-white/95 via-blue-50/40 to-amber-50/30 p-5 shadow-onboarding-card backdrop-blur-sm sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-600 via-amber-300 to-primary-500" aria-hidden />
      <div className="pointer-events-none absolute -right-16 top-8 h-40 w-40 rounded-full bg-primary-400/15 blur-3xl animate-onboarding-pulse-soft" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden />
            First 10 minutes
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Welcome — knock out your first steps
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Finishing this checklist takes about <span className="font-semibold text-slate-800">10 minutes</span> on average
            and unlocks better matches and AI guidance.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-white"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Dismiss
        </button>
      </div>

      <div className="relative mt-5">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90 shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-500"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          />
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-500">
          <span className="tabular-nums text-primary-700">{done.length}</span> / {steps.length} complete
        </p>
      </div>

      <div className="mt-5 grid items-start gap-3 sm:grid-cols-2">
        {steps.map((step, index) => {
          const checked = done.includes(step.id);
          return (
            <motion.div
              key={step.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : 0.05 + index * 0.04,
                type: "spring",
                stiffness: 380,
                damping: 30,
              }}
              whileHover={reduceMotion ? undefined : { scale: 1.01 }}
              className={cnCard(checked)}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                {checked ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-slate-300 bg-white" aria-hidden />
                )}
                <span className={checked ? "text-sm font-medium text-emerald-900 line-through opacity-80" : "text-sm font-semibold text-slate-800"}>
                  {step.label}
                </span>
              </div>
              <Link
                href={step.href}
                className="shrink-0 rounded-lg bg-primary-600/10 px-2.5 py-1 text-xs font-bold text-primary-700 transition-colors hover:bg-primary-600 hover:text-white"
              >
                Open
              </Link>
            </motion.div>
          );
        })}
      </div>

      {done.length === steps.length && (
        <motion.div
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
          Activation complete — you&apos;re set.
        </motion.div>
      )}
    </section>
  );
}

function cnCard(checked: boolean) {
  return checked
    ? "flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 shadow-sm"
    : "flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/90 p-3.5 shadow-sm transition-shadow hover:shadow-md";
}
