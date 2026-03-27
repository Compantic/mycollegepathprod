"use client";

import { ClipboardList, Compass, GraduationCap, Lightbulb, Target, Users } from "lucide-react";
import type { OnboardingSnapshot } from "@/lib/onboarding/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

interface OnboardingSummaryProps {
  answers: OnboardingSnapshot;
  /** When provided, "Edit section" calls this with the step number (1–6) so the parent can e.g. open that onboarding step. */
  onEditSection?: (step: number) => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  step: number;
  children: React.ReactNode;
  onEditSection?: (step: number) => void;
}

function Section({ title, icon, step, children, onEditSection }: SectionProps) {
  function handleEditClick() {
    onEditSection?.(step);
  }
  return (
    <GlassCard className="p-5 sm:p-6 space-y-4" variant="default">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600">
            {icon}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-text-primary">{title}</h3>
            <p className="text-xs text-text-muted">Step {step}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleEditClick}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary-500/20 bg-white px-3 py-1.5 text-xs font-medium text-primary-600 shadow-sm hover:border-primary-500 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        >
          Edit section
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </GlassCard>
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
    <div className="rounded-card border border-bg-border bg-bg-main px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">{label}</p>
      <div className="text-sm font-medium text-text-primary break-words">{value}</div>
    </div>
  );
}

export function OnboardingSummary({ answers, onEditSection }: OnboardingSummaryProps) {
  const {
    gradeLevel,
    lifeSatisfaction,
    addingToLife,
    eliminatingFromLife,
    academicSuccessCrucial,
    naturalSkills,
    favoriteClass,
    workInclination,
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
    placementRatesImportance,
    gpa,
    gpaScale,
    examsTaken,
    satTotal,
    actComposite,
    apExamsCount,
    apAverageScore,
    rigorousApCompleted,
    rigorousIbCompleted,
    rigorousHonorsCompleted,
    activityTypes,
    activityRanking,
    awardsSchool,
    awardsState,
    awardsNational,
    awardsInternational,
    admissionProcessConfidence,
    selectivityImportance,
    locationPreferenceStates,
    campusUrbanSuburbanRural,
    campusLectureVsSeminar,
    campusCoreVsOpen,
    campusQuizzesVsExams,
    campusIntensityVsBalanced,
    hasCollegeList,
    collegeListReachMatchSafety,
    collegeListVisited,
    collegeListWhatLike,
    applicationStrategy,
  } = answers;

  const lifeSatLabel = lifeSatisfaction != null ? `${lifeSatisfaction} / 10` : null;
  const careerConfLabel = careerConfidence != null ? `${careerConfidence} / 10` : null;
  const coursesLabel =
    knowCoursesStandOut === "Yes"
      ? "Yes"
      : knowCoursesStandOut === "No"
      ? "No"
      : knowCoursesStandOut === "Somewhat"
      ? "Somewhat"
      : null;
  const tutoringAwarenessLabel =
    knowActivitiesStandOut != null ? `${knowActivitiesStandOut} / 10` : null;
  const placementLabel =
    placementRatesImportance != null ? `${placementRatesImportance} / 10` : null;
  const admissionConfLabel =
    admissionProcessConfidence != null ? `${admissionProcessConfidence} / 10` : null;
  const selectivityLabel =
    selectivityImportance != null ? `${selectivityImportance} / 10` : null;

  const activitiesSummary =
    activityTypes && activityTypes.length
      ? `${activityTypes.length} activity type${activityTypes.length > 1 ? "s" : ""} listed`
      : null;

  const awardsCount =
    (awardsSchool?.length ?? 0) +
    (awardsState?.length ?? 0) +
    (awardsNational?.length ?? 0) +
    (awardsInternational?.length ?? 0);

  const awardsSummary = awardsCount ? `${awardsCount} award${awardsCount > 1 ? "s" : ""}` : null;

  const activityRankingLabel =
    activityRanking && activityRanking.length ? activityRanking.join(" → ") : null;

  const workInclinationLabel =
    workInclination && workInclination.length ? workInclination.join(" → ") : null;

  const interestLabel =
    areasOfInterest && areasOfInterest.length ? areasOfInterest.join(", ") : null;

  const examsLabel =
    examsTaken && examsTaken.length
      ? `${examsTaken.length} exam type${examsTaken.length > 1 ? "s" : ""}: ${examsTaken.join(
          ", "
        )}`
      : null;

  const locationLabel =
    locationPreferenceStates && locationPreferenceStates.length
      ? locationPreferenceStates.join(", ")
      : null;

  return (
    <div className={cn("space-y-4 sm:space-y-5")}>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary-500" />
            Your questionnaire answers
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-text-muted">
            This is a structured view of everything you shared in onboarding. You can jump back into
            any step to update your answers.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Step 1 – Life outlook */}
        <Section
          title="Basic information & life outlook"
          icon={<Lightbulb className="h-4 w-4" aria-hidden />}
          step={1}
          onEditSection={onEditSection}
        >
          <Field label="Current grade level" value={gradeLevel} />
          <Field label="Life satisfaction" value={lifeSatLabel} />
          <Field label="If you could add anything to your life" value={addingToLife} />
          <Field
            label="What you would remove to reduce burden"
            value={eliminatingFromLife}
          />
          <Field
            label="Is academic success crucial for your happiness?"
            value={academicSuccessCrucial}
          />
          <Field label="What you are naturally good at" value={naturalSkills} />
          <Field label="Favorite class" value={favoriteClass} />
        </Section>

        {/* Step 2 – Character & learning profile */}
        <Section
          title="Character & learning profile"
          icon={<Users className="h-4 w-4" aria-hidden />}
          step={2}
          onEditSection={onEditSection}
        >
          <Field label="Work inclination" value={workInclinationLabel} />
          <Field
            label="Structured vs. open-ended"
            value={intellectualStructuredVsOpen}
          />
          <Field
            label="Lecture-based vs. discussion-based"
            value={intellectualLectureVsDiscussion}
          />
          <Field
            label="Research-driven vs. application-driven"
            value={intellectualResearchVsApplication}
          />
          <Field
            label="Theoretical vs. hands-on"
            value={intellectualTheoreticalVsHandsOn}
          />
          <Field
            label="Competitive or collaborative"
            value={socialCompetitiveVsCollaborative}
          />
          <Field
            label="Introverted or socially energized"
            value={socialIntrovertedVsSocial}
          />
          <Field label="Large networks vs. tight circles" value={socialLargeVsTight} />
          <Field label="Independent vs. guided" value={socialIndependentVsGuided} />
        </Section>

        {/* Step 3 – Career & goals */}
        <Section
          title="Career direction & long-term goals"
          icon={<Target className="h-4 w-4" aria-hidden />}
          step={3}
          onEditSection={onEditSection}
        >
          <Field label="Career path in mind" value={careerPath} />
          <Field label="Career path details" value={careerPathWhat} />
          <Field label="Confidence about this path" value={careerConfLabel} />
          <Field label="Academic / major interests" value={interestLabel} />
          <Field label="Target degree" value={targetDegree} />
          <Field
            label="Awareness of standout courses"
            value={coursesLabel}
          />
          <Field
            label="Awareness of standout activities"
            value={tutoringAwarenessLabel}
          />
          <Field
            label="Importance of placement rates"
            value={placementLabel}
          />
        </Section>

        {/* Step 4 – Academic profile */}
        <Section
          title="Academic profile & exams"
          icon={<GraduationCap className="h-4 w-4" aria-hidden />}
          step={4}
          onEditSection={onEditSection}
        >
          <Field
            label="GPA"
            value={gpa != null ? `${gpa}${gpaScale ? ` / ${gpaScale}.0` : ""}` : null}
          />
          <Field label="Exam types taken" value={examsLabel} />
          <Field label="SAT total (superscore)" value={satTotal} />
          <Field label="ACT composite" value={actComposite} />
          <Field
            label="AP exams completed"
            value={apExamsCount != null ? apExamsCount : null}
          />
          <Field
            label="AP average score"
            value={apAverageScore != null ? apAverageScore : null}
          />
          <Field
            label="Rigorous coursework (AP / IB / Honors completed)"
            value={
              rigorousApCompleted || rigorousIbCompleted || rigorousHonorsCompleted
                ? `${rigorousApCompleted ?? 0} AP · ${rigorousIbCompleted ?? 0} IB · ${
                    rigorousHonorsCompleted ?? 0
                  } Honors`
                : null
            }
          />
        </Section>

        {/* Step 5 – Activities & achievements */}
        <Section
          title="Extracurricular activities & achievements"
          icon={<Compass className="h-4 w-4" aria-hidden />}
          step={5}
          onEditSection={onEditSection}
        >
          <Field label="Activity types & intensity" value={activitiesSummary} />
          <Field
            label="How you rank your activities"
            value={activityRankingLabel}
          />
          <Field label="Honors & awards" value={awardsSummary} />
        </Section>

        {/* Step 6 – College preferences */}
        <Section
          title="College preferences & current status"
          icon={<ClipboardList className="h-4 w-4" aria-hidden />}
          step={6}
          onEditSection={onEditSection}
        >
          <Field
            label="Confidence in admission process"
            value={admissionConfLabel}
          />
          <Field
            label="Importance of college selectivity"
            value={selectivityLabel}
          />
          <Field label="Preferred states" value={locationLabel} />
          <Field
            label="Campus setting (urban / suburban / rural)"
            value={campusUrbanSuburbanRural}
          />
          <Field
            label="Lecture vs. seminar preference"
            value={campusLectureVsSeminar}
          />
          <Field
            label="Core vs. open curriculum"
            value={campusCoreVsOpen}
          />
          <Field
            label="Weekly quizzes vs. high-stakes exams"
            value={campusQuizzesVsExams}
          />
          <Field
            label="High-intensity vs. balanced life"
            value={campusIntensityVsBalanced}
          />
          <Field
            label="Do you already have a college list?"
            value={hasCollegeList}
          />
          <Field
            label="Your current reach/match/safety list"
            value={collegeListReachMatchSafety}
          />
          <Field
            label="Colleges you have visited"
            value={collegeListVisited}
          />
          <Field
            label="What you like about your current list"
            value={collegeListWhatLike}
          />
          <Field
            label="Application strategy (ED / EA / RD)"
            value={applicationStrategy}
          />
        </Section>
      </div>
    </div>
  );
}

