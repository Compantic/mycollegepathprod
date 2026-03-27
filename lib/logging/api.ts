/**
 * Lightweight structured logging helpers for API routes.
 * These wrap console.error so logs are still visible on platforms like Vercel / Netlify,
 * but include consistent metadata.
 */

export function logApiError(
  service: string,
  context: Record<string, unknown> | undefined,
  err: unknown
): void {
  const base: Record<string, unknown> = {
    service,
    level: "error",
  };
  const errorPayload =
    err instanceof Error
      ? {
          name: err.name,
          message: err.message,
          stack: err.stack,
        }
      : err;
  console.error("[api-error]", {
    ...base,
    context,
    error: errorPayload,
  });
}

