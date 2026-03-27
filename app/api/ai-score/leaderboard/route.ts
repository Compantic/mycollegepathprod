import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import { compareAiScoreForLeaderboard, getAiScoreLeaderboardForServer } from "@/lib/firebase/serverFirestore";
import { enforceUserRateLimit } from "@/lib/rateLimit/server";
import { getApiErrorStatus } from "@/lib/errors/api";
import { logApiError } from "@/lib/logging/api";

export async function GET(req: NextRequest) {
  let userId: string | null = null;
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    userId = user.uid;

    await enforceUserRateLimit({
      userId: user.uid,
      bucket: "ai-score-leaderboard",
      windowMs: 60_000,
      maxRequests: 20,
    });

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    if (!limitParam) {
      return NextResponse.json({ error: "limit is required" }, { status: 400 });
    }
    const limitRaw = Number(limitParam);
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 10, 1), 50);
    const cursorRaw = Number(searchParams.get("cursor") ?? 0);
    const cursor = Number.isFinite(cursorRaw) ? Math.max(0, cursorRaw) : 0;

    const all = await getAiScoreLeaderboardForServer(200);
    const sorted = all.sort(compareAiScoreForLeaderboard);
    const leaderboard = sorted.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < sorted.length ? cursor + limit : null;
    return NextResponse.json({ leaderboard, nextCursor });
  } catch (err) {
    logApiError("aiScore.leaderboard", { userId }, err);
    const status = getApiErrorStatus(err);
    if (status === 429) {
      return NextResponse.json(
        { error: "Leaderboard is being requested too frequently. Please try again in a moment." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load leaderboard" },
      { status: 500 }
    );
  }
}
