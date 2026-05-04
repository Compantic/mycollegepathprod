"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmail, signInWithGoogle, sendResetPasswordEmail } from "@/lib/firebase/auth";
import { mapFirebaseAuthError } from "@/lib/firebase/authErrors";
import { isFirebaseClientConfigured } from "@/lib/firebase/client";
import { LogoWordmark } from "@/components/landing/LogoWordmark";
import { Button } from "@/components/ui/button";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { PasswordRevealField } from "@/components/auth/PasswordRevealField";
import { Mail } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetNotice, setResetNotice] = useState("");

  async function setSessionAndRedirect(token: string, keep = false) {
    const sessionRes = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, keepSignedIn: keep }),
    });
    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      throw new Error(`Session setup failed: ${errText}`);
    }
    const from = searchParams.get("from");
    const redirectTo = from && from.startsWith("/app") ? from : "/app/dashboard";
    router.push(redirectTo);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResetNotice("");
    setLoading(true);
    try {
      const cred = await signInWithEmail(email, password);
      const token = await cred.user.getIdToken();
      await setSessionAndRedirect(token, keepSignedIn);
    } catch (err: unknown) {
      const mapped = mapFirebaseAuthError(err);
      if (mapped.kind === "no-account") {
        setError("no-account");
      } else {
        setError(mapped.text);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setResetNotice("");
    setGoogleLoading(true);
    try {
      const cred = await signInWithGoogle();
      const token = await cred.user.getIdToken();
      await setSessionAndRedirect(token, keepSignedIn);
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      setError(mapped.kind === "no-account" ? "No account for this email. Create one first." : mapped.text);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleForgotPassword(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    setResetNotice("");
    setError("");
    if (!email.trim()) {
      setError("Enter your email first, then click Forgot password.");
      return;
    }
    setResetLoading(true);
    try {
      await sendResetPasswordEmail(email.trim());
      setResetNotice("Password reset email sent. Check your inbox.");
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      setError(
        mapped.kind === "no-account"
          ? "No account found for this email. Try signing up first."
          : mapped.text,
      );
    } finally {
      setResetLoading(false);
    }
  }

  const busy = loading || googleLoading;

  return (
    <div className="relative flex min-h-screen flex-col bg-[#f7f9fb]">
      <header className="mx-auto w-full max-w-md px-4 pb-4 pt-10 sm:pt-12">
        <Link
          href="/"
          className="group flex flex-col items-center rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/25"
          aria-label="MyCollegePath home"
        >
          <LogoWordmark className="h-16 w-auto transition-transform duration-300 group-hover:scale-[1.02] sm:h-20" />
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-4 py-6 sm:py-10">
        <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-b from-white/98 to-slate-50/95 shadow-[0_25px_50px_-12px_rgba(15,27,45,0.14),0_0_0_1px_rgba(255,255,255,0.85)_inset]">
          <div className="h-1 bg-gradient-to-r from-[#0f1b2d] via-primary-600 to-amber-400" aria-hidden />
          <div className="p-6 sm:p-9">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">Student sign in</h1>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Pick up where you left off - your roadmap, matches, and guidance are waiting.
              </p>
            </div>

            {!isFirebaseClientConfigured() ? (
              <div
                className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
                role="status"
              >
                Missing Firebase client key (
                <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_FIREBASE_API_KEY</code>). Add a{" "}
                <code className="rounded bg-amber-100 px-1">.env.local</code> file in the project root with your Web app
                config from the Firebase Console; sign-in will not work without it.
              </div>
            ) : null}

            <GoogleOAuthButton
              onClick={handleGoogleSignIn}
              disabled={busy}
              pending={googleLoading}
              pendingLabel="Signing in…"
            >
              Continue with Google
            </GoogleOAuthButton>

            <div className="relative py-5">
              <span className="absolute inset-0 flex items-center" aria-hidden="true">
                <span className="w-full border-t border-slate-200" />
              </span>
              <span className="relative flex justify-center">
                <span className="bg-gradient-to-b from-white via-white to-transparent px-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Or email
                </span>
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-sm font-semibold text-slate-800">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="alex@example.com"
                    className="onboarding-input w-full pl-10 disabled:cursor-not-allowed disabled:opacity-60"
                    required
                    disabled={busy}
                  />
                </div>
              </div>

              <PasswordRevealField
                id="login-password"
                label="Password"
                value={password}
                onChange={(v) => {
                  setPassword(v);
                  setError("");
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={busy}
                show={showPassword}
                onToggleShow={() => setShowPassword((v) => !v)}
                minLength={6}
                labelEnd={
                  <Link
                    href="#"
                    className="text-xs font-semibold text-primary-700 hover:text-primary-600 hover:underline"
                    onClick={handleForgotPassword}
                  >
                    {resetLoading ? "Sending…" : "Forgot password?"}
                  </Link>
                }
              />

              {error === "no-account" ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-900" role="alert">
                  No account found.{" "}
                  <Link href="/onboarding/step-1" className="font-semibold text-primary-700 underline hover:no-underline">
                    Create one
                  </Link>
                </div>
              ) : error ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-900" role="alert">
                  {error}
                </p>
              ) : null}

              {resetNotice ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900" role="status">
                  {resetNotice}
                </p>
              ) : null}

              <div className="flex items-center gap-2.5 pt-0.5">
                <input
                  id="login-keep"
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500/30"
                  disabled={busy}
                  aria-describedby="login-keep-desc"
                />
                <label id="login-keep-desc" htmlFor="login-keep" className="cursor-pointer text-sm text-slate-600">
                  Keep me signed in
                </label>
              </div>

              <Button
                type="submit"
                disabled={busy}
                className="h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-base font-bold shadow-lg shadow-primary-600/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? "Signing in…" : (
                  <>
                    Sign in <span aria-hidden>→</span>
                  </>
                )}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
              New to MyCollegePath?{" "}
              <Link
                href="/onboarding/step-1"
                className="font-semibold text-primary-700 underline-offset-2 hover:text-primary-600 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 mt-auto flex flex-wrap justify-center gap-x-6 gap-y-2 px-4 pb-8 pt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Link href="/#support" className="transition-colors hover:text-primary-700 hover:underline">
          Support
        </Link>
        <Link href="/privacy" className="transition-colors hover:text-primary-700 hover:underline">
          Privacy
        </Link>
        <Link href="/terms" className="transition-colors hover:text-primary-700 hover:underline">
          Terms
        </Link>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f7f9fb] text-sm font-medium text-slate-500">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
