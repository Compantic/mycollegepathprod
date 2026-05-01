import { NextRequest, NextResponse } from "next/server";
import { getSchoolById } from "@/lib/scorecard/client";
import { getCachedCollege } from "@/lib/scorecard/cache";
import { getCollegeFromFirestoreCache } from "@/lib/scorecard/firestoreCache";
import { chatCompletion } from "@/lib/ai/openai";
import { getApiErrorStatus } from "@/lib/errors/api";
import { logApiError } from "@/lib/logging/api";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import { enforceUserRateLimit } from "@/lib/rateLimit/server";

export type EnrichResponse = {
  acceptanceNote?: string;
  enrollmentNote?: string;
  satNote?: string;
  actNote?: string;
  tuitionNote?: string;
  roomboardNote?: string;
  aboutLine?: string;
  gpaNote?: string;
};

type College = {
  id: number;
  name: string;
  city?: string;
  state?: string;
  student?: { size?: number };
  admission?: {
    admission_rate?: number;
    sat_scores?: { midpoint?: { critical_reading?: number; math?: number; writing?: number } };
    act_scores?: { midpoint?: { cumulative?: number } };
  };
  latest?: {
    student?: { size?: number };
    admission?: { admission_rate?: number };
    cost?: { tuition?: number; roomboard?: number };
  };
};

const MAX_NOTE = 26; // Keep metric cards readable

const DEFAULT_NOTES: EnrichResponse = {
  acceptanceNote: "Contact admissions.",
  enrollmentNote: "See website.",
  satNote: "See school policy.",
  actNote: "See school policy.",
  tuitionNote: "Contact financial aid.",
  roomboardNote: "Contact financial aid.",
  gpaNote: "See website.",
};

function short(s: string): string {
  return s.length > MAX_NOTE ? s.slice(0, MAX_NOTE - 1) + "…" : s;
}

function defaultEnrich(college: College): EnrichResponse {
  const name = college.name.toLowerCase();
  const out: EnrichResponse = { ...DEFAULT_NOTES };
  if (name.includes("harvard") || name.includes("stanford") || name.includes("mit") || name.includes("yale") || name.includes("princeton")) {
    out.acceptanceNote = "Under 10%.";
    out.gpaNote = "~3.9";
    out.satNote = "Mid 50%: 1450–1560.";
    out.actNote = "Mid 50%: 33–35.";
    out.tuitionNote = "Need-based aid available.";
    out.roomboardNote = "See cost of attendance.";
    out.aboutLine = "A world-renowned research university with exceptional resources and opportunities.";
  }
  return out;
}

export async function POST(req: NextRequest) {
  let id: number = NaN;
  let college: College | null = null;
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await enforceUserRateLimit({
      userId: user.uid,
      bucket: "college_enrich",
      windowMs: 60_000,
      maxRequests: 20,
    });

    const body = await req.json().catch(() => ({}));
    const collegeId = body.collegeId ?? req.nextUrl.searchParams.get("collegeId");
    id = typeof collegeId === "string" ? parseInt(collegeId, 10) : collegeId;
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid collegeId" }, { status: 400 });
    }

    college = await getCollegeFromFirestoreCache(id);
    if (!college) college = getCachedCollege(id);
    if (!college) college = await getSchoolById(id);
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    const rate = college.latest?.admission?.admission_rate ?? college.admission?.admission_rate;
    const size = college.latest?.student?.size ?? college.student?.size;
    const sat = college.admission?.sat_scores?.midpoint;
    const act = college.admission?.act_scores?.midpoint?.cumulative;
    const tuition = college.latest?.cost?.tuition;
    const roomboard = college.latest?.cost?.roomboard;
    const hasSat = sat && (sat.critical_reading != null || sat.math != null || sat.writing != null);
    const locationStr = [college.city, college.state].filter(Boolean).join(", ");

    const missing: string[] = [];
    if (rate == null) missing.push("acceptance rate (as percentage, e.g. 4% or Under 10%)");
    if (size == null) missing.push("enrollment size");
    if (!hasSat) missing.push("SAT midpoint");
    if (act == null) missing.push("ACT midpoint");
    if (tuition == null) missing.push("tuition");
    if (roomboard == null) missing.push("room & board");
    missing.push("average GPA of admitted students (short, e.g. 3.9 or ~3.9)");

    if (missing.length === 0) {
      return NextResponse.json({
        aboutLine: undefined,
        acceptanceNote: undefined,
        enrollmentNote: undefined,
        satNote: undefined,
        actNote: undefined,
        tuitionNote: undefined,
        roomboardNote: undefined,
        gpaNote: undefined,
      } as EnrichResponse);
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json(defaultEnrich(college));
    }

    const prompt = `You are a helpful college info assistant. For "${college.name}"${locationStr ? ` in ${locationStr}` : ""}, we have no official data for: ${missing.join(", ")}.

Return a JSON object only (no markdown) with one SHORT line per missing field. Use these exact keys: acceptanceNote (MUST be a percentage e.g. "4%" or "Under 10%"), enrollmentNote, satNote, actNote, tuitionNote, roomboardNote, gpaNote (e.g. "3.9" or "~3.8"). Also add "aboutLine": one engaging sentence about this school.
CRITICAL: acceptanceNote must always be a percentage (e.g. "3.9%" or "Under 10%"). Each note under 26 characters. aboutLine can be longer. Be factual.`;

    const message = await chatCompletion(
      [{ role: "user", content: prompt }],
      { temperature: 0.4 }
    );
    const raw = message?.content?.trim() || "";
    const parsed: EnrichResponse = defaultEnrich(college);
    try {
      const jsonStr = raw.replace(/^```json?\s*|\s*```$/g, "").trim();
      const obj = JSON.parse(jsonStr) as Record<string, string>;
      if (obj.aboutLine) parsed.aboutLine = obj.aboutLine;
      if (obj.acceptanceNote) parsed.acceptanceNote = short(obj.acceptanceNote);
      if (obj.enrollmentNote) parsed.enrollmentNote = short(obj.enrollmentNote);
      if (obj.satNote) parsed.satNote = short(obj.satNote);
      if (obj.actNote) parsed.actNote = short(obj.actNote);
      if (obj.tuitionNote) parsed.tuitionNote = short(obj.tuitionNote);
      if (obj.roomboardNote) parsed.roomboardNote = short(obj.roomboardNote);
      if (obj.gpaNote) parsed.gpaNote = short(obj.gpaNote);
    } catch {
      // use defaultEnrich
    }
    return NextResponse.json(parsed);
  } catch (err) {
    logApiError("college.enrich", { collegeId: id || null }, err);
    const status = getApiErrorStatus(err);
    if (status === 429) {
      return NextResponse.json(
        { error: "AI enrichment is receiving too many requests. Showing basic stats only for now." },
        { status: 429 }
      );
    }
    if (status === 503) {
      return NextResponse.json(
        { error: "AI enrichment service is temporarily unavailable. Showing basic stats only." },
        { status: 503 }
      );
    }
    if (college) return NextResponse.json(defaultEnrich(college));
    return NextResponse.json(
      { error: "College enrichment failed. Please try again later." },
      { status: 500 }
    );
  }
}
