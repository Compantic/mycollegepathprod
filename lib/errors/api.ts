/**
 * Shared error types for API error handling.
 * Use in route handlers to return correct status and user-facing messages.
 */
export class RateLimitError extends Error {
  constructor(
    message: string = "Too many requests. Please try again in a few minutes.",
    public readonly statusCode: number = 429
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class ServiceUnavailableError extends Error {
  constructor(
    message: string = "Service temporarily unavailable. Please try again later.",
    public readonly statusCode: number = 503
  ) {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

/** Check if an unknown error is a known API error with statusCode. */
export function getApiErrorStatus(err: unknown): number | null {
  if (err instanceof RateLimitError) return err.statusCode;
  if (err instanceof ServiceUnavailableError) return err.statusCode;
  return null;
}
