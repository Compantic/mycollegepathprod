/**
 * Server-only Firestore helpers using admin SDK.
 * Use in API routes or server components; do not import in client code.
 */
import { adminDb } from "./admin";
import type { StudentProfile } from "./firestore";
import type { CollegeMatch } from "@/lib/matching/types";
import type { OnboardingSnapshot } from "@/lib/onboarding/types";

const USERS = "users";
const STUDENT_PROFILES = "studentProfiles";
const MATCHES_SUBCOLLECTION = "matches";
const ROADMAPS_SUBCOLLECTION = "roadmaps";
const APPLY_NOW_SUBCOLLECTION = "applyNow";

export interface ServerStudentProfile {
  gpa?: number;
  satScore?: number;
  actScore?: number;
  preferredMajors?: string[];
  preferredStates?: string[];
  preferredSize?: "small" | "medium" | "large";
}

export async function getStudentProfileForServer(userId: string): Promise<ServerStudentProfile | null> {
  const ref = adminDb.collection(STUDENT_PROFILES).doc(userId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as StudentProfile;
  return {
    gpa: data.gpa,
    satScore: data.satScore,
    actScore: data.actScore,
    preferredMajors: data.preferredMajors,
    preferredStates: data.preferredStates,
    preferredSize: data.preferredSize,
  };
}

export async function getOnboardingAnswersForServer(userId: string): Promise<OnboardingSnapshot | null> {
  const ref = adminDb.collection(USERS).doc(userId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as { onboardingAnswers?: OnboardingSnapshot } | undefined;
  return (data?.onboardingAnswers as OnboardingSnapshot | undefined) ?? null;
}

/** Firestore does not accept undefined; strip via JSON round-trip. */
function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export async function saveMatchingRun(
  userId: string,
  runId: string,
  matches: CollegeMatch[]
): Promise<void> {
  const ref = adminDb.collection(USERS).doc(userId).collection(MATCHES_SUBCOLLECTION).doc(runId);
  const scoreTelemetry = matches.length
    ? {
        count: matches.length,
        raw: {
          min: Math.min(...matches.map((m) => m.rawScore ?? m.matchScore)),
          max: Math.max(...matches.map((m) => m.rawScore ?? m.matchScore)),
          avg:
            matches.reduce((acc, m) => acc + (m.rawScore ?? m.matchScore), 0) /
            Math.max(matches.length, 1),
        },
        calibrated: {
          min: Math.min(...matches.map((m) => m.calibratedScore ?? m.matchScore)),
          max: Math.max(...matches.map((m) => m.calibratedScore ?? m.matchScore)),
          avg:
            matches.reduce((acc, m) => acc + (m.calibratedScore ?? m.matchScore), 0) /
            Math.max(matches.length, 1),
        },
      }
    : null;
  const payload = stripUndefined({
    runId,
    matches,
    scoreTelemetry,
    createdAt: new Date().toISOString(),
  });
  await ref.set(payload);
}

export interface MatchRunDoc {
  runId: string;
  matches: CollegeMatch[];
  scoreTelemetry?: {
    count: number;
    raw: { min: number; max: number; avg: number };
    calibrated: { min: number; max: number; avg: number };
  } | null;
  createdAt: string;
}

export async function getLatestMatchRun(userId: string): Promise<MatchRunDoc | null> {
  const ref = adminDb.collection(USERS).doc(userId).collection(MATCHES_SUBCOLLECTION);
  const snap = await ref.orderBy("createdAt", "desc").limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].data() as MatchRunDoc;
}

export async function getMatchRunsForServer(
  userId: string,
  limit = 10,
  cursor?: string | null
): Promise<{ runs: MatchRunDoc[]; nextCursor: string | null }> {
  const ref = adminDb.collection(USERS).doc(userId).collection(MATCHES_SUBCOLLECTION);
  let query = ref.orderBy("createdAt", "desc").limit(limit);
  if (cursor) {
    query = query.startAfter(cursor) as typeof query;
  }
  const snap = await query.get();
  if (snap.empty) return { runs: [], nextCursor: null };
  const runs = snap.docs.map((d) => d.data() as MatchRunDoc);
  const last = runs[runs.length - 1];
  return { runs, nextCursor: runs.length === limit ? (last?.createdAt ?? null) : null };
}

// ----- Roadmaps -----

import type { RoadmapResult } from "@/lib/roadmap/types";

export interface RoadmapDoc {
  roadmapId: string;
  roadmap: RoadmapResult;
  createdAt: string;
  completedItemIds?: string[];
}

export async function saveRoadmapForServer(
  userId: string,
  roadmapId: string,
  roadmap: RoadmapResult
): Promise<void> {
  const ref = adminDb.collection(USERS).doc(userId).collection(ROADMAPS_SUBCOLLECTION).doc(roadmapId);
  const payload = stripUndefined({
    roadmapId,
    roadmap,
    createdAt: new Date().toISOString(),
  });
  await ref.set(payload);
}

export async function updateRoadmapCompletionForServer(
  userId: string,
  roadmapId: string,
  completedItemIds: string[]
): Promise<void> {
  const ref = adminDb.collection(USERS).doc(userId).collection(ROADMAPS_SUBCOLLECTION).doc(roadmapId);
  await ref.set(
    stripUndefined({
      completedItemIds,
      updatedAt: new Date().toISOString(),
    }),
    { merge: true }
  );
}

export async function getRoadmapsForServer(
  userId: string,
  limit = 10,
  cursor?: string | null
): Promise<{ runs: RoadmapDoc[]; nextCursor: string | null }> {
  const ref = adminDb.collection(USERS).doc(userId).collection(ROADMAPS_SUBCOLLECTION);
  let query = ref.orderBy("createdAt", "desc").limit(limit);
  if (cursor) {
    query = query.startAfter(cursor) as typeof query;
  }
  const snap = await query.get();
  if (snap.empty) return { runs: [], nextCursor: null };
  const runs = snap.docs.map((d) => d.data() as RoadmapDoc);
  const last = runs[runs.length - 1];
  return { runs, nextCursor: runs.length === limit ? (last?.createdAt ?? null) : null };
}

export async function getFavoritesForServer(userId: string): Promise<{ collegeId: number; name: string }[]> {
  const ref = adminDb.collection(USERS).doc(userId).collection("favorites");
  const snap = await ref.get();
  return snap.docs.map((d) => {
    const data = d.data();
    return { collegeId: Number(data.collegeId), name: String(data.name ?? "") };
  });
}

// ----- AI Score -----

const AI_SCORES = "aiScores";

export interface AiScoreDoc {
  uid: string;
  displayName: string;
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  evaluatedAt: string;
  model: string;
}

export async function saveAiScoreForServer(
  userId: string,
  input: Omit<AiScoreDoc, "uid" | "evaluatedAt">
): Promise<AiScoreDoc> {
  const payload: AiScoreDoc = stripUndefined({
    uid: userId,
    displayName: input.displayName,
    score: Math.max(0, Math.min(100, Math.round(input.score))),
    summary: input.summary,
    strengths: input.strengths ?? [],
    improvements: input.improvements ?? [],
    model: input.model,
    evaluatedAt: new Date().toISOString(),
  });
  await adminDb.collection(AI_SCORES).doc(userId).set(payload);
  return payload;
}

export async function getAiScoreForServer(userId: string): Promise<AiScoreDoc | null> {
  const snap = await adminDb.collection(AI_SCORES).doc(userId).get();
  if (!snap.exists) return null;
  return snap.data() as AiScoreDoc;
}

export async function getAiScoreLeaderboardForServer(limit = 20): Promise<AiScoreDoc[]> {
  const snap = await adminDb
    .collection(AI_SCORES)
    .orderBy("score", "desc")
    .limit(Math.min(Math.max(limit, 1), 100))
    .get();
  if (snap.empty) return [];
  // Keep deterministic order for equal scores without requiring a composite index.
  return snap.docs
    .map((d) => d.data() as AiScoreDoc)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.evaluatedAt ?? "").localeCompare(String(b.evaluatedAt ?? ""));
    });
}

export function compareAiScoreForLeaderboard(a: AiScoreDoc, b: AiScoreDoc): number {
  if (b.score !== a.score) return b.score - a.score;
  return String(a.evaluatedAt ?? "").localeCompare(String(b.evaluatedAt ?? ""));
}

// ----- Apply Now shortlist -----

export type ApplyNowStatus = "not_started" | "researching" | "drafting" | "submitted";

export interface ApplyNowItemDoc {
  collegeId: number;
  name: string;
  tier?: "reach" | "match" | "safety";
  matchScore?: number;
  status: ApplyNowStatus;
}

export interface ApplyNowDoc {
  runId: string;
  items: ApplyNowItemDoc[];
  updatedAt: string;
}

export async function getApplyNowForServer(userId: string, runId: string): Promise<ApplyNowDoc | null> {
  const snap = await adminDb
    .collection(USERS)
    .doc(userId)
    .collection(APPLY_NOW_SUBCOLLECTION)
    .doc(runId)
    .get();
  if (!snap.exists) return null;
  return snap.data() as ApplyNowDoc;
}

export async function saveApplyNowForServer(
  userId: string,
  runId: string,
  items: ApplyNowItemDoc[]
): Promise<ApplyNowDoc> {
  const payload: ApplyNowDoc = stripUndefined({
    runId,
    items,
    updatedAt: new Date().toISOString(),
  });
  await adminDb
    .collection(USERS)
    .doc(userId)
    .collection(APPLY_NOW_SUBCOLLECTION)
    .doc(runId)
    .set(payload);
  return payload;
}
