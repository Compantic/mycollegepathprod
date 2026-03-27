import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import { updateRoadmapCompletionForServer } from "@/lib/firebase/serverFirestore";
import { enforceUserRateLimit } from "@/lib/rateLimit/server";
import { getApiErrorStatus } from "@/lib/errors/api";
import { logApiError } from "@/lib/logging/api";

export async function PATCH(req: NextRequest) {
  let userId: string | null = null;
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.uid;

    await enforceUserRateLimit({
      userId: user.uid,
      bucket: "roadmap-tasks",
      windowMs: 60_000,
      maxRequests: 60,
    });

    const body = (await req.json()) as {
      roadmapId?: string;
      completedItemIds?: string[];
    };

    const roadmapId = (body.roadmapId ?? "").trim();
    const completedItemIds = Array.isArray(body.completedItemIds)
      ? body.completedItemIds.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      : [];

    if (!roadmapId) {
      return NextResponse.json({ error: "roadmapId is required" }, { status: 400 });
    }

    await updateRoadmapCompletionForServer(user.uid, roadmapId, completedItemIds);
    return NextResponse.json({ ok: true });
  } catch (err) {
    logApiError("roadmap.tasks", { userId }, err);
    const status = getApiErrorStatus(err);
    if (status === 429) {
      return NextResponse.json(
        { error: "Too many checklist updates. Please slow down and try again." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update roadmap tasks" },
      { status: 500 }
    );
  }
}
