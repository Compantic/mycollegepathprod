"use client";

import { MapPin, Building2, GraduationCap, Edit3, FileDown } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { computeProfileStrength } from "@/lib/profile/profileStrength";
import type { OnboardingSnapshot } from "@/lib/onboarding/types";

export interface ProfileHeaderProps {
  onboarding: OnboardingSnapshot | null;
  profilePhotoUrl?: string | null;
}

const DEGREE_LABELS: Record<string, string> = {
  MA: "Master of Arts",
  MS: "Master of Science",
  GD: "Graduate Diploma",
  LLM: "LL.M.",
  PHD: "Ph.D.",
  "Ed.D": "Ed.D.",
  MD: "M.D.",
  DO: "D.O.",
  DDS: "D.D.S.",
  DVM: "D.V.M.",
  "Not sure": "Not sure",
};

export function ProfileHeader({ onboarding, profilePhotoUrl }: ProfileHeaderProps) {
  const strength = computeProfileStrength(onboarding);
  const firstName = onboarding?.firstName?.trim() ?? "";
  const lastName = onboarding?.lastName?.trim() ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Student";
  const initial = fullName ? fullName.replace(/\b(\w)/g, (_, c) => c).slice(0, 2).toUpperCase() : "?";

  const locationParts = [onboarding?.city, onboarding?.state].filter(Boolean);
  const location = locationParts.length ? locationParts.join(", ") : null;
  const gradeLevel = onboarding?.gradeLevel ?? null;
  const majorCategory = onboarding?.areasOfInterest?.[0] ?? null;
  const targetDegree = onboarding?.targetDegree ?? null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <GlassCard className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary-600/5 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/60 bg-white/80 text-2xl font-bold text-primary-600 shadow-inner backdrop-blur-sm">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span aria-hidden>{initial}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">{fullName}</h1>
              {onboarding?.currentHighSchool && (
                <p className="mt-1 flex items-center gap-2 text-text-secondary">
                  <Building2 className="h-4 w-4 shrink-0 text-primary-500" aria-hidden />
                  {onboarding.currentHighSchool}
                </p>
              )}
              {(onboarding?.expectedGraduationYear ?? onboarding?.graduationYear) != null && (
                <p className="mt-0.5 flex items-center gap-2 text-sm text-text-muted">
                  <GraduationCap className="h-4 w-4 shrink-0" aria-hidden />
                  Class of {onboarding?.expectedGraduationYear ?? onboarding?.graduationYear}
                </p>
              )}
              {location && (
                <p className="mt-1 flex items-center gap-2 text-sm text-text-muted">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                  {location}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {gradeLevel && (
                  <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                    {gradeLevel}
                  </span>
                )}
                {majorCategory && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-text-secondary">
                    {majorCategory}
                  </span>
                )}
                {targetDegree && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-text-secondary">
                    {DEGREE_LABELS[targetDegree] ?? targetDegree}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-4 sm:w-56">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Profile strength</p>
              <ProgressBar value={strength} max={100} className="mt-1.5" barClassName="bg-primary-500" aria-label="Profile completion" />
              <p className="mt-1 text-sm font-medium text-text-primary">{strength}% complete</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof document !== "undefined") {
                    document.getElementById("onboarding")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              >
                <Edit3 className="h-4 w-4" aria-hidden />
                Edit questionnaire
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-bg-border bg-white/80 px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                aria-label="Export CV (coming soon)"
              >
                <FileDown className="h-4 w-4" aria-hidden />
                Export CV
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
