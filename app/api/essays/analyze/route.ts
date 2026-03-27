import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatCompletion } from "@/lib/ai/openai";
import { getApiErrorStatus } from "@/lib/errors/api";
import { enforceUserRateLimit } from "@/lib/rateLimit/server";
import { logApiError } from "@/lib/logging/api";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";

const bodySchema = z.object({
  essay: z.string().min(50, "Essay should be at least 50 characters."),
});

const DEFAULT_RESULT = {
  toneSummary: "Reflective and personal.",
  criticalIssues: [] as { title: string; description: string }[],
  suggestions: [] as { title: string; description: string }[],
  strengths: [] as { title: string; description: string }[],
  heatmap: { impact: 3, reflection: 3, specificity: 3, structure: 3, voice: 3 },
  overallScore: 60,
  reportSummary: "Your essay shows solid potential. Focus on structure and specificity to strengthen your narrative.",
  criteria: [
    { name: "Clarity", score: 3, maxScore: 5, description: "Ideas are generally clear." },
    { name: "Structure", score: 3, maxScore: 5, description: "Logical flow could be tightened." },
    { name: "Voice", score: 3, maxScore: 5, description: "Personal voice is present." },
    { name: "Impact", score: 3, maxScore: 5, description: "Opening and conclusion can be stronger." },
    { name: "Specificity", score: 3, maxScore: 5, description: "Add concrete examples where possible." },
  ] as { name: string; score: number; maxScore: number; description: string }[],
};

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req).catch(() => null);
    if (user) {
      await enforceUserRateLimit({ userId: user.uid, bucket: "essay_analyze", windowMs: 60_000, maxRequests: 15 });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join("; ") || "Invalid essay";
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

    const message = await chatCompletion([{ role: "user", content: prompt }], {
      temperature: 0.5,
    });

    const raw = message?.content?.trim() || "";
    let result: unknown;
    try {
      const jsonStr = raw.replace(/^```json?\s*|\s*```$/g, "").trim();
      result = JSON.parse(jsonStr);
      if (result && typeof result === "object" && !("overallScore" in result)) {
        (result as Record<string, unknown>).overallScore = DEFAULT_RESULT.overallScore;
      }
      if (result && typeof result === "object" && !("reportSummary" in result)) {
        (result as Record<string, unknown>).reportSummary = DEFAULT_RESULT.reportSummary;
      }
      if (result && typeof result === "object" && !("criteria" in result)) {
        (result as Record<string, unknown>).criteria = DEFAULT_RESULT.criteria;
      }
    } catch {
      result = DEFAULT_RESULT;
    }

    return NextResponse.json(result);
  } catch (err) {
    const status = getApiErrorStatus(err);
    logApiError("essays.analyze", {}, err);
    if (status === 429) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Too many requests. Try again later." },
        { status: 429 }
      );
    }
    if (status === 503) {
      return NextResponse.json(
        { error: "Essay analysis is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to analyze essay" },
      { status: 500 }
    );
  }
}

