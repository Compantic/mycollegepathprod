/**
 * Maps Firebase Auth errors to short user-facing messages (English).
 * See: https://firebase.google.com/docs/auth/admin/errors
 */
export type MappedAuthError = { kind: "no-account" } | { kind: "message"; text: string };

export function mapFirebaseAuthError(err: unknown): MappedAuthError {
  const code =
    err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";

  if (code === "auth/user-not-found") {
    return { kind: "no-account" };
  }

  const byCode: Record<string, string> = {
    "auth/wrong-password": "Incorrect email or password. Try again or reset your password.",
    "auth/invalid-credential": "Incorrect email or password. Check your details and try again.",
    "auth/invalid-login-credentials": "Incorrect email or password. Check your details and try again.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/user-disabled": "This account has been disabled. Contact support.",
    "auth/too-many-requests": "Too many attempts. Wait a bit and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/invalid-api-key":
      "Firebase is misconfigured. Check NEXT_PUBLIC_FIREBASE_* in .env.local.",
    "auth/popup-closed-by-user": "The Google sign-in window was closed. Try again.",
    "auth/cancelled-popup-request": "Google sign-in was cancelled. Try again.",
    "auth/account-exists-with-different-credential":
      "This email is registered with another sign-in method. Use email/password or the correct Google account.",
  };

  if (code && byCode[code]) {
    return { kind: "message", text: byCode[code] };
  }

  if (err instanceof Error && err.message) {
    return { kind: "message", text: err.message };
  }

  return { kind: "message", text: "Sign-in failed. Please try again." };
}
