/**
 * Simple per-user rate limiting for API routes.
 * Uses Firestore via admin SDK; windowed counter reset per `windowMs`.
 */

import { adminDb } from "@/lib/firebase/admin";
import { RateLimitError } from "@/lib/errors/api";

interface RateLimitDoc {
  count: number;
  windowStart: number;
}

export async function enforceUserRateLimit(options: {
  userId: string;
  bucket: string;
  windowMs: number;
  maxRequests: number;
}): Promise<void> {
  const { userId, bucket, windowMs, maxRequests } = options;
  const key = `${bucket}:${userId}`;
  const now = Date.now();
  const cutoff = now - windowMs;
  const ref = adminDb.collection("rateLimits").doc(key);

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    let data: RateLimitDoc = snap.exists
      ? (snap.data() as RateLimitDoc)
      : { count: 0, windowStart: now };

    if (data.windowStart < cutoff) {
      data = { count: 0, windowStart: now };
    }

    data.count += 1;

    tx.set(ref, data);

    if (data.count > maxRequests) {
      throw new RateLimitError(
        "Too many requests. Please slow down.",
        429
      );
    }
  });
}

