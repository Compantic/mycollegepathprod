"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getOnboardingDraft } from "@/lib/onboarding/storage";
import type { OnboardingAnswers, GradeLevel } from "@/lib/onboarding/schema";
import { ageFromBirthYear, birthYearFromDraft, formatBirthYear } from "@/lib/onboarding/utils";
import { STEP_CONFIG } from "@/lib/onboarding/stepConfig";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck,
  User,
  CalendarDays,
  MapPin,
  School,
  GraduationCap,
  Gauge,
  BookOpen,
  Map,
  Building2,
} from "lucide-react";

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary-50/80 transition-colors">
      <div className="onboarding-icon-box shrink-0 text-primary-600 mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium text-text-muted block">{label}</span>
        <span className="text-sm font-semibold text-text-primary break-words">{value}</span>
      </div>
    </div>
  );
}

function graduationYearFromGrade(grade: GradeLevel | undefined): number | undefined {
  if (!grade) return undefined;
  const y = new Date().getFullYear();
  if (grade === "9") return y + 4;
  if (grade === "10") return y + 3;
  if (grade === "11") return y + 2;
  if (grade === "12") return y + 1;
  return y + 1;
}

function OnboardingStep6Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProfile = searchParams.get("from") === "profile";
  const [answers, setAnswers] = useState<OnboardingAnswers>(() => getOnboardingDraft());
  useEffect(() => {
    setAnswers(getOnboardingDraft());
  }, []);
  const gradYear = graduationYearFromGrade(answers.gradeLevel) ?? answers.graduationYear;
  const states = answers.locationPreferenceStates?.length ? answers.locationPreferenceStates : answers.preferredStates;

  const config = STEP_CONFIG[6];

  return (
    <OnboardingStepCard
      title={config.title}
      subtitle={config.description}
      icon={<ClipboardCheck className="h-5 w-5" />}
      showPrivacyFooter={false}
      formId="onboarding-step6-review"
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => router.push(fromProfile ? "/app/profile" : "/onboarding/step-5")}>
            Back
          </Button>
          <Button type="button" onClick={() => router.push(fromProfile ? "/app/profile" : "/onboarding/step-7")}>
            {fromProfile ? "Done" : "Continue to create account"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-secondary mb-6">
        Review the highlights below. You can go back to any step to make changes before creating your account.
      </p>

      <section className="onboarding-card rounded-2xl border-2 border-bg-border bg-white p-5 shadow-soft" aria-label="Profile summary">
        <div className="flex items-center gap-3 pb-4 border-b border-bg-border">
          <div className="onboarding-icon-box text-primary-600 border-primary-500/30 bg-primary-500/10">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Profile summary</h2>
            <p className="text-xs text-text-muted">Key fields from your answers.</p>
          </div>
        </div>
        <div className="mt-4 space-y-1">
          {(answers.firstName || answers.lastName) && (
            <SummaryRow icon={<User className="h-4 w-4" />} label="Name" value={[answers.firstName, answers.lastName].filter(Boolean).join(" ")} />
          )}
          {birthYearFromDraft(answers) != null && (
            <SummaryRow
              icon={<CalendarDays className="h-4 w-4" />}
              label="Birth year"
              value={(() => {
                const y = birthYearFromDraft(answers)!;
                const age = ageFromBirthYear(y);
                return `${formatBirthYear(y)}${age != null ? ` (Approx. age: ${age} years)` : ""}`;
              })()}
            />
          )}
          {answers.gender && (
            <SummaryRow icon={<User className="h-4 w-4" />} label="Gender" value={`${answers.gender}${answers.gender === "Other" && answers.genderOther ? ` — ${answers.genderOther}` : ""}`} />
          )}
          {(answers.city || answers.state || answers.country) && (
            <SummaryRow icon={<MapPin className="h-4 w-4" />} label="Location" value={[answers.city, answers.state, answers.country].filter(Boolean).join(", ")} />
          )}
          {answers.currentHighSchool && <SummaryRow icon={<School className="h-4 w-4" />} label="High school" value={answers.currentHighSchool} />}
          {(answers.expectedGraduationYear != null || gradYear != null) && (
            <SummaryRow icon={<GraduationCap className="h-4 w-4" />} label="Graduation year" value={String(answers.expectedGraduationYear ?? gradYear ?? "—")} />
          )}
          {answers.gradeLevel && <SummaryRow icon={<School className="h-4 w-4" />} label="Grade level" value={answers.gradeLevel} />}
          {answers.preferenceCoreType && <SummaryRow icon={<User className="h-4 w-4" />} label="Preference core" value={answers.preferenceCoreType} />}
          {answers.lifeSatisfaction != null && <SummaryRow icon={<Gauge className="h-4 w-4" />} label="Life satisfaction" value={`${answers.lifeSatisfaction} / 10`} />}
          {answers.areasOfInterest && answers.areasOfInterest.length > 0 && (
            <SummaryRow icon={<BookOpen className="h-4 w-4" />} label="Major areas" value={answers.areasOfInterest.join(", ")} />
          )}
          {answers.gpa != null && <SummaryRow icon={<Gauge className="h-4 w-4" />} label="GPA" value={`${answers.gpa} (${answers.gpaScale ?? 4}.0 scale)`} />}
          {(answers.satScore != null || answers.actScore != null) && (
            <SummaryRow
              icon={<BookOpen className="h-4 w-4" />}
              label="Test scores"
              value={[answers.satScore != null ? `SAT ${answers.satTotal ?? answers.satScore}` : null, answers.actScore != null ? `ACT ${answers.actScore}` : null].filter(Boolean).join(", ")}
            />
          )}
          {states && states.length > 0 && <SummaryRow icon={<Map className="h-4 w-4" />} label="Target states" value={states.join(", ")} />}
          {answers.campusUrbanSuburbanRural && answers.campusUrbanSuburbanRural.length > 0 && (
            <SummaryRow
              icon={<Building2 className="h-4 w-4" />}
              label="Campus setting"
              value={answers.campusUrbanSuburbanRural.join(", ")}
            />
          )}
          {answers.budgetPerYear && <SummaryRow icon={<Map className="h-4 w-4" />} label="Budget / year" value={answers.budgetPerYear} />}
        </div>
        {!answers.firstName && !answers.lastName && !answers.gradeLevel && answers.gpa == null && (
          <p className="mt-4 text-center text-sm text-text-muted py-6 rounded-xl bg-secondary-100/50">Go back and complete earlier steps to see your summary.</p>
        )}
      </section>
    </OnboardingStepCard>
  );
}

export default function OnboardingStep6Page() {
  return (
    <Suspense fallback={null}>
      <OnboardingStep6Content />
    </Suspense>
  );
}
