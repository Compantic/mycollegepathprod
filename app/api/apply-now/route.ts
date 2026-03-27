import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import {
  getApplyNowForServer,
  saveApplyNowForServer,
  type ApplyNowItemDoc,
} from "@/lib/firebase/serverFirestore";
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
      bucket: "apply-now-get",
      windowMs: 60_000,
      maxRequests: 30,
    });

    const runId = (new URL(req.url).searchParams.get("runId") ?? "").trim();
    if (!runId) return NextResponse.json({ error: "runId is required" }, { status: 400 });

    const doc = await getApplyNowForServer(user.uid, runId);
    return NextResponse.json({ shortlist: doc });
  } catch (err) {
    logApiError("applyNow.get", { userId }, err);
    const status = getApiErrorStatus(err);
    if (status === 429) {
      return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load shortlist" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  let userId: string | null = null;
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    userId = user.uid;

    await enforceUserRateLimit({
      userId: user.uid,
      bucket: "apply-now-put",
      windowMs: 60_000,
      maxRequests: 40,
    });

    const body = (await req.json()) as { runId?: string; items?: ApplyNowItemDoc[] };
    const runId = (body.runId ?? "").trim();
    if (!runId) return NextResponse.json({ error: "runId is required" }, { status: 400 });
    const items = Array.isArray(body.items) ? body.items : [];

    const sanitized: ApplyNowItemDoc[] = items
      .filter((x) => x && typeof x.collegeId === "number" && typeof x.name === "string")
      .slice(0, 12)
      .map((x) => ({
        collegeId: Number(x.collegeId),
        name: String(x.name).trim(),
        tier: x.tier,
        matchScore: typeof x.matchScore === "number" ? x.matchScore : undefined,
        status: x.status ?? "not_started",
      }));

    const saved = await saveApplyNowForServer(user.uid, runId, sanitized);
    return NextResponse.json({ shortlist: saved });
  } catch (err) {
    logApiError("applyNow.put", { userId }, err);
    const status = getApiErrorStatus(err);
    if (status === 429) {
      return NextResponse.json({ error: "Too many updates. Please slow down." }, { status: 429 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to save shortlist" }, { status: 500 });
  }
}
