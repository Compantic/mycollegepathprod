import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatCompletion } from "@/lib/ai/openai";
import { buildHeuristicEssayAnalysis } from "@/lib/ai/essayFallback";
import { getApiErrorStatus } from "@/lib/errors/api";
import { enforceUserRateLimit } from "@/lib/rateLimit/server";
import { logApiError } from "@/lib/logging/api";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import { BillingError, releaseFeatureUsage, reserveFeatureUsage } from "@/lib/billing/enforce";

const bodySchema = z.object({
  essay: z.string().min(50, "Essay should be at least 50 characters."),
});

function parseEssayJson(raw: string): unknown | null {
  try {
    const jsonStr = raw.replace(/^```json?\s*|\s*```$/g, "").trim();
    const start = jsonStr.indexOf("{");
    const end = jsonStr.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    return JSON.parse(jsonStr.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let uid: string | null = null;
  let reserved = false;

  try {
    const user = await getSessionUserFromRequest(req).catch(() => null);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    uid = user.uid;

    await reserveFeatureUsage(user.uid, "essayAnalyze");
    reserved = true;

    await enforceUserRateLimit({ userId: user.uid, bucket: "essay_analyze", windowMs: 60_000, maxRequests: 15 });

    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join("; ") || "Invalid essay";
      await releaseFeatureUsage(user.uid, "essayAnalyze");
      reserved = false;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const essay = parsed.data.essay.trim();

    const prompt = `You are a college admissions essay coach. Analyze the following essay and return a single JSON object only (no markdown, no code fence).

Required JSON shape:
{
  "toneSummary": string (2-3 sentences on how the essay's tone and voice come across),
  "criticalIssues": [{ "title": string, "description": string }] (blocking or major issues, 0-5 items),
  "suggestions": [{ "title": string, "description": string }] (focused revision ideas, 2-6 items),
  "strengths": [{ "title": string, "description": string }] (what works well, 2-5 items),
  "heatmap": { "impact": 1-5, "reflection": 1-5, "specificity": 1-5, "structure": 1-5, "voice": 1-5 },
  "overallScore": number 1-100 (single holistic score),
  "reportSummary": string (3-5 sentences: brief executive summary of the essay's strengths and main areas to improve),
  "criteria": [
    { "name": string, "score": number 1-5, "maxScore": 5, "description": string }
  ]
}

Include exactly these criteria in "criteria": Clarity, Structure, Voice, Impact, Specificity, Reflection, Hook & Conclusion. Use 1-5 for each score; maxScore is always 5. Be concise and actionable.

ESSAY:
"""${essay.slice(0, 15000)}"""`;

    try {
      const message = await chatCompletion([{ role: "user", content: prompt }], {
        temperature: 0.5,
        model: process.env.OPENAI_CHAT_MODEL,
      });

      const raw = message?.content?.trim() || "";
      const result = parseEssayJson(raw);
      if (result && typeof result === "object") {
        return NextResponse.json(result);
      }

      console.warn("[essays.analyze] invalid AI JSON — using heuristic fallback");
      return NextResponse.json(buildHeuristicEssayAnalysis(essay));
    } catch (aiErr) {
      logApiError("essays.analyze.ai", { userId: uid }, aiErr);
      // Usable fallback so paying users are not left with a blank error after a failed model call.
      return NextResponse.json(buildHeuristicEssayAnalysis(essay));
    }
  } catch (err) {
    if (reserved && uid) {
      await releaseFeatureUsage(uid, "essayAnalyze");
    }
    if (err instanceof BillingError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    const status = getApiErrorStatus(err);
    logApiError("essays.analyze", {}, err);
    if (status === 429) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Too many requests. Try again later." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to analyze essay" },
      { status: 500 }
    );
  }
}
