import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import { getOnboardingAnswersForServer, saveRoadmapForServer } from "@/lib/firebase/serverFirestore";
import { generateRoadmap } from "@/lib/domain/roadmap";
import { getApiErrorStatus } from "@/lib/errors/api";
import { enforceUserRateLimit } from "@/lib/rateLimit/server";
import { logApiError } from "@/lib/logging/api";
import { BillingError, enforceAndIncrementUsage } from "@/lib/billing/enforce";

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.uid;

    await enforceAndIncrementUsage(user.uid, "roadmapGenerate");

    await enforceUserRateLimit({
      userId: user.uid,
      bucket: "roadmap",
      windowMs: 60_000,
      maxRequests: 10,
    });

    const answers = await getOnboardingAnswersForServer(user.uid);
    const roadmap = await generateRoadmap(answers);

    const roadmapId = `roadmap-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await saveRoadmapForServer(user.uid, roadmapId, roadmap);

    return NextResponse.json({ roadmapId, roadmap });
  } catch (err) {
    if (err instanceof BillingError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    logApiError("roadmap.generate", { userId }, err);
    const status = getApiErrorStatus(err);
    if (status === 429) {
      return NextResponse.json(
        { error: "Too many roadmap requests. Please wait a bit and try again." },
        { status: 429 }
      );
    }
    if (status === 503) {
      return NextResponse.json(
        { error: "Roadmap service is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Roadmap generation failed. Please try again later." },
      { status: 500 }
    );
  }
}
