import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import {
  getStudentProfileForServer,
  getOnboardingAnswersForServer,
  saveMatchingRun,
} from "@/lib/firebase/serverFirestore";
import { runMatching } from "@/lib/domain/matching";
import type { StudentCriteria } from "@/lib/matching/types";
import { getApiErrorStatus } from "@/lib/errors/api";
import { enforceUserRateLimit } from "@/lib/rateLimit/server";
import { logApiError } from "@/lib/logging/api";
import { BillingError, releaseFeatureUsage, reserveFeatureUsage } from "@/lib/billing/enforce";

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  let reserved = false;

  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.uid;

    await reserveFeatureUsage(user.uid, "matchingRun");
    reserved = true;

    await enforceUserRateLimit({
      userId: user.uid,
      bucket: "matching",
      windowMs: 60_000,
      maxRequests: 8,
    });

    const profile = await getStudentProfileForServer(user.uid);
    const onboarding = await getOnboardingAnswersForServer(user.uid);
    const criteria: StudentCriteria = {
      gpa: profile?.gpa,
      satScore: profile?.satScore,
      actScore: profile?.actScore,
      preferredMajors: profile?.preferredMajors,
      preferredStates: profile?.preferredStates,
      preferredSize: profile?.preferredSize,
    };

    const matches = await runMatching(criteria, onboarding);

    if (!Array.isArray(matches) || matches.length === 0) {
      await releaseFeatureUsage(user.uid, "matchingRun");
      reserved = false;
      return NextResponse.json(
        {
          error:
            "No college matches could be generated right now. Please try again in a moment — your usage was not charged.",
          code: "no_matches",
        },
        { status: 422 }
      );
    }

    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await saveMatchingRun(user.uid, runId, matches);

    return NextResponse.json({ runId, matches });
  } catch (err) {
    if (reserved && userId) {
      await releaseFeatureUsage(userId, "matchingRun");
    }
    if (err instanceof BillingError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    logApiError("matching.run", { userId }, err);
    const status = getApiErrorStatus(err);
    if (status === 429) {
      return NextResponse.json(
        { error: "You are running matching too frequently. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Matching failed" },
      { status: 500 }
    );
  }
}
