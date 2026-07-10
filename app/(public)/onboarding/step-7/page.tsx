"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  getOnboardingDraft,
  persistOnboardingToFirestore,
  clearOnboardingDraft,
} from "@/lib/onboarding/storage";
import type { GradeLevel } from "@/lib/onboarding/schema";
import { signInWithGoogle, signUpWithEmail } from "@/lib/firebase/auth";
import { authErrorMessage } from "@/lib/firebase/authErrors";
import { setStudentProfile } from "@/lib/firebase/firestore";
import { uploadProfilePhoto } from "@/lib/firebase/storage";
import { STEP_CONFIG } from "@/lib/onboarding/stepConfig";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { BuildingProfileLoading } from "@/components/onboarding/BuildingProfileLoading";
import { Button } from "@/components/ui/button";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { PasswordRevealField } from "@/components/auth/PasswordRevealField";
import { Lock, Mail, Sparkles, UserPlus } from "lucide-react";

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
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const tokenForRedirectRef = useRef<string | null>(null);
  const [redirectReady, setRedirectReady] = useState(false);

  const spring = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 32 };

  async function setSessionAndRedirect(token: string) {
    const sessionRes = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      throw new Error(`Session setup failed: ${errText}`);
    }
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
    // Only clear after both Firestore writes succeed.
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
      setError(authErrorMessage(err));
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
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please enter the same password twice.");
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
      setError(authErrorMessage(err));
      setLoading(null);
    }
  }

  async function handleProfileLoadingComplete() {
    const token = tokenForRedirectRef.current;
    if (!token) return;
    try {
      await setSessionAndRedirect(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finish sign-in. Please try again.");
      setLoading(null);
      setRedirectReady(false);
    }
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
        <div className="space-y-8">
          <motion.div
            className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/90 to-white p-1 shadow-inner"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
          >
            <p className="flex items-center justify-center gap-2 px-3 py-2.5 text-center text-xs font-medium text-slate-600">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
              You&apos;re one step away — save your profile and open your dashboard.
            </p>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: reduceMotion ? 0 : 0.05 }}
          >
            <GoogleOAuthButton
              onClick={handleGoogleCreate}
              disabled={busy}
              pending={loading === "google"}
              pendingLabel="Creating account…"
            />
          </motion.div>

          <div className="relative py-1">
            <span className="absolute inset-0 flex items-center" aria-hidden="true">
              <span className="w-full border-t border-slate-200" />
            </span>
            <span className="relative flex justify-center">
              <span className="bg-gradient-to-b from-white to-transparent px-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Or email
              </span>
            </span>
          </div>

          <motion.form
            id="onboarding-step7-account-form"
            onSubmit={handleEmailCreate}
            className="space-y-5"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: reduceMotion ? 0 : 0.1 }}
          >
            <div className="space-y-1.5">
              <label htmlFor="signup-email" className="block text-sm font-semibold text-slate-800">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                  required
                  autoComplete="email"
                  className="onboarding-input w-full pl-10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            <PasswordRevealField
              id="signup-password"
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Create a strong password"
              autoComplete="new-password"
              disabled={busy}
              show={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              minLength={6}
              helperText="At least 6 characters. Use the eye icon to check what you typed."
            />

            <PasswordRevealField
              id="signup-password-confirm"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              disabled={busy}
              show={showConfirmPassword}
              onToggleShow={() => setShowConfirmPassword((v) => !v)}
              minLength={6}
              helperText="Must match your password above."
            />

            <Button
              type="submit"
              className="mt-2 h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-base font-bold shadow-lg shadow-primary-600/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
              disabled={busy}
            >
              <Lock className="h-4 w-4 opacity-90" aria-hidden />
              {loading === "email" ? "Creating account…" : "Create account with email"}
            </Button>
          </motion.form>

          {error && (
            <motion.div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {error}
            </motion.div>
          )}
        </div>
      </OnboardingStepCard>

      <motion.p
        className="mt-8 text-center text-sm text-slate-600"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.15 }}
      >
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-primary-700 underline-offset-2 hover:text-primary-600 hover:underline">
          Log in
        </Link>
      </motion.p>
    </>
  );
}
