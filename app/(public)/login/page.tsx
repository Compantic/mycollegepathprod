"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmail, signInWithGoogle } from "@/lib/firebase/auth";
import { LogoIcon } from "@/components/landing/LogoIcon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FIREBASE_USER_NOT_FOUND = "auth/user-not-found";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function setSessionAndRedirect(token: string) {
    const sessionRes = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!sessionRes.ok) throw new Error("Session setup failed");
    const from = searchParams.get("from");
    const redirectTo = from && from.startsWith("/app") ? from : "/app/dashboard";
    router.push(redirectTo);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmail(email, password);
      const token = await cred.user.getIdToken();
      await setSessionAndRedirect(token);
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
      if (code === FIREBASE_USER_NOT_FOUND) {
        setError("no-account");
      } else {
        const message = err instanceof Error ? err.message : "Sign in failed. Please try again.";
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);
    try {
      const cred = await signInWithGoogle();
      const token = await cred.user.getIdToken();
      await setSessionAndRedirect(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  const busy = loading || googleLoading;

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center px-4 pt-12 pb-8">
      <Link
        href="/"
        className="flex flex-col items-center gap-1 mb-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
        aria-label="MyCollegePath home"
      >
        <div className="flex items-center gap-2">
          <LogoIcon className="h-8 w-8 shrink-0" />
          <span className="text-xl font-semibold text-[#1F4DB8]">MyCollegePath</span>
        </div>
        <span className="text-xs font-medium tracking-widest text-primary-500/90 uppercase">Student Portal</span>
      </Link>

      <div className="w-full max-w-[420px]">
        <div className="rounded-2xl border border-bg-border bg-white p-8 shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
          <h1 className="text-2xl font-bold text-text-primary">Student Sign In</h1>
          <p className="mt-2 text-sm text-text-muted leading-relaxed">
            Your journey to the perfect campus continues here. Let&apos;s make your college dreams a reality.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-text-primary">
                Email Address
              </label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="alex@example.com"
                className="mt-1.5 h-11 rounded-xl border-2 border-bg-border bg-bg-main focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                required
                disabled={busy}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-medium text-text-primary">
                  Password
                </label>
                <Link
                  href="#"
                  className="text-sm text-primary-500 hover:underline"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="********"
                className="mt-1.5 h-11 rounded-xl border-2 border-bg-border bg-bg-main focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                required
                minLength={6}
                disabled={busy}
              />
            </div>

            {error === "no-account" ? (
              <div className="rounded-xl bg-status-dangerBg px-3 py-2.5 text-sm text-status-dangerText" role="alert">
                No account found.{" "}
                <Link href="/onboarding/step-1" className="font-medium underline hover:no-underline">
                  Create one
                </Link>
              </div>
            ) : error ? (
              <p className="text-sm text-status-dangerText" role="alert">{error}</p>
            ) : null}

            <div className="flex items-center gap-2">
              <input
                id="login-keep"
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="h-4 w-4 rounded border-bg-border text-primary-500 focus:ring-primary-500"
                disabled={busy}
                aria-describedby="login-keep-desc"
              />
              <label id="login-keep-desc" htmlFor="login-keep" className="text-sm text-text-muted cursor-pointer">
                Keep me signed in
              </label>
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-xl font-semibold bg-primary-600 hover:bg-primary-700"
            >
              {loading ? "Signing in…" : "Sign In →"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            New to MyCollegePath?{" "}
            <Link href="/onboarding/step-1" className="font-medium text-primary-500 hover:underline">
              Create an account
            </Link>
          </p>

          <div className="relative my-6">
            <span className="absolute inset-0 flex items-center" aria-hidden="true">
              <span className="w-full border-t border-bg-border" />
            </span>
            <span className="relative flex justify-center text-xs text-text-muted bg-white px-2">Or continue with</span>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl"
            onClick={handleGoogleSignIn}
            disabled={busy}
          >
            {googleLoading ? "Signing in…" : "Google"}
          </Button>
        </div>
      </div>

      <footer className="mt-auto pt-10 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-text-muted uppercase tracking-wider">
        <Link href="/#support" className="hover:text-primary-500 hover:underline">Support</Link>
        <Link href="/#privacy" className="hover:text-primary-500 hover:underline">Privacy</Link>
        <Link href="/#terms" className="hover:text-primary-500 hover:underline">Terms</Link>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
