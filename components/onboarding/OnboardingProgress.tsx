"use client";

import { usePathname } from "next/navigation";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TOTAL_ONBOARDING_STEPS, STEP_CONFIG } from "@/lib/onboarding/stepConfig";
import { User, Brain, Briefcase, FileCheck, Award, ClipboardCheck, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_ICONS = [User, Brain, Briefcase, FileCheck, Award, ClipboardCheck, UserPlus] as const;

export function OnboardingProgress() {
  const pathname = usePathname();
  const step = pathname?.match(/\/onboarding\/step-(\d)/)?.[1];
  const current = step ? parseInt(step, 10) : 0;
  const percent =
    current >= 1 && current <= TOTAL_ONBOARDING_STEPS
      ? Math.round((current / TOTAL_ONBOARDING_STEPS) * 100)
      : 0;
  const config = current >= 1 && current <= TOTAL_ONBOARDING_STEPS ? STEP_CONFIG[current] : null;

  return (
    <div className="px-4 py-4 sm:px-6 bg-gradient-to-b from-white/50 to-transparent">
      <div className="mx-auto max-w-2xl flex flex-col gap-4">
        {/* Step indicators with icons */}
        <div className="flex items-center w-full">
          {Array.from({ length: TOTAL_ONBOARDING_STEPS }, (_, i) => i + 1).map((s) => {
            const Icon = STEP_ICONS[s - 1];
            const isActive = s === current;
            const isPast = s < current;
            return (
              <div key={s} className="flex flex-1 items-center min-w-0">
                <div
                  className={cn(
                    "flex flex-col items-center gap-1.5 shrink-0 transition-all duration-300",
                    isActive && "animate-onboarding-scale-in"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border-2 transition-all duration-300",
                      isPast &&
                        "border-primary-500 bg-primary-500 text-white shadow-sm",
                      isActive &&
                        "border-primary-500 bg-primary-500 text-white shadow-md ring-4 ring-primary-500/25 scale-110",
                      !isPast &&
                        !isActive &&
                        "border-bg-border bg-white/80 text-text-muted"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />}
                  </div>
                  <span
                    className={cn(
                      "hidden text-[10px] font-semibold sm:block",
                      isActive ? "text-primary-600" : isPast ? "text-primary-500" : "text-text-muted"
                    )}
                  >
                    Step {s}
                  </span>
                </div>
                {s < TOTAL_ONBOARDING_STEPS && (
                  <div
                    className={cn(
                      "mx-0.5 sm:mx-1 h-0.5 flex-1 rounded-full transition-all duration-500 min-w-[4px]",
                      isPast ? "bg-primary-500" : "bg-bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-text-primary">
            Step {current >= 1 && current <= TOTAL_ONBOARDING_STEPS ? current : 0} of {TOTAL_ONBOARDING_STEPS}
          </span>
          <span className="font-bold text-primary-600 tabular-nums">{percent}%</span>
        </div>
        <ProgressBar
          value={percent}
          max={100}
          showLabel={false}
          aria-label="Onboarding progress"
          barClassName="bg-gradient-to-r from-primary-500 to-primary-400 transition-[width] duration-700 ease-out rounded-full shadow-sm"
        />
        {config && (
          <p className="text-sm text-text-secondary animate-in fade-in slide-in-from-bottom-1 duration-400">
            {config.description}
          </p>
        )}
      </div>
    </div>
  );
}
