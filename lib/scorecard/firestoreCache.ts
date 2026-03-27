import { adminDb } from "@/lib/firebase/admin";
import type { ScorecardCollege } from "./types";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getCollegeFromFirestoreCache(id: number): Promise<ScorecardCollege | null> {
  const ref = adminDb.collection("colleges").doc(String(id));
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as { snapshot?: ScorecardCollege; updatedAt?: string };
  if (!data.snapshot || !data.updatedAt) return null;
  const updatedAtMs = Date.parse(data.updatedAt);
  if (Number.isNaN(updatedAtMs)) return null;
  if (Date.now() - updatedAtMs > TTL_MS) return null;
  return data.snapshot;
}

export async function setCollegeFirestoreCache(college: ScorecardCollege): Promise<void> {
  const ref = adminDb.collection("colleges").doc(String(college.id));
  await ref.set(
    {
      snapshot: college,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

