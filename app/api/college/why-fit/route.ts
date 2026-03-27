import { NextRequest, NextResponse } from "next/server";
import { getSchoolById } from "@/lib/scorecard/client";
import { getCachedCollege } from "@/lib/scorecard/cache";
import { getCollegeFromFirestoreCache } from "@/lib/scorecard/firestoreCache";
import { chatCompletion } from "@/lib/ai/openai";
import { getApiErrorStatus } from "@/lib/errors/api";
import { logApiError } from "@/lib/logging/api";

type College = {
  id: number;
  name: string;
  city?: string;
  state?: string;
  student?: { size?: number };
  admission?: { admission_rate?: number };
  latest?: {
    student?: { size?: number };
    admission?: { admission_rate?: number };
    cost?: { tuition?: number; roomboard?: number };
  };
};

type Profile = {
  gpa?: number;
  satScore?: number;
  actScore?: number;
  preferredStates?: string[];
  preferredSize?: string;
};

function fallbackWhyFit(college: College, profile: Profile | null): string {
  const rate = college.latest?.admission?.admission_rate ?? college.admission?.admission_rate;
  const size = college.latest?.student?.size ?? college.student?.size;
  const parts: string[] = [];

  if (college.state && profile?.preferredStates?.length && profile.preferredStates.includes(college.state)) {
    parts.push(`Located in ${college.state}, one of your preferred states.`);
  }
  if (rate != null && rate <= 0.4) {
    parts.push("Selective admission rate makes it a strong reach option.");
  } else if (rate != null && rate >= 0.5 && rate <= 0.8) {
    parts.push("Admission rate suggests a solid match for many applicants.");
  }
  if (size != null && profile?.preferredSize) {
    const small = size < 5000;
    const medium = size >= 5000 && size <= 15000;
    const large = size > 15000;
    if (profile.preferredSize === "small" && small) parts.push("School size matches a smaller campus preference.");
    if (profile.preferredSize === "medium" && medium) parts.push("Mid-size enrollment aligns with your preference.");
    if (profile.preferredSize === "large" && large) parts.push("Large enrollment fits a bigger campus preference.");
  }
  if (profile?.gpa != null && rate != null) {
    parts.push("Your GPA and this school’s selectivity are a reasonable fit to consider.");
  }
  if (parts.length === 0) {
    return "Add your profile and preferences in Settings to see a personalized fit summary. You can still explore this school’s stats and deadlines below.";
  }
  return parts.join(" ");
}

export async function POST(req: NextRequest) {
  let college: College | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    const collegeId = body.collegeId ?? req.nextUrl.searchParams.get("collegeId");
    const id = typeof collegeId === "string" ? parseInt(collegeId, 10) : collegeId;
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid collegeId" }, { status: 400 });
    }

    const profile: Profile | null = body.profile ?? null;

    college = await getCollegeFromFirestoreCache(id);
    if (!college) college = getCachedCollege(id);
    if (!college) college = await getSchoolById(id);
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    const rate = college.latest?.admission?.admission_rate ?? college.admission?.admission_rate;
    const size = college.latest?.student?.size ?? college.student?.size;
    const tuition = college.latest?.cost?.tuition;
    const roomboard = college.latest?.cost?.roomboard;
    const locationStr = [college.city, college.state].filter(Boolean).join(", ");

    const collegeSummary = [
      `Name: ${college.name}`,
      locationStr ? `Location: ${locationStr}` : null,
      rate != null ? `Acceptance rate: ${(rate * 100).toFixed(1)}%` : null,
      size != null ? `Enrollment: ${size.toLocaleString()}` : null,
      tuition != null ? `Tuition: $${tuition.toLocaleString()}` : null,
      roomboard != null ? `Room & board: $${roomboard.toLocaleString()}` : null,
    ]
      .filter(Boolean)
      .join(". ");

    const profileSummary = profile
      ? [
          profile.gpa != null ? `GPA: ${profile.gpa}` : null,
          profile.satScore != null ? `SAT: ${profile.satScore}` : null,
          profile.actScore != null ? `ACT: ${profile.actScore}` : null,
          profile.preferredStates?.length ? `Preferred states: ${profile.preferredStates.join(", ")}` : null,
          profile.preferredSize ? `Preferred size: ${profile.preferredSize}` : null,
        ]
          .filter(Boolean)
          .join(". ")
      : "No student profile provided.";

    const prompt = `You are a supportive college counselor. In 2-3 short, encouraging sentences, explain why this college might be a good fit. Be specific and concise. Use the data provided; if something is missing, don't invent it.

College: ${collegeSummary}

Student profile: ${profileSummary}

Write only the summary, no bullet points or labels.`;

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json({ text: fallbackWhyFit(college, profile) });
    }

    const message = await chatCompletion([{ role: "user", content: prompt }], { temperature: 0.6 });
    const text = message?.content?.trim() || fallbackWhyFit(college, profile);
    return NextResponse.json({ text });
  } catch (err) {
    logApiError("college.whyFit", { collegeId: college?.id ?? null }, err);
    const status = getApiErrorStatus(err);
    if (status === 429) {
      return NextResponse.json(
        { error: "AI explanation is receiving too many requests. Using a simpler fit summary for now." },
        { status: 429 }
      );
    }
    if (status === 503) {
      return NextResponse.json(
        { error: "AI explanation service is temporarily unavailable. Using a simpler fit summary for now." },
        { status: 503 }
      );
    }
    if (college) return NextResponse.json({ text: fallbackWhyFit(college, null) });
    return NextResponse.json(
      { error: "Why-fit explanation failed. Please try again later." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const collegeId = req.nextUrl.searchParams.get("collegeId");
  const id = collegeId ? parseInt(collegeId, 10) : NaN;
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid collegeId" }, { status: 400 });
  }

  try {
    let college: College | null = await getCollegeFromFirestoreCache(id);
    if (!college) college = getCachedCollege(id);
    if (!college) college = await getSchoolById(id);
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }
    const text = fallbackWhyFit(college, null);
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
