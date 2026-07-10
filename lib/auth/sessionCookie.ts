/** Shared session cookie settings for auth API, middleware, and server auth. */

export const SESSION_COOKIE_NAME = "__session";

/** Firebase session cookies allow 5 minutes … 14 days. */
export const SESSION_MAX_AGE_SECONDS = {
  /** Default signed-in window (active use without "Keep signed in"). */
  default: 60 * 60 * 24 * 5,
  /** "Keep signed in" — Firebase Admin maximum. */
  keepSignedIn: 60 * 60 * 24 * 14,
} as const;

export function sessionExpiresInMs(keepSignedIn?: boolean): number {
  const seconds = keepSignedIn
    ? SESSION_MAX_AGE_SECONDS.keepSignedIn
    : SESSION_MAX_AGE_SECONDS.default;
  return seconds * 1000;
}

export function sessionMaxAgeSeconds(keepSignedIn?: boolean): number {
  return keepSignedIn
    ? SESSION_MAX_AGE_SECONDS.keepSignedIn
    : SESSION_MAX_AGE_SECONDS.default;
}
