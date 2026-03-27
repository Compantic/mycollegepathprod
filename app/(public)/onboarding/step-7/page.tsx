"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getOnboardingDraft,
  persistOnboardingToFirestore,
  clearOnboardingDraft,
} from "@/lib/onboarding/storage";
import type { GradeLevel } from "@/lib/onboarding/schema";
import { signInWithGoogle, signUpWithEmail } from "@/lib/firebase/auth";
import { setStudentProfile } from "@/lib/firebase/firestore";
import { uploadProfilePhoto } from "@/lib/firebase/storage";
import { STEP_CONFIG } from "@/lib/onboarding/stepConfig";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { BuildingProfileLoading } from "@/components/onboarding/BuildingProfileLoading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";

function graduationYearFromGrade(grade: GradeLevel | undefined): number | undefined {
  if (!grade) return undefined;
  const y = new Date().getFullYear();
  if (grade === "9") return y + 4;
  if (grade === "10") return y + 3;
  if (grade === "11") return y + 2;
  if (grade === "12") return y + 1;
  return y + 1;
}

export default function OnboardingStep7Page() {
  const router = useRouter();
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const tokenForRedirectRef = useRef<string | null>(null);
  const [redirectReady, setRedirectReady] = useState(false);

  async function setSessionAndRedirect(token: string) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) throw new Error("Session setup failed");
    router.push("/app/dashboard");
    router.refresh();
  }

  async function persistAndFinish(uid: string) {
    const draft = getOnboardingDraft();
    await persistOnboardingToFirestore(uid, draft);
    const gradYear = graduationYearFromGrade(draft.gradeLevel);
    let profilePhotoUrl: string | undefined;
    if (draft.profilePhotoDataUrl) {
      try {
        profilePhotoUrl = await uploadProfilePhoto(uid, draft.profilePhotoDataUrl);
      } catch {
        // Continue without profile photo on upload failure
      }
    }
    await setStudentProfile(uid, {
      graduationYear: draft.expectedGraduationYear ?? gradYear ?? draft.graduationYear,
      gpa: draft.gpa,
      satScore: draft.satScore,
      actScore: draft.actScore,
      preferredSize: draft.preferredSize,
      preferredStates: draft.preferredStates?.length ? draft.preferredStates : undefined,
      profilePhotoUrl,
    });
    clearOnboardingDraft();
  }

  async function handleGoogleCreate() {
    setError("");
    setLoading("google");
    setRedirectReady(false);
    tokenForRedirectRef.current = null;
    try {
      const cred = await signInWithGoogle();
      await persistAndFinish(cred.user.uid);
      const token = await cred.user.getIdToken();
      tokenForRedirectRef.current = token;
      setRedirectReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(null);
    }
  }

  async function handleEmailCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password || password.length < 6) {
      setError("Enter a valid email and password (at least 6 characters).");
      return;
    }
    setLoading("email");
    setRedirectReady(false);
    tokenForRedirectRef.current = null;
    try {
      const cred = await signUpWithEmail(email.trim(), password);
      await persistAndFinish(cred.user.uid);
      const token = await cred.user.getIdToken();
      tokenForRedirectRef.current = token;
      setRedirectReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(null);
    }
  }

  function handleProfileLoadingComplete() {
    const token = tokenForRedirectRef.current;
    if (token) setSessionAndRedirect(token);
  }

  const busy = loading !== null;
  const config = STEP_CONFIG[7];

  if (loading) {
    return (
      <BuildingProfileLoading
        draft={getOnboardingDraft()}
        onComplete={handleProfileLoadingComplete}
        redirectReady={redirectReady}
      />
    );
  }

  return (
    <>
      <OnboardingStepCard
        title={config.title}
        subtitle={config.description}
        icon={<UserPlus className="h-5 w-5" />}
        showPrivacyFooter={false}
        formId="onboarding-step7-account-form"
        actions={
          <Button type="button" variant="outline" onClick={() => router.push("/onboarding/step-6")}>
            Back
          </Button>
        }
      >
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleCreate}
            disabled={busy}
          >
            {loading === "google" ? "Creating account…" : "Continue with Google"}
          </Button>
          <div className="relative">
            <span className="absolute inset-0 flex items-center" aria-hidden="true">
              <span className="w-full border-t border-bg-border" />
            </span>
            <span className="relative flex justify-center text-xs text-text-muted bg-bg-card px-2">
              Or with email
            </span>
          </div>
          <form id="onboarding-step7-account-form" onSubmit={handleEmailCreate} className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              required
              aria-label="Email"
            />
            <Input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              disabled={busy}
              required
              aria-label="Password"
            />
            <Button type="submit" className="w-full" disabled={busy}>
              {loading === "email" ? "Creating account…" : "Create account with email"}
            </Button>
          </form>
        </div>

        {error && (
          <p className="mt-4 text-sm text-status-dangerText" role="alert">
            {error}
          </p>
        )}
      </OnboardingStepCard>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary-500 hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
