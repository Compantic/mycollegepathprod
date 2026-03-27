"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
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

      // Group radio/checkbox by name so each question counts once.
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

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div
        className="onboarding-card relative overflow-hidden p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-6 duration-500"
        style={{ animationFillMode: "backwards", animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        <div className="pointer-events-none absolute -right-12 -top-10 h-40 w-40 rounded-full bg-primary-500/10 blur-2xl animate-onboarding-pulse-soft" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-primary-400/10 blur-2xl animate-onboarding-pulse-soft" style={{ animationDelay: "1s" }} />
        <div className="flex items-start gap-5">
          {icon && (
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg animate-onboarding-float [&>svg]:h-7 [&>svg]:w-7"
              style={{ boxShadow: "0 8px 24px rgba(43, 95, 217, 0.35)" }}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1 animate-in fade-in slide-in-from-left-2 duration-500 delay-100">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                {title}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-600">
                <Sparkles className="h-3 w-3" />
                AI-Powered Intake
              </span>
            </div>
            {subtitle && (
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {formId && (
          <div className="mt-5 rounded-2xl border border-primary-200/70 bg-white/80 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2 text-xs">
              <p className="font-semibold text-text-primary">Live completion output</p>
              <span className="font-semibold text-primary-600">
                {totalCount ? `${answeredCount}/${totalCount}` : "0/0"}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-indigo-500 transition-[width] duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-text-secondary">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500" />
              {completionText}
            </p>
          </div>
        )}
        <div className="mt-6 sm:mt-8 animate-in-stagger">{children}</div>
        {actions && (
          <div className="mt-8 pt-6 border-t border-bg-border flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-400">
            {actions}
          </div>
        )}
      </div>
      {showPrivacyFooter && (
        <p className="text-center text-xs text-text-muted animate-in fade-in duration-500 delay-200">
          Your information is safe with us. We use it only to help you find your best college match.
        </p>
      )}
    </div>
  );
}
