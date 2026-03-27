import type { OnboardingSnapshot } from "@/lib/onboarding/types";
import { chatCompletion } from "@/lib/ai/openai";
import type { RoadmapPhase, RoadmapItem, RoadmapGap, RoadmapResult } from "./types";

const GRAD_YEAR = new Date().getFullYear();

interface RoadmapAgentContext {
  answers: OnboardingSnapshot | null;
  gradYear: number;
  name: string;
  phases: RoadmapPhase[];
  gaps: RoadmapGap[];
  summary: string;
}

async function profileGapAgent(ctx: RoadmapAgentContext): Promise<RoadmapAgentContext> {
  const { answers } = ctx;
  const gaps: RoadmapGap[] = [];
  if (!answers?.gpa && !answers?.satScore && !answers?.actScore) {
    gaps.push({
      area: "Academic profile",
      severity: "critical",
      description: "GPA and test scores are missing.",
      recommendation: "Add your GPA and SAT/ACT scores in your profile for personalized guidance.",
    });
  }
  if ((answers?.activityTypes?.length ?? 0) < 2) {
    gaps.push({
      area: "Extracurriculars",
      severity: "important",
      description: "Limited activities listed.",
      recommendation: "Add at least 2–3 meaningful activities with hours and duration.",
    });
  }
  if (!answers?.hasCollegeList || answers?.hasCollegeList === "No") {
    gaps.push({
      area: "College list",
      severity: "important",
      description: "No college list yet.",
      recommendation: "Start building a balanced list of reach, match, and safety schools.",
    });
  }
  return { ...ctx, gaps };
}

async function timelineAgent(ctx: RoadmapAgentContext): Promise<RoadmapAgentContext> {
  const phases: RoadmapPhase[] = [
    {
      id: "phase-1",
      title: "Foundation & Self-Assessment",
      subtitle: "Build awareness and baseline",
      phaseSummary: "Establish a complete profile and clarify your interests and college goals.",
      timeframe: "Now – 3 months",
      order: 1,
      focusArea: "Profile completeness",
      items: [
        { id: "1a", text: "Complete your profile with GPA, test scores, and activities", priority: "high", category: "academic" },
        { id: "1b", text: "Identify 2–3 areas of interest or potential majors", priority: "high", category: "general" },
        { id: "1c", text: "Start a college list with 5–10 schools (reach, match, safety)", priority: "medium", category: "applications" },
      ],
    },
    {
      id: "phase-2",
      title: "Testing & Rigor",
      subtitle: "Strengthen academic profile",
      timeframe: "3–6 months",
      order: 2,
      focusArea: "Standardized tests & coursework",
      items: [
        { id: "2a", text: "Take or retake SAT/ACT if needed; aim for target scores", priority: "high", category: "testing" },
        { id: "2b", text: "Enroll in AP/IB or honors courses where appropriate", priority: "medium", category: "academic" },
        { id: "2c", text: "Deepen 1–2 extracurricular commitments", priority: "medium", category: "extracurricular" },
      ],
    },
    {
      id: "phase-3",
      title: "Essays & Applications",
      subtitle: "Polish and submit",
      phaseSummary: "Craft strong essays and finalize your college list and application strategy.",
      timeframe: "6–9 months",
      order: 3,
      focusArea: "Application materials",
      items: [
        { id: "3a", text: "Draft personal statement and supplemental essays", priority: "high", category: "essays" },
        { id: "3b", text: "Request recommendation letters from teachers", priority: "high", category: "applications" },
        { id: "3c", text: "Finalize college list and application strategy (ED/EA/RD)", priority: "high", category: "applications" },
      ],
    },
    {
      id: "phase-4",
      title: "Final Push & Decisions",
      subtitle: "Submit and decide",
      phaseSummary: "Submit applications, complete financial aid, and make your enrollment decision.",
      timeframe: "9–12 months",
      order: 4,
      focusArea: "Deadlines and decisions",
      items: [
        { id: "4a", text: "Submit all applications before deadlines", priority: "high", category: "applications" },
        { id: "4b", text: "Complete FAFSA and financial aid forms", priority: "high", category: "applications" },
        { id: "4c", text: "Compare offers and make enrollment decision", priority: "high", category: "general" },
      ],
    },
  ];
  return { ...ctx, phases };
}

async function narrativeAgent(ctx: RoadmapAgentContext): Promise<RoadmapAgentContext> {
  const { name, gradYear } = ctx;
  const summary = `Personalized roadmap for ${name}, Class of ${gradYear}. Focus on building a strong profile, testing, and timely applications.`;
  return { ...ctx, summary };
}

function buildFallbackRoadmap(answers: OnboardingSnapshot | null): RoadmapResult {
  const gradYear = answers?.expectedGraduationYear ?? answers?.graduationYear ?? GRAD_YEAR + 2;
  const name = [answers?.firstName, answers?.lastName].filter(Boolean).join(" ") || "Student";

  const base: RoadmapAgentContext = {
    answers,
    gradYear,
    name,
    phases: [],
    gaps: [],
    summary: "",
  };

  return {
    phases: [
      ...(
        ((): RoadmapPhase[] => {
          const p: RoadmapPhase[] = [
            {
              id: "phase-1",
              title: "Foundation & Self-Assessment",
              subtitle: "Build awareness and baseline",
              phaseSummary: "Establish a complete profile and clarify your interests and college goals.",
              timeframe: "Now – 3 months",
              order: 1,
              focusArea: "Profile completeness",
              items: [
                { id: "1a", text: "Complete your profile with GPA, test scores, and activities", priority: "high", category: "academic" },
                { id: "1b", text: "Identify 2–3 areas of interest or potential majors", priority: "high", category: "general" },
                { id: "1c", text: "Start a college list with 5–10 schools (reach, match, safety)", priority: "medium", category: "applications" },
              ],
            },
            {
              id: "phase-2",
              title: "Testing & Rigor",
              subtitle: "Strengthen academic profile",
              phaseSummary: "Boost test scores and course rigor to strengthen your application.",
              timeframe: "3–6 months",
              order: 2,
              focusArea: "Standardized tests & coursework",
              items: [
                { id: "2a", text: "Take or retake SAT/ACT if needed; aim for target scores", priority: "high", category: "testing" },
                { id: "2b", text: "Enroll in AP/IB or honors courses where appropriate", priority: "medium", category: "academic" },
                { id: "2c", text: "Deepen 1–2 extracurricular commitments", priority: "medium", category: "extracurricular" },
              ],
            },
            {
              id: "phase-3",
              title: "Essays & Applications",
              subtitle: "Polish and submit",
              timeframe: "6–9 months",
              order: 3,
              focusArea: "Application materials",
              items: [
                { id: "3a", text: "Draft personal statement and supplemental essays", priority: "high", category: "essays" },
                { id: "3b", text: "Request recommendation letters from teachers", priority: "high", category: "applications" },
                { id: "3c", text: "Finalize college list and application strategy (ED/EA/RD)", priority: "high", category: "applications" },
              ],
            },
            {
              id: "phase-4",
              title: "Final Push & Decisions",
              subtitle: "Submit and decide",
              phaseSummary: "Submit applications, complete financial aid, and make your enrollment decision.",
              timeframe: "9–12 months",
              order: 4,
              focusArea: "Deadlines and decisions",
              items: [
                { id: "4a", text: "Submit all applications before deadlines", priority: "high", category: "applications" },
                { id: "4b", text: "Complete FAFSA and financial aid forms", priority: "high", category: "applications" },
                { id: "4c", text: "Compare offers and make enrollment decision", priority: "high", category: "general" },
              ],
            },
          ];
          return p;
        })()
      ),
    ],
    gaps: [
      ...(
        ((): RoadmapGap[] => {
          const gaps: RoadmapGap[] = [];
          if (!answers?.gpa && !answers?.satScore && !answers?.actScore) {
            gaps.push({
              area: "Academic profile",
              severity: "critical",
              description: "GPA and test scores are missing.",
              recommendation: "Add your GPA and SAT/ACT scores in your profile for personalized guidance.",
            });
          }
          if ((answers?.activityTypes?.length ?? 0) < 2) {
            gaps.push({
              area: "Extracurriculars",
              severity: "important",
              description: "Limited activities listed.",
              recommendation: "Add at least 2–3 meaningful activities with hours and duration.",
            });
          }
          if (!answers?.hasCollegeList || answers?.hasCollegeList === "No") {
            gaps.push({
              area: "College list",
              severity: "important",
              description: "No college list yet.",
              recommendation: "Start building a balanced list of reach, match, and safety schools.",
            });
          }
          return gaps;
        })()
      ),
    ],
    summary: `Personalized roadmap for ${name}, Class of ${gradYear}. Focus on building a strong profile, testing, and timely applications.`,
    studentName: name,
    graduationYear: gradYear,
  };
}

function summarizeForAI(answers: OnboardingSnapshot | null): string {
  if (!answers) return "No profile data available.";
  const parts: string[] = [];
  const o = answers;

  parts.push(`Name: ${o.firstName ?? ""} ${o.lastName ?? ""}`);
  parts.push(`Grade: ${o.gradeLevel ?? "—"}`);
  parts.push(`Graduation year: ${o.expectedGraduationYear ?? o.graduationYear ?? "—"}`);
  parts.push(`High school: ${o.currentHighSchool ?? "—"}`);
  parts.push(`GPA: ${o.gpa ?? "—"} (scale ${o.gpaScale ?? 4})`);
  parts.push(`SAT: ${o.satTotal ?? o.satScore ?? "—"}, ACT: ${o.actComposite ?? o.actScore ?? "—"}`);
  parts.push(`Career path: ${o.careerPath ?? "—"}, confidence: ${o.careerConfidence ?? "—"}/10`);
  parts.push(`Interests: ${o.areasOfInterest?.join(", ") ?? "—"}`);
  parts.push(`Target degree: ${o.targetDegree ?? "—"}`);
  parts.push(`Activities: ${(o.activityTypes?.length ?? 0)} listed`);
  parts.push(`Awards: school ${o.awardsSchool?.length ?? 0}, state ${o.awardsState?.length ?? 0}, national ${o.awardsNational?.length ?? 0}`);
  parts.push(`College list: ${o.hasCollegeList ?? "—"}, strategy: ${o.applicationStrategy ?? "—"}`);
  parts.push(`Campus preference: ${o.campusUrbanSuburbanRural ?? "—"}`);
  parts.push(`Preferred states: ${o.preferredStates?.join(", ") ?? o.locationPreferenceStates?.join(", ") ?? "—"}`);

  return parts.join("\n");
}

export async function generateRoadmap(answers: OnboardingSnapshot | null): Promise<RoadmapResult> {
  const summary = summarizeForAI(answers);
  const gradYear = answers?.expectedGraduationYear ?? answers?.graduationYear ?? GRAD_YEAR + 2;
  const name = [answers?.firstName, answers?.lastName].filter(Boolean).join(" ") || "Student";

  const prompt = `You are an expert college counselor. Create a detailed, personalized roadmap for a high school student based on their profile. Be comprehensive and specific.

STUDENT PROFILE:
${summary}

REQUIREMENTS:
- Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "phases": [
    {
      "id": "phase-1",
      "title": "string",
      "subtitle": "string (optional)",
      "phaseSummary": "string (1-2 sentences describing what this phase achieves)",
      "timeframe": "string (e.g. Now – 3 months)",
      "order": 1,
      "focusArea": "string (optional)",
      "items": [
        {
          "id": "1a",
          "text": "string",
          "priority": "high" | "medium" | "low",
          "category": "academic" | "extracurricular" | "testing" | "essays" | "applications" | "general"
        }
      ]
    }
  ],
  "gaps": [
    {
      "area": "string",
      "severity": "critical" | "important" | "optional",
      "description": "string",
      "recommendation": "string"
    }
  ],
  "summary": "3-5 sentence personalized summary: strengths, main gaps, and overall strategy. Reference their name, GPA, tests, interests."
}

- Create 4-6 phases covering the full journey: Foundation & self-assessment, Testing & rigor, Essays & applications, Final push & decisions. You may split into more phases (e.g. Early exploration, Deep preparation) if it helps clarity.
- Each phase must have "phaseSummary" (1-2 sentences) and 4-6 actionable, specific items.
- Identify 3-5 gaps/weaknesses from the profile. Give concrete, actionable recommendations. Use severity: critical (must address soon), important (should address), optional (nice to have).
- Be highly specific to this student: reference their GPA, test scores, activities, interests, and goals. No generic advice.
- Item text can be up to 120 characters; be concrete (e.g. "Schedule SAT for March and aim for 1400+ based on your current 1200").
- Timeframes must fit a typical application timeline for Class of ${gradYear}.`;

  try {
    const completion = await chatCompletion(
      [{ role: "user", content: prompt }],
      { temperature: 0.5 }
    );

    const raw = Array.isArray(completion?.content)
      ? completion.content.map((p) => (typeof p === "string" ? p : (p as { text?: string }).text ?? "")).join("")
      : (completion?.content ?? "");

    const parsed = JSON.parse(raw) as {
      phases?: RoadmapPhase[];
      gaps?: RoadmapGap[];
      summary?: string;
    };

    if (parsed.phases && Array.isArray(parsed.phases) && parsed.phases.length > 0) {
      return {
        phases: parsed.phases,
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        studentName: name,
        graduationYear: gradYear,
      };
    }
  } catch {
    // Fallback on any error
  }

  return buildFallbackRoadmap(answers);
}
