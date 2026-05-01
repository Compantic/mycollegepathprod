import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import { enforceUserRateLimit } from "@/lib/rateLimit/server";
import { getApiErrorStatus, ServiceUnavailableError } from "@/lib/errors/api";
import { logApiError } from "@/lib/logging/api";
import { getDashboardUserData } from "@/lib/dashboard/getDashboardData";
import { chatCompletion } from "@/lib/ai/openai";
import { saveAiScoreForServer } from "@/lib/firebase/serverFirestore";

type AiScoreModelOutput = {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
};

function fallbackScore(profile: Awaited<ReturnType<typeof getDashboardUserData>>): AiScoreModelOutput {
  if (!profile) {
    return {
      score: 20,
      summary:
        "Your score looks low because your profile is incomplete. It will get more accurate as you add details.",
      strengths: [],
      improvements: ["Complete your profile", "Add GPA and test scores", "Save at least 5 colleges"],
    };
  }
  let score = 30;
  if (profile.profile?.gpa != null) score += 20;
  if (profile.profile?.satScore != null || profile.profile?.actScore != null) score += 20;
  if ((profile.savedColleges?.length ?? 0) >= 5) score += 15;
  if ((profile.onboardingAnswers ? Object.keys(profile.onboardingAnswers).length : 0) >= 15) score += 15;
  return {
    score: Math.min(100, score),
    summary: "Estimated score generated because the AI service could not respond.",
    strengths: [],
    improvements: [
      "Add detail to academics and activities",
      "Balance your college list",
      "Complete roadmap tasks",
    ],
  };
}

function extractJson(text: string): AiScoreModelOutput | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as Partial<AiScoreModelOutput>;
    if (typeof parsed.score !== "number" || typeof parsed.summary !== "string") return null;
    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      summary: parsed.summary.trim(),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((x): x is string => typeof x === "string").slice(0, 4) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.filter((x): x is string => typeof x === "string").slice(0, 4) : [],
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.uid;

    await enforceUserRateLimit({
      userId: user.uid,
      bucket: "ai-score-calculate",
      windowMs: 60_000,
      maxRequests: 6,
    });

    const profile = await getDashboardUserData(user.uid, null);
    const fullName =
      profile?.displayName?.trim() ||
      [profile?.onboardingAnswers?.firstName, profile?.onboardingAnswers?.lastName].filter(Boolean).join(" ").trim() ||
      profile?.firstName ||
      "Student";

    // Force numeric conversion and pick highest/latest
    const currentGpa = Number(profile?.onboardingAnswers?.gpa ?? profile?.profile?.gpa ?? 0) || 0;
    const currentSat = Number(profile?.onboardingAnswers?.satTotal ?? profile?.onboardingAnswers?.satScore ?? profile?.profile?.satScore ?? 0) || 0;
    const currentAct = Number(profile?.onboardingAnswers?.actComposite ?? profile?.onboardingAnswers?.actScore ?? profile?.profile?.actScore ?? 0) || 0;

    const compactProfile = {
      gpa: currentGpa,
      sat: currentSat,
      act: currentAct,
      preferredStates: (profile?.profile?.preferredStates?.length ? profile.profile.preferredStates : profile?.onboardingAnswers?.locationPreferenceStates) ?? [],
      preferredSize: profile?.profile?.preferredSize ?? profile?.onboardingAnswers?.preferredSize ?? null,
      savedCollegesCount: profile?.savedColleges?.length ?? 0,
      onboardingFieldCount: profile?.onboardingAnswers ? Object.keys(profile.onboardingAnswers).length : 0,
      targetDegree: profile?.onboardingAnswers?.targetDegree ?? null,
      careerPath: profile?.onboardingAnswers?.careerPath ?? null,
      activityCount: profile?.onboardingAnswers?.activityTypes?.length ?? 0,
      awardsCount:
        (profile?.onboardingAnswers?.awardsSchool?.length ?? 0) +
        (profile?.onboardingAnswers?.awardsState?.length ?? 0) +
        (profile?.onboardingAnswers?.awardsNational?.length ?? 0) +
        (profile?.onboardingAnswers?.awardsInternational?.length ?? 0),
    };

    let result: AiScoreModelOutput;
    if (!process.env.OPENAI_API_KEY) {
      result = fallbackScore(profile);
    } else {
      const prompt = [
        "You are an expert college admissions evaluator.",
        `IMPORTANT: The student's current academic metrics are: GPA: ${currentGpa}, SAT: ${currentSat}, ACT: ${currentAct}.`,
        "You MUST base your score and summary primarily on THESE values above, as they are the most recent.",
        "Compute an overall readiness score from 0 to 100.",
        "Weighting: academics 40%, testing 20%, activities/awards 20%, clarity/fit/preferences 20%.",
        "Be realistic. A student with 3.9 GPA and 1500 SAT is very strong academically.",
        "Return strict JSON only: { \"score\": number, \"summary\": string, \"strengths\": string[], \"improvements\": string[] }.",
        "Keep summary under 220 chars. Max 4 strengths and 4 improvements.",
        `Student: ${fullName}`,
        `Full Detail: ${JSON.stringify(compactProfile)}`,
      ].join("\n");

      const message = await chatCompletion([{ role: "user", content: prompt }], {
        model: process.env.OPENAI_SCORE_MODEL ?? "gpt-5.5",
        temperature: 0.1, // Reduced temperature for more consistency
      });
      const parsed = extractJson(message?.content ?? "");
      if (!parsed) {
        throw new ServiceUnavailableError("AI score parsing failed");
      }
      result = parsed;
    }

    const saved = await saveAiScoreForServer(user.uid, {
      displayName: fullName,
      score: result.score,
      summary: result.summary,
      strengths: result.strengths,
      improvements: result.improvements,
      model: process.env.OPENAI_API_KEY ? (process.env.OPENAI_SCORE_MODEL ?? "gpt-5.5") : "fallback-heuristic",
    });

    return NextResponse.json({ score: saved });
  } catch (err) {
    logApiError("aiScore.calculate", { userId }, err);
    const status = getApiErrorStatus(err);
    if (status === 429) {
      return NextResponse.json(
        { error: "Too many AI score requests. Please wait a bit and try again." },
        { status: 429 }
      );
    }
    if (status === 503) {
      return NextResponse.json(
        { error: "AI score service is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to calculate AI score" },
      { status: 500 }
    );
  }
}
