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
  IntrovertedVsSocial,
  IntensityVsBalanced,
} from "./schema";
import {
  defaultAnswers,
  WORK_INCLINATION_ITEMS,
  PREFERENCE_CORE_OPTIONS,
  INTEREST_CATEGORIES,
  EXAM_TYPES,
  ACTIVITY_TYPES,
  ACTIVITY_RANK_ITEMS,
} from "./schema";
import { normalizeAcademicAnswers } from "./academicValidation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

const LOCAL_KEY = "onboardingAnswers";

const LEGACY_EXAM_TO_NEW: Record<string, ExamType> = {
  "PTE Academic": "PTE",
};

const LEGACY_ACTIVITY_TO_NEW: Record<string, ActivityType> = {
  "Arts/Music": "Arts",
  Clubs: "Clubs",
  "Community engagement": "Volunteering",
  "Family responsibilities": "Family responsibilities",
  Hobbies: "Other",
  Sports: "Sports",
  "Work/Volunteering": "Work",
};

function migrateLegacyAnswers(out: OnboardingAnswers): void {
  if (out.areasOfInterest?.length) {
    out.areasOfInterest = out.areasOfInterest.map((x) =>
      x === ("Health Professions" as unknown as InterestCategory) ? "Health" : x
    ) as InterestCategory[];
  }

  if (out.examsTaken?.length) {
    const allowed = new Set(EXAM_TYPES);
    out.examsTaken = out.examsTaken
      .map((x) => LEGACY_EXAM_TO_NEW[x] ?? x)
      .filter((x): x is ExamType => typeof x === "string" && allowed.has(x as ExamType));
  }

  if (out.activityTypes?.length) {
    const typeSet = new Set(ACTIVITY_TYPES);
    out.activityTypes = out.activityTypes
      .map((a): ActivityWithIntensity | null => {
        let t = a.type as string;
        if (LEGACY_ACTIVITY_TO_NEW[t]) t = LEGACY_ACTIVITY_TO_NEW[t];
        if (!typeSet.has(t as ActivityType)) return null;
        return {
          type: t as ActivityType,
          ...(typeof a.weeksParticipated === "number" ? { weeksParticipated: a.weeksParticipated } : {}),
          ...(typeof a.hoursPerWeek === "number" ? { hoursPerWeek: a.hoursPerWeek } : {}),
        };
      })
      .filter((x): x is ActivityWithIntensity => x !== null);
  }

  const intro = out.socialIntrovertedVsSocial as string | undefined;
  if (intro === "Socially energized") {
    out.socialIntrovertedVsSocial = "Social";
  }

  const intensity = out.campusIntensityVsBalanced as string | string[] | undefined;
  if (intensity === "Balanced life") {
    out.campusIntensityVsBalanced = ["Lifestyle"];
  }

  if (!out.preferenceCoreType && out.workInclination?.[0]) {
    const first = out.workInclination[0];
    if (WORK_INCLINATION_ITEMS.includes(first)) out.preferenceCoreType = first;
  }

  if (out.favoriteSubjectsRank && out.favoriteSubjectsRank.length > 3) {
    out.favoriteSubjectsRank = out.favoriteSubjectsRank.slice(0, 3);
  }

  // Migrate legacy awards to consolidated list
  if (!out.awardsConsolidated || out.awardsConsolidated.length === 0) {
    const consolidated: any[] = [];
    const mapping: Record<string, any> = {
      awardsSchool: "School",
      awardsState: "State",
      awardsNational: "National",
      awardsInternational: "International",
    };
    for (const [key, level] of Object.entries(mapping)) {
      const legacy = (out as any)[key];
      if (Array.isArray(legacy)) {
        legacy.forEach((a: any) => {
          if (a && typeof a === "object" && a.title) {
            consolidated.push({
              title: a.title,
              description: a.description || "",
              level: level,
            });
          }
        });
      }
    }
    if (consolidated.length > 0) {
      out.awardsConsolidated = consolidated;
    }
  }

  // Migrate single-select preferences to multi-select arrays
  const multiSelectFields = [
    "campusUrbanSuburbanRural",
    "campusLectureVsSeminar",
    "campusCoreVsOpen",
    "campusIntensityVsBalanced",
    "collegeSectorPreference",
    "applicationStrategy",
  ];
  multiSelectFields.forEach((field) => {
    const val = (out as any)[field];
    if (val && typeof val === "string") {
      (out as any)[field] = [val];
    }
  });
}

function sanitizeDraft(parsed: unknown): OnboardingAnswers {
  if (!parsed || typeof parsed !== "object") return { ...defaultAnswers };
  const o = parsed as Record<string, unknown>;
  const out: OnboardingAnswers = { ...defaultAnswers };
  const keys: (keyof OnboardingAnswers)[] = [
    "profilePhotoDataUrl",
    "firstName",
    "lastName",
    "dateOfBirth",
    "gender",
    "genderOther",
    "country",
    "state",
    "city",
    "currentHighSchool",
    "expectedGraduationYear",
    "gradeLevel",
    "lifeSatisfaction",
    "addingToLife",
    "eliminatingFromLife",
    "academicSuccessCrucial",
    "naturalSkills",
    "favoriteSubjectsRank",
    "intellectualStructuredVsOpen",
    "intellectualLectureVsDiscussion",
    "intellectualResearchVsApplication",
    "intellectualTheoreticalVsHandsOn",
    "socialCompetitiveVsCollaborative",
    "socialIntrovertedVsSocial",
    "socialLargeVsTight",
    "socialIndependentVsGuided",
    "preferenceCoreType",
    "workInclination",
    "studySkillsConfidence",
    "focusDifficulty",
    "careerPath",
    "careerPathWhat",
    "careerConfidence",
    "areasOfInterest",
    "interestOther",
    "knowCoursesStandOut",
    "knowActivitiesStandOut",
    "targetDegree",
    "placementRatesImportance",
    "graduationYear",
    "gpa",
    "gpaScale",
    "satScore",
    "actScore",
    "preferredSize",
    "preferredStates",
    "examsTaken",
    "psatTotal",
    "satReadingWriting",
    "satMath",
    "satTotal",
    "actComposite",
    "actEnglish",
    "actMath",
    "actReading",
    "actScience",
    "apExamsCount",
    "apAverageScore",
    "ibTotal",
    "toeflScore",
    "ieltsScore",
    "duolingoScore",
    "pteScore",
    "rigorousApCompleted",
    "rigorousApThisYear",
    "rigorousApDetails",
    "rigorousApCourses",
    "rigorousIbCompleted",
    "rigorousIbThisYear",
    "rigorousIbDetails",
    "rigorousIbCourses",
    "rigorousHonorsCompleted",
    "rigorousHonorsThisYear",
    "rigorousHonorsDetails",
    "rigorousHonorsCourses",
    "collegeCredits",
    "collegeCreditsDetail",
    "researchPrograms",
    "researchProgramsDetail",
    "difficultiesOptional",
    "activityTypes",
    "awardsSchool",
    "awardsState",
    "awardsNational",
    "awardsInternational",
    "awardsConsolidated",
    "tutoringBenefit",
    "admissionProcessConfidence",
    "selectivityImportance",
    "locationPreferenceStates",
    "campusUrbanSuburbanRural",
    "campusLectureVsSeminar",
    "campusCoreVsOpen",
    "campusQuizzesVsExams",
    "campusIntensityVsBalanced",
    "collegeSectorPreference",
    "degreeLengthPreference",
    "internationalOpenness",
    "budgetPerYear",
    "familyIncome",
    "fafsaEligibility",
    "hasCollegeList",
    "collegeListReachMatchSafety",
    "collegeListVisited",
    "collegeListWhatLike",
    "applicationStrategy",
    "favoriteClass",
  ];
  for (const k of keys) {
    const v = o[k];
    if (v === undefined) continue;
    if (k === "workInclination" && Array.isArray(v)) {
      const set = new Set(WORK_INCLINATION_ITEMS);
      out.workInclination = v.filter((x): x is WorkInclinationItem => typeof x === "string" && set.has(x as WorkInclinationItem));
      continue;
    }
    if (k === "favoriteSubjectsRank" && Array.isArray(v)) {
      out.favoriteSubjectsRank = v.filter((x): x is string => typeof x === "string").slice(0, 3);
      continue;
    }
    if (k === "preferenceCoreType" && typeof v === "string") {
      const set = new Set(PREFERENCE_CORE_OPTIONS);
      if (set.has(v as (typeof PREFERENCE_CORE_OPTIONS)[number])) {
        out.preferenceCoreType = v as (typeof PREFERENCE_CORE_OPTIONS)[number];
      }
      continue;
    }
    if (k === "areasOfInterest" && Array.isArray(v)) {
      const set = new Set(INTEREST_CATEGORIES);
      out.areasOfInterest = v
        .map((x) => (x === "Health Professions" ? "Health" : x))
        .filter((x): x is InterestCategory => typeof x === "string" && set.has(x as InterestCategory));
      continue;
    }
    if (k === "examsTaken" && Array.isArray(v)) {
      const allowed = new Set(EXAM_TYPES);
      out.examsTaken = v
        .map((x) => (typeof x === "string" ? LEGACY_EXAM_TO_NEW[x] ?? x : x))
        .filter((x): x is ExamType => typeof x === "string" && allowed.has(x as ExamType));
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
          let t = (x as { type: string }).type;
          if (LEGACY_ACTIVITY_TO_NEW[t]) t = LEGACY_ACTIVITY_TO_NEW[t];
          const type = typeSet.has(t as ActivityType) ? (t as ActivityType) : null;
          if (!type) return null;
          const weeks = (x as { weeksParticipated?: number }).weeksParticipated;
          const hours = (x as { hoursPerWeek?: number }).hoursPerWeek;
          const description = (x as { description?: string }).description;
          return {
            type,
            ...(typeof weeks === "number" && !Number.isNaN(weeks) ? { weeksParticipated: weeks } : {}),
            ...(typeof hours === "number" && !Number.isNaN(hours) ? { hoursPerWeek: hours } : {}),
            ...(typeof description === "string" ? { description } : {}),
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
    if (k === "awardsConsolidated" && Array.isArray(v)) {
      const items: any[] = v.map((x) => {
        if (typeof x === "object" && x && "title" in x) {
          return {
            title: String((x as { title: string }).title),
            description: String((x as { description?: string }).description || ""),
            level: ["School", "State", "National", "International"].includes((x as { level: string }).level) 
              ? (x as { level: string }).level 
              : "School",
          };
        }
        return null;
      }).filter(x => x !== null);
      out.awardsConsolidated = items;
      continue;
    }
    if ((k === "rigorousApCourses" || k === "rigorousIbCourses" || k === "rigorousHonorsCourses") && Array.isArray(v)) {
      const courses: any[] = v.map((x) => {
        if (typeof x === "object" && x && "name" in x) {
          return {
            name: String((x as { name: string }).name),
            status: (x as { status: string }).status === "This Year" ? "This Year" : "Completed",
          };
        }
        return null;
      }).filter(x => x !== null);
      (out as Record<string, any[]>)[k] = courses;
      continue;
    }
    if (k === "internationalOpenness") {
      out.internationalOpenness = v === "Must" || v === "No preference" ? v : undefined;
      continue;
    }

    if (
      ["campusUrbanSuburbanRural", "campusLectureVsSeminar", "campusCoreVsOpen", "campusIntensityVsBalanced", "collegeSectorPreference", "applicationStrategy"].includes(k)
    ) {
      if (Array.isArray(v)) {
        (out as any)[k] = v.filter(x => typeof x === "string");
      } else if (typeof v === "string") {
        (out as any)[k] = [v];
      }
      continue;
    }

    if (typeof v === "number" && !Number.isNaN(v)) {
      (out as Record<string, unknown>)[k] = v;
      continue;
    }
    if (typeof v === "string" && v.trim()) {
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
  migrateLegacyAnswers(out);
  return normalizeAcademicAnswers(out);
}

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

export type SaveOnboardingDraftStatus = "ok" | "quota_photo_removed" | "failed";

function isQuotaError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "QuotaExceededError";
}

/**
 * Merges partial answers into the draft and persists to localStorage.
 * Large profile photos should be resized before calling (see fileToProfileJpegDataUrl).
 */
export function saveOnboardingDraft(answers: Partial<OnboardingAnswers>): SaveOnboardingDraftStatus {
  if (typeof window === "undefined") return "ok";
  const current = getOnboardingDraft();
  const next = normalizeAcademicAnswers({ ...current, ...answers });
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    return "ok";
  } catch (e) {
    if (!isQuotaError(e)) throw e;
    if (next.profilePhotoDataUrl) {
      const { profilePhotoDataUrl: _drop, ...withoutPhoto } = next;
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(withoutPhoto));
        return "quota_photo_removed";
      } catch {
        return "failed";
      }
    }
    return "failed";
  }
}

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

export async function getOnboardingFromFirestore(uid: string): Promise<OnboardingAnswers | null> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  const answers = data?.onboardingAnswers;
  if (!answers || typeof answers !== "object") return null;
  return sanitizeDraft(answers);
}

export function clearOnboardingDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_KEY);
}
