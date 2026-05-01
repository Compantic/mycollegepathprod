"use client";

import { ClipboardList, Compass, GraduationCap, Lightbulb, Target, Users, Edit3, ChevronRight } from "lucide-react";
import type { OnboardingSnapshot } from "@/lib/onboarding/types";
import { cn } from "@/lib/utils";

interface OnboardingSummaryProps {
  answers: OnboardingSnapshot;
  onEditSection?: (step: number) => void;
  hideEdit?: boolean;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  step: number;
  children: React.ReactNode;
  onEditSection?: (step: number) => void;
  hideEdit?: boolean;
}

function Section({ title, icon, step, children, onEditSection, hideEdit }: SectionProps) {
  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/70 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-3xl transition-all hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 ring-1 ring-primary-100 transition-transform group-hover:scale-110">
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-none">{title}</h3>
            <p className="mt-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Section {step}</p>
          </div>
        </div>
        {!hideEdit && (
          <button
            type="button"
            onClick={() => onEditSection?.(step)}
            className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-500 transition-all hover:bg-primary-600 hover:text-white"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | null | undefined;
}) {
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="group/field rounded-2xl border border-slate-100 bg-white/50 p-4 transition-colors hover:border-primary-200 hover:bg-white">
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1.5 group-hover/field:text-primary-500">{label}</p>
      <div className="text-sm font-black text-slate-800 break-words leading-relaxed">{value}</div>
    </div>
  );
}

export function OnboardingSummary({ answers, onEditSection, hideEdit }: OnboardingSummaryProps) {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    genderOther,
    country,
    state,
    city,
    currentHighSchool,
    expectedGraduationYear,
    gradeLevel,
    lifeSatisfaction,
    addingToLife,
    eliminatingFromLife,
    academicSuccessCrucial,
    naturalSkills,
    favoriteSubjectsRank,
    preferenceCoreType,
    intellectualStructuredVsOpen,
    intellectualLectureVsDiscussion,
    intellectualResearchVsApplication,
    intellectualTheoreticalVsHandsOn,
    socialCompetitiveVsCollaborative,
    socialIntrovertedVsSocial,
    socialLargeVsTight,
    socialIndependentVsGuided,
    careerPath,
    careerPathWhat,
    careerConfidence,
    areasOfInterest,
    targetDegree,
    knowCoursesStandOut,
    knowActivitiesStandOut,
    studySkillsConfidence,
    focusDifficulty,
    gpa,
    examsTaken,
    satTotal,
    actComposite,
    apExamsCount,
    apAverageScore,
    rigorousApCompleted,
    rigorousIbCompleted,
    rigorousHonorsCompleted,
    activityTypes,
    awardsConsolidated,
    tutoringBenefit,
    locationPreferenceStates,
    campusUrbanSuburbanRural,
    campusLectureVsSeminar,
    campusCoreVsOpen,
    campusIntensityVsBalanced,
    collegeSectorPreference,
    degreeLengthPreference,
    internationalOpenness,
    budgetPerYear,
    familyIncome,
    fafsaEligibility,
    hasCollegeList,
    collegeListReachMatchSafety,
    collegeListVisited,
    collegeListWhatLike,
    applicationStrategy,
    admissionProcessConfidence,
    selectivityImportance,
  } = answers;

  const lifeSatLabel = lifeSatisfaction != null ? `${lifeSatisfaction} / 10` : null;
  const careerConfLabel = careerConfidence != null ? `${careerConfidence} / 10` : null;
  const studyLabel = studySkillsConfidence != null ? `${studySkillsConfidence} / 10` : null;
  const focusLabel = focusDifficulty != null ? `${focusDifficulty} / 10` : null;
  const coursesLabel = knowCoursesStandOut;
  const activitiesAwareLabel = knowActivitiesStandOut != null ? `${knowActivitiesStandOut} / 10` : null;
  const admissionConfLabel = admissionProcessConfidence != null ? `${admissionProcessConfidence} / 10` : null;
  const selectivityLabel = selectivityImportance != null ? `${selectivityImportance} / 10` : null;

  const activitiesSummary =
    activityTypes && activityTypes.length
      ? activityTypes.map((a) => a.type).join(", ")
      : null;

  const awardsCount = awardsConsolidated?.length ?? 0;
  const awardsSummary = awardsCount ? `${awardsCount} award${awardsCount > 1 ? "s" : ""}` : null;
  const interestLabel = areasOfInterest?.length ? areasOfInterest.join(", ") : null;
  const examsLabel = examsTaken?.length ? examsTaken.join(", ") : null;
  const locationLabel = locationPreferenceStates?.length ? locationPreferenceStates.join(", ") : null;
  const favSubjectsLabel = favoriteSubjectsRank?.filter(Boolean).join(" → ") || null;

  return (
    <div className="space-y-12 pb-12">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
          <div className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <ClipboardList className="size-5" />
          </div>
          Comprehensive Record
        </h2>
        <p className="text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
          Deep-dive into your college preparation profile. This data powers your AI matching and roadmap generation.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Identity & Basics" icon={<Lightbulb className="size-5" />} step={1} onEditSection={onEditSection} hideEdit={hideEdit}>
          <Field label="Full Name" value={[firstName, lastName].filter(Boolean).join(" ") || null} />
          <Field label="Date of Birth" value={dateOfBirth} />
          <Field label="Gender" value={gender ? `${gender}${gender === "Other" && genderOther ? ` — ${genderOther}` : ""}` : null} />
          <Field label="Location" value={[city, state, country].filter(Boolean).join(", ") || null} />
          <Field label="Current high school" value={currentHighSchool} />
          <Field label="Grade level" value={gradeLevel} />
          <Field label="Graduation year" value={expectedGraduationYear != null ? String(expectedGraduationYear) : null} />
        </Section>

        <Section title="Psychology & Signals" icon={<Users className="size-5" />} step={2} onEditSection={onEditSection} hideEdit={hideEdit}>
          <Field label="Life Satisfaction" value={lifeSatLabel} />
          <Field label="Add to life" value={addingToLife} />
          <Field label="Remove from life" value={eliminatingFromLife} />
          <Field label="Naturally good at" value={naturalSkills} />
          <Field label="Favorite subjects" value={favSubjectsLabel} />
          <Field label="Preference type" value={preferenceCoreType} />
          <Field label="Learning style" value={intellectualStructuredVsOpen} />
          <Field label="Academic vibe" value={intellectualLectureVsDiscussion} />
        </Section>

        <Section title="Career & Direction" icon={<Target className="size-5" />} step={3} onEditSection={onEditSection} hideEdit={hideEdit}>
          <Field label="Career path" value={careerPath} />
          <Field label="Specific goal" value={careerPathWhat} />
          <Field label="Confidence" value={careerConfLabel} />
          <Field label="Interests" value={interestLabel} />
          <Field label="Target Degree" value={targetDegree} />
          <Field label="Study skills" value={studyLabel} />
        </Section>

        <Section title="Academic Strength" icon={<GraduationCap className="size-5" />} step={4} onEditSection={onEditSection} hideEdit={hideEdit}>
          <Field label="GPA (Weighted)" value={gpa} />
          <Field label="Exams Taken" value={examsLabel} />
          <Field label="SAT score" value={satTotal} />
          <Field label="ACT score" value={actComposite} />
          <Field label="AP count" value={apExamsCount != null ? String(apExamsCount) : null} />
          <Field label="Rigor index" value={rigorousApCompleted || rigorousIbCompleted || rigorousHonorsCompleted ? "Comprehensive" : "Standard"} />
        </Section>

        <Section title="Strategy & Lifestyle" icon={<Compass className="size-5" />} step={5} onEditSection={onEditSection} hideEdit={hideEdit}>
          <Field label="Activities" value={activitiesSummary} />
          <Field label="Awards" value={awardsSummary} />
          <Field label="Preferred States" value={locationLabel} />
          <Field label="Campus settings" value={Array.isArray(campusUrbanSuburbanRural) ? campusUrbanSuburbanRural.join(", ") : campusUrbanSuburbanRural} />
          <Field label="App strategy" value={Array.isArray(applicationStrategy) ? applicationStrategy.join(", ") : applicationStrategy} />
          <Field label="Budget/Year" value={budgetPerYear} />
          <Field label="Financial Aid" value={fafsaEligibility === "Yes" ? "Seeking Aid" : fafsaEligibility === "No" ? "Self-funded" : "Undecided"} />
          <Field label="Selectivity" value={selectivityLabel} />
        </Section>
      </div>
    </div>
  );
}
