"use client";

import type {
  OnboardingAnswers,
  WorkInclinationItem,
  InterestCategory,
  ExamType,
  ActivityType,
  ActivityWithIntensity,
  ActivityRankItem,
  AwardItem,
} from "./schema";
import {
  defaultAnswers,
  WORK_INCLINATION_ITEMS,
  INTEREST_CATEGORIES,
  EXAM_TYPES,
  ACTIVITY_TYPES,
  ACTIVITY_RANK_ITEMS,
} from "./schema";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

const LOCAL_KEY = "onboardingAnswers";

function sanitizeDraft(parsed: unknown): OnboardingAnswers {
  if (!parsed || typeof parsed !== "object") return { ...defaultAnswers };
  const o = parsed as Record<string, unknown>;
  const out: OnboardingAnswers = { ...defaultAnswers };
  const keys: (keyof OnboardingAnswers)[] = [
    "profilePhotoDataUrl",
    "firstName", "lastName", "dateOfBirth", "gender", "genderOther", "country", "state", "city",
    "currentHighSchool", "expectedGraduationYear",
    "gradeLevel", "lifeSatisfaction", "addingToLife", "eliminatingFromLife",
    "academicSuccessCrucial", "naturalSkills", "favoriteClass",
    "workInclination", "intellectualStructuredVsOpen", "intellectualLectureVsDiscussion",
    "intellectualResearchVsApplication", "intellectualTheoreticalVsHandsOn",
    "socialCompetitiveVsCollaborative", "socialIntrovertedVsSocial", "socialLargeVsTight", "socialIndependentVsGuided",
    "careerPath", "careerPathWhat", "careerConfidence", "areasOfInterest", "interestOther",
    "targetDegree", "knowCoursesStandOut", "knowActivitiesStandOut", "placementRatesImportance",
    "graduationYear", "gpa", "gpaScale", "satScore", "actScore", "preferredSize", "preferredStates",
    "examsTaken", "psatTotal", "satReadingWriting", "satMath", "satTotal",
    "actComposite", "actEnglish", "actMath", "actReading", "actScience",
    "apExamsCount", "apAverageScore", "ibTotal", "toeflScore", "ieltsScore", "duolingoScore", "pteScore",
    "rigorousApCompleted", "rigorousApThisYear", "rigorousIbCompleted", "rigorousIbThisYear",
    "rigorousHonorsCompleted", "rigorousHonorsThisYear",
    "collegeCredits", "collegeCreditsDetail", "researchPrograms", "researchProgramsDetail",
    "tutoringBenefit", "difficultiesOptional",
    "activityTypes", "activityRanking", "awardsSchool", "awardsState", "awardsNational", "awardsInternational",
    "admissionProcessConfidence", "selectivityImportance", "locationPreferenceStates",
    "campusUrbanSuburbanRural", "campusLectureVsSeminar", "campusCoreVsOpen", "campusQuizzesVsExams", "campusIntensityVsBalanced",
    "hasCollegeList", "collegeListReachMatchSafety", "collegeListVisited", "collegeListWhatLike", "applicationStrategy",
  ];
  for (const k of keys) {
    const v = o[k];
    if (v === undefined) continue;
    if (k === "workInclination" && Array.isArray(v)) {
      const set = new Set(WORK_INCLINATION_ITEMS);
      out.workInclination = v.filter((x): x is WorkInclinationItem => typeof x === "string" && set.has(x as WorkInclinationItem));
      continue;
    }
    if (k === "areasOfInterest" && Array.isArray(v)) {
      const set = new Set(INTEREST_CATEGORIES);
      out.areasOfInterest = v.filter((x): x is InterestCategory => typeof x === "string" && set.has(x as InterestCategory));
      continue;
    }
    if (k === "examsTaken" && Array.isArray(v)) {
      const set = new Set(EXAM_TYPES);
      out.examsTaken = v.filter((x): x is ExamType => typeof x === "string" && set.has(x as ExamType));
      continue;
    }
    if (k === "locationPreferenceStates" && Array.isArray(v)) {
      out.locationPreferenceStates = v.filter((x): x is string => typeof x === "string");
      continue;
    }
    if (k === "activityTypes" && Array.isArray(v)) {
      const typeSet = new Set(ACTIVITY_TYPES);
      out.activityTypes = v
        .map((x): ActivityWithIntensity | null => {
          if (typeof x !== "object" || !x || !("type" in x)) return null;
          const t = (x as { type: string }).type;
          const type = typeSet.has(t as ActivityType) ? (t as ActivityType) : null;
          if (!type) return null;
          const weeks = (x as { weeksParticipated?: number }).weeksParticipated;
          const hours = (x as { hoursPerWeek?: number }).hoursPerWeek;
          return {
            type,
            ...(typeof weeks === "number" && !Number.isNaN(weeks) ? { weeksParticipated: weeks } : {}),
            ...(typeof hours === "number" && !Number.isNaN(hours) ? { hoursPerWeek: hours } : {}),
          };
        })
        .filter((x): x is ActivityWithIntensity => x !== null);
      continue;
    }
    if (k === "activityRanking" && Array.isArray(v)) {
      const set = new Set(ACTIVITY_RANK_ITEMS);
      out.activityRanking = v.filter((x): x is ActivityRankItem => typeof x === "string" && set.has(x as ActivityRankItem));
      continue;
    }
    if ((k === "awardsSchool" || k === "awardsState" || k === "awardsNational" || k === "awardsInternational") && Array.isArray(v)) {
      const items: AwardItem[] = v.map((x) => {
        if (typeof x === "object" && x && "title" in x) {
          return {
            title: String((x as { title: string }).title),
            ...((x as { description?: string }).description != null ? { description: String((x as { description?: string }).description) } : {}),
          };
        }
        return { title: String(x) };
      });
      (out as Record<string, AwardItem[]>)[k] = items;
      continue;
    }
    if (typeof v === "number" && !Number.isNaN(v)) {
      (out as Record<string, unknown>)[k] = v;
      continue;
    }
    if (typeof v === "string") {
      (out as Record<string, unknown>)[k] = v;
      continue;
    }
    if (k === "preferredSize" && (v === "small" || v === "medium" || v === "large")) {
      out.preferredSize = v;
    }
    if (k === "gpaScale" && (v === 4 || v === 5)) {
      out.gpaScale = v;
    }
  }
  return out;
}

/** Get draft answers from localStorage (source of truth during wizard when unauthenticated). */
export function getOnboardingDraft(): OnboardingAnswers {
  if (typeof window === "undefined") return { ...defaultAnswers };
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { ...defaultAnswers };
    return sanitizeDraft(JSON.parse(raw));
  } catch {
    return { ...defaultAnswers };
  }
}

/** Save draft to localStorage (merge partial into current). */
export function saveOnboardingDraft(answers: Partial<OnboardingAnswers>): void {
  if (typeof window === "undefined") return;
  const current = getOnboardingDraft();
  const next = { ...current, ...answers };
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
}

/** Persist full answers to Firestore: users/{uid} with onboardingAnswers, onboarding.completed, onboarding.progress.
 * Firestore document size limit is 1 MB; profile photo is not stored here. Long text fields are truncated to avoid limit.
 * Concurrent writes from multiple tabs: last write wins (merge: true). For critical conflict handling, consider runTransaction.
 */
const MAX_STRING_BYTES = 8 * 1024;

function truncateStrings(obj: Record<string, unknown>): void {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === "string" && v.length > MAX_STRING_BYTES) {
      obj[k] = v.slice(0, MAX_STRING_BYTES);
    } else if (v && typeof v === "object" && !Array.isArray(v) && typeof (v as Record<string, unknown>).length !== "number") {
      truncateStrings(v as Record<string, unknown>);
    } else if (Array.isArray(v)) {
      v.forEach((item) => {
        if (item && typeof item === "object" && item !== null) truncateStrings(item as Record<string, unknown>);
      });
    }
  }
}

/** Normalize answers for Firestore write: sanitize values, drop photo, truncate long strings. */
function normalizeOnboardingForWrite(answers: OnboardingAnswers): OnboardingAnswers {
  const sanitized = sanitizeDraft(answers);
  const cleanAnswers = JSON.parse(JSON.stringify(sanitized)) as OnboardingAnswers;
  delete cleanAnswers.profilePhotoDataUrl;
  truncateStrings(cleanAnswers as unknown as Record<string, unknown>);
  return cleanAnswers;
}

export async function persistOnboardingToFirestore(uid: string, answers: OnboardingAnswers): Promise<void> {
  const userRef = doc(db, "users", uid);
  const cleanAnswers = normalizeOnboardingForWrite(answers);
  await setDoc(
    userRef,
    {
      onboardingAnswers: cleanAnswers,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
      onboarding: { completed: true, progress: 100 },
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/** Get onboarding answers from Firestore (for logged-in users). */
export async function getOnboardingFromFirestore(uid: string): Promise<OnboardingAnswers | null> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  const answers = data?.onboardingAnswers;
  if (!answers || typeof answers !== "object") return null;
  return sanitizeDraft(answers);
}

/** Clear localStorage draft after successful persist. */
export function clearOnboardingDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_KEY);
}
