/**
 * Maps Firebase Auth errors to short user-facing messages (English).
 * See: https://firebase.google.com/docs/auth/admin/errors
 */
export type MappedAuthError = { kind: "no-account" } | { kind: "message"; text: string };

function extractFirebaseAuthCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const c = (err as { code?: unknown }).code;
    if (typeof c === "string" && c.startsWith("auth/")) return c;
  }
  if (err instanceof Error && err.message) {
    const match = err.message.match(/\((auth\/[^)]+)\)/);
    if (match) return match[1];
  }
  return "";
}

function looksLikeFirebaseAuthMessage(message: string): boolean {
  return message.includes("Firebase:") || message.includes("(auth/");
}

const GENERIC_AUTH = "Something went wrong. Please try again.";

const BY_CODE: Record<string, string> = {
  "auth/email-already-in-use":
    "This email is already registered. Sign in or use a different email address.",
  "auth/credential-already-in-use": "This sign-in method is already linked to another account.",
  "auth/wrong-password": "Incorrect email or password. Try again or reset your password.",
  "auth/invalid-credential": "Incorrect email or password. Check your details and try again.",
  "auth/invalid-login-credentials": "Incorrect email or password. Check your details and try again.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/missing-email": "Enter your email address.",
  "auth/missing-password": "Enter your password.",
  "auth/weak-password": "Choose a stronger password (try a longer mix of letters and numbers).",
  "auth/user-disabled": "This account has been disabled. Contact support.",
  "auth/too-many-requests": "Too many attempts. Wait a bit and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/invalid-api-key":
    "Sign-in is temporarily unavailable. If this continues, contact support.",
  "auth/popup-closed-by-user": "The Google sign-in window was closed. Try again.",
  "auth/cancelled-popup-request": "Google sign-in was cancelled. Try again.",
  "auth/account-exists-with-different-credential":
    "This email is registered with another sign-in method. Use email/password or the correct Google account.",
  "auth/operation-not-allowed": "This sign-in method is not enabled. Contact support.",
  "auth/internal-error": GENERIC_AUTH,
  "auth/requires-recent-login": "Please sign in again to continue.",
};

export function mapFirebaseAuthError(err: unknown): MappedAuthError {
  const code = extractFirebaseAuthCode(err);

  if (code === "auth/user-not-found") {
    return { kind: "no-account" };
  }

  if (code && BY_CODE[code]) {
    return { kind: "message", text: BY_CODE[code] };
  }

  if (code.startsWith("auth/")) {
    return { kind: "message", text: GENERIC_AUTH };
  }

  if (err instanceof Error && err.message) {
    if (looksLikeFirebaseAuthMessage(err.message)) {
      return { kind: "message", text: GENERIC_AUTH };
    }
    return { kind: "message", text: err.message };
  }

  return { kind: "message", text: GENERIC_AUTH };
}

/** Single string for alerts; maps `no-account` to a clear sentence. */
export function authErrorMessage(err: unknown): string {
  const mapped = mapFirebaseAuthError(err);
  if (mapped.kind === "no-account") {
    return "No account found for this email. Try signing up or check your email.";
  }
  return mapped.text;
}
