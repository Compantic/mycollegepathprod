import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import { getRoadmapsForServer } from "@/lib/firebase/serverFirestore";
import { getApiErrorStatus } from "@/lib/errors/api";
import { enforceUserRateLimit } from "@/lib/rateLimit/server";
import { logApiError } from "@/lib/logging/api";

export async function GET(req: NextRequest) {
  let userId: string | null = null;
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.uid;

    await enforceUserRateLimit({
      userId: user.uid,
      bucket: "roadmap-history",
      windowMs: 60_000,
      maxRequests: 12,
    });

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    if (!limitParam) {
      return NextResponse.json({ error: "limit is required" }, { status: 400 });
    }
    const limit = Math.min(Math.max(Number(limitParam) || 0, 1), 25);
    const cursor = searchParams.get("cursor");

    const { runs, nextCursor } = await getRoadmapsForServer(user.uid, limit, cursor);

    return NextResponse.json({ runs, nextCursor });
  } catch (err) {
    logApiError("roadmap.history", { userId }, err);
    const status = getApiErrorStatus(err);
    if (status === 429) {
      return NextResponse.json(
        { error: "You are requesting roadmap history too frequently. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load roadmap history" },
      { status: 500 }
    );
  }
}

