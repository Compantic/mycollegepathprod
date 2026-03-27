import { NextRequest, NextResponse } from "next/server";
import { getCachedCollege } from "@/lib/scorecard/cache";
import { getSchoolById } from "@/lib/scorecard/client";
import { getCollegeFromFirestoreCache, setCollegeFirestoreCache } from "@/lib/scorecard/firestoreCache";
import { scorecardCollegeQuerySchema } from "@/lib/validation/api";
import { getApiErrorStatus } from "@/lib/errors/api";
import { logApiError } from "@/lib/logging/api";

export async function GET(req: NextRequest) {
  const idParam = req.nextUrl.searchParams.get("id");
  const parsed = scorecardCollegeQuerySchema.safeParse({ id: idParam ?? undefined });
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join("; ") || "Invalid id";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { id } = parsed.data;
  try {
    // 1) Firestore cache (7-day TTL)
    const firestoreCached = await getCollegeFromFirestoreCache(id);
    if (firestoreCached) {
      return NextResponse.json(firestoreCached);
    }

    // 2) In-memory cache within this process
    const cached = getCachedCollege(id);
    if (cached) return NextResponse.json(cached);

    // 3) Fallback to Scorecard API
    const college = await getSchoolById(id);
    if (!college) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Persist snapshot for future requests
    await setCollegeFirestoreCache(college);

    return NextResponse.json(college);
  } catch (err) {
    logApiError("scorecard.college", { id }, err);
    const status = getApiErrorStatus(err);
    if (status === 429) {
      return NextResponse.json(
        { error: "College data provider is receiving too many requests. Please try again in a few minutes." },
        { status: 429 }
      );
    }
    if (status === 503) {
      return NextResponse.json(
        { error: "College data provider is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "College data temporarily unavailable. Please try again." },
      { status: 500 }
    );
  }
}
