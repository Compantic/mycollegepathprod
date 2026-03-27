/**
 * Server-only: check if user has completed onboarding (users/{uid}.onboardingCompleted).
 * Use the Firebase Admin SDK instance directly instead of modular `doc/getDoc`,
 * which avoids bundler interop issues in Next.js.
 */
import { adminDb } from "./admin";

export async function isOnboardingCompleted(uid: string): Promise<boolean> {
  const userRef = adminDb.collection("users").doc(uid);
  const snap = await userRef.get();
  if (!snap.exists) return false;
  return Boolean(snap.data()?.onboardingCompleted);
}
