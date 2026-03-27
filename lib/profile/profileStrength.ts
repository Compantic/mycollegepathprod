/**
 * Compute profile completion % from onboarding answers (for display only).
 * Does not change any data or schema.
 */
import type { OnboardingSnapshot } from "@/lib/onboarding/types";

const FIELDS_TO_CHECK: (keyof OnboardingSnapshot)[] = [
  "firstName",
  "lastName",
  "currentHighSchool",
  "expectedGraduationYear",
  "gradeLevel",
  "city",
  "state",
  "gpa",
  "satScore",
  "actScore",
  "careerPath",
  "careerConfidence",
  "areasOfInterest",
  "targetDegree",
  "workInclination",
  "intellectualStructuredVsOpen",
  "activityTypes",
  "awardsSchool",
  "awardsState",
  "awardsNational",
  "awardsInternational",
  "locationPreferenceStates",
  "campusUrbanSuburbanRural",
  "applicationStrategy",
  "lifeSatisfaction",
  "naturalSkills",
  "favoriteClass",
];

export function computeProfileStrength(answers: OnboardingSnapshot | null | undefined): number {
  if (!answers || typeof answers !== "object") return 0;
  let filled = 0;
  for (const key of FIELDS_TO_CHECK) {
    const v = answers[key];
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    filled++;
  }
  return Math.min(100, Math.round((filled / FIELDS_TO_CHECK.length) * 100));
}
