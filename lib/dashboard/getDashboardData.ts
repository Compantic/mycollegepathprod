/**
 * Server-only: get user, profile, saved colleges for dashboard.
 * All data is real from Firestore (no mock).
 */
import { adminDb } from "@/lib/firebase/admin";
import type { OnboardingSnapshot } from "@/lib/onboarding/types";

export interface SavedCollegeItem {
  collegeId: string;
  name: string;
  savedAt: string;
}

export interface StudentProfileSnapshot {
  gpa?: number;
  satScore?: number;
  actScore?: number;
  preferredStates?: string[];
  preferredSize?: string;
  profilePhotoUrl?: string;
}

export interface DashboardUserData {
  uid: string;
  email: string | null;
  firstName: string;
  displayName?: string;
  onboardingAnswers?: OnboardingSnapshot;
  savedColleges: SavedCollegeItem[];
  profile: StudentProfileSnapshot | null;
}

export async function getDashboardUserData(
  uid: string,
  sessionEmail?: string | null
): Promise<DashboardUserData | null> {
  const userRef = adminDb.collection("users").doc(uid);
  const profileRef = adminDb.collection("studentProfiles").doc(uid);
  const savedCollegesSnap = await adminDb
    .collection("savedColleges")
    .where("userId", "==", uid)
    .get();

  const [userSnap, profileSnap] = await Promise.all([userRef.get(), profileRef.get()]);

  const userData = userSnap.exists ? userSnap.data() : null;
  const profileData = profileSnap.exists ? profileSnap.data() : null;
  const displayName = (profileData?.displayName as string) ?? (userData?.displayName as string);
  const email = (userData?.email as string) ?? sessionEmail ?? null;
  const onboardingAnswers = userData?.onboardingAnswers as OnboardingSnapshot | undefined;
  const firstName = displayName
    ? displayName.trim().split(/\s+/)[0] || "there"
    : (email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "there" : "there");

  const savedColleges: SavedCollegeItem[] = savedCollegesSnap.docs
    .map((d) => {
      const data = d.data();
      return { collegeId: String(data.collegeId ?? ""), name: String(data.name ?? ""), savedAt: String(data.savedAt ?? "") };
    })
    .sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));

  const profile: StudentProfileSnapshot | null = profileData
    ? {
        gpa: profileData.gpa as number | undefined,
        satScore: profileData.satScore as number | undefined,
        actScore: profileData.actScore as number | undefined,
        preferredStates: profileData.preferredStates as string[] | undefined,
        preferredSize: profileData.preferredSize as string | undefined,
        profilePhotoUrl: profileData.profilePhotoUrl as string | undefined,
      }
    : null;

  return {
    uid,
    email,
    firstName,
    displayName,
    onboardingAnswers,
    savedColleges,
    profile,
  };
}

/** Real readiness % from profile + saved colleges (no mock). */
export function computeApplicationReadiness(data: DashboardUserData | null): number {
  if (!data) return 0;
  let score = 0;
  if (data.profile?.gpa != null) score += 15;
  if (data.profile?.satScore != null || data.profile?.actScore != null) score += 15;
  if (data.profile?.preferredStates?.length) score += 10;
  if (data.profile?.profilePhotoUrl) score += 10;
  if (data.onboardingAnswers && Object.keys(data.onboardingAnswers).length > 5) score += 20;
  const collegeScore = Math.min(30, (data.savedColleges?.length ?? 0) * 6);
  score += collegeScore;
  return Math.min(100, score);
}

/** Application health: essays (no data = 0), college list from saved count, documents from profile. */
export function computeHealthMetrics(data: DashboardUserData | null): { essays: number; collegeList: number; documents: number } {
  if (!data) return { essays: 0, collegeList: 0, documents: 0 };
  const collegeList = Math.min(100, (data.savedColleges?.length ?? 0) * 10);
  const documents = (data.profile?.profilePhotoUrl ? 25 : 0) + (data.profile?.gpa != null ? 25 : 0);
  return { essays: 0, collegeList, documents };
}
