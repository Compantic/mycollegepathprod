import { searchSchools } from "@/lib/scorecard/client";
import type { ScorecardCollege } from "@/lib/scorecard/types";
import type { StudentCriteria, CollegeMatch, MatchTier } from "./types";
import type { OnboardingSnapshot } from "@/lib/onboarding/types";
import { chatCompletion } from "@/lib/ai/openai";

const SIZE_SMALL = 5000;
const SIZE_LARGE = 15000;
// Candidate pool and top-N: max 20 recommendations, only from preferred states.
const CANDIDATE_LIMIT = 400;
const PER_PAGE = 50;
const TOP_N = 20;

interface DerivedProfileMetrics {
  academicRigorScore: number; // 0–1
  activityDepthScore: number; // 0–1
  selectivityPreferenceScore: number | null;
  admissionConfidenceScore: number | null;
  placementImportanceScore: number | null;
  prefersHighIntensity: boolean | null;
  personalityOpennessScore: number | null;
}

export interface MatchingProfile {
  /** Core criteria used by the engine (backwards compatible with StudentCriteria). */
  criteria: StudentCriteria;
  /** Read-only onboarding snapshot, if available. */
  onboarding: OnboardingSnapshot | null;
  /** Numeric features derived from onboarding + profile. */
  derived: DerivedProfileMetrics;
}

export interface OpenAIWeightSuggestions {
  wAcademic: number;
  wSelectivity: number;
  wPreference: number;
  wActivity: number;
  wPersonality: number;
}

interface MatchingContext {
  profile: MatchingProfile;
  candidates: ScorecardCollege[];
  scored: CollegeMatch[];
  debugLog: string[];
  /** Weights suggested by OpenAI from profile analysis; used to tune the scoring formula. */
  openaiWeights?: OpenAIWeightSuggestions | null;
}

interface MatchingAgent {
  name: string;
  run(ctx: MatchingContext): Promise<MatchingContext>;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function summarizeStudentProfile(profile: MatchingProfile): string {
  const { criteria, onboarding, derived } = profile;
  const parts: string[] = [];

  if (criteria.gpa != null) parts.push(`GPA ${criteria.gpa.toFixed(2)}`);
  if (criteria.satScore != null) parts.push(`SAT ${criteria.satScore}`);
  if (criteria.actScore != null) parts.push(`ACT ${criteria.actScore}`);
  if (onboarding?.gradeLevel) parts.push(`grade level ${onboarding.gradeLevel}`);
  if (onboarding?.areasOfInterest && onboarding.areasOfInterest.length) {
    parts.push(`interests in ${onboarding.areasOfInterest.join(", ")}`);
  }
  if (onboarding?.careerPath) {
    parts.push(`career direction: ${onboarding.careerPath}`);
  }
  if (onboarding?.targetDegree) parts.push(`target degree ${onboarding.targetDegree}`);
  if (onboarding?.preferredStates && onboarding.preferredStates.length) {
    parts.push(`preferred states ${onboarding.preferredStates.join(", ")}`);
  } else if (onboarding?.locationPreferenceStates && onboarding.locationPreferenceStates.length) {
    parts.push(`location preferences ${onboarding.locationPreferenceStates.join(", ")}`);
  }
  if (derived.academicRigorScore > 0) {
    parts.push(`academic rigor score ${(derived.academicRigorScore * 100).toFixed(0)}/100`);
  }
  if (derived.activityDepthScore > 0) {
    parts.push(`activity depth score ${(derived.activityDepthScore * 100).toFixed(0)}/100`);
  }

  const summary = parts.join("; ");
  return summary || "Limited profile information.";
}

function summarizeCollege(c: CollegeMatch): string {
  const parts: string[] = [];
  if (c.admissionRate != null) {
    parts.push(`admission rate ${(c.admissionRate * 100).toFixed(1)}%`);
  }
  if (c.satMidpoint != null) {
    parts.push(`SAT midpoint ${c.satMidpoint}`);
  }
  if (c.actMidpoint != null) {
    parts.push(`ACT midpoint ${c.actMidpoint}`);
  }
  if (c.size != null) {
    parts.push(`enrollment about ${c.size} students`);
  }
  if (c.state) {
    parts.push(`located in ${c.city ? `${c.city}, ` : ""}${c.state}`);
  }
  return parts.join("; ");
}

function buildDerivedMetrics(onboarding: OnboardingSnapshot | null): DerivedProfileMetrics {
  if (!onboarding) {
    return {
      academicRigorScore: 0,
      activityDepthScore: 0,
      selectivityPreferenceScore: null,
      admissionConfidenceScore: null,
      placementImportanceScore: null,
      prefersHighIntensity: null,
      personalityOpennessScore: null,
    };
  }

  const rigorousTotal =
    (onboarding.rigorousApCompleted ?? 0) +
    (onboarding.rigorousIbCompleted ?? 0) +
    (onboarding.rigorousHonorsCompleted ?? 0);
  const academicRigorScore = clamp01(rigorousTotal / 10);

  const activityCount = onboarding.activityTypes?.length ?? 0;
  const awardsCount =
    (onboarding.awardsSchool?.length ?? 0) +
    (onboarding.awardsState?.length ?? 0) +
    (onboarding.awardsNational?.length ?? 0) +
    (onboarding.awardsInternational?.length ?? 0);
  const activityBreadth = clamp01(activityCount / 5);
  const activityAwards = clamp01(awardsCount / 4);
  const activityDepthScore = clamp01(activityBreadth * 0.6 + activityAwards * 0.4);

  const selectivityPreferenceScore =
    onboarding.selectivityImportance != null ? clamp01(onboarding.selectivityImportance / 10) : null;
  const admissionConfidenceScore =
    onboarding.admissionProcessConfidence != null ? clamp01(onboarding.admissionProcessConfidence / 10) : null;
  const placementImportanceScore =
    onboarding.placementRatesImportance != null ? clamp01(onboarding.placementRatesImportance / 10) : null;

  let prefersHighIntensity: boolean | null = null;
  if (onboarding.campusIntensityVsBalanced === "High intensity") prefersHighIntensity = true;
  else if (onboarding.campusIntensityVsBalanced === "Balanced life") prefersHighIntensity = false;

  // Very lightweight personality openness signal from intellectual preferences + life satisfaction.
  let openness = 0.5;
  if (onboarding.intellectualStructuredVsOpen === "Open-ended") openness += 0.15;
  if (onboarding.intellectualTheoreticalVsHandsOn === "Hands-on") openness += 0.1;
  if ((onboarding.workInclination?.length ?? 0) >= 3) openness += 0.05;
  if (onboarding.lifeSatisfaction != null) {
    const satNorm = clamp01(onboarding.lifeSatisfaction / 10);
    openness += (satNorm - 0.5) * 0.1;
  }

  return {
    academicRigorScore,
    activityDepthScore,
    selectivityPreferenceScore,
    admissionConfidenceScore,
    placementImportanceScore,
    prefersHighIntensity,
    personalityOpennessScore: clamp01(openness),
  };
}

export function buildMatchingProfile(
  criteria: StudentCriteria,
  onboarding: OnboardingSnapshot | null
): MatchingProfile {
  const o = onboarding;

  const mergedCriteria: StudentCriteria = {
    gpa: criteria.gpa ?? o?.gpa,
    satScore: criteria.satScore ?? o?.satTotal ?? o?.satScore,
    actScore: criteria.actScore ?? o?.actComposite ?? o?.actScore,
    preferredMajors: criteria.preferredMajors ?? o?.areasOfInterest,
    preferredStates:
      criteria.preferredStates ?? o?.preferredStates ?? o?.locationPreferenceStates,
    preferredSize: criteria.preferredSize ?? o?.preferredSize,
  };

  return {
    criteria: mergedCriteria,
    onboarding: o ?? null,
    derived: buildDerivedMetrics(o ?? null),
  };
}

const ProfileAgent: MatchingAgent = {
  name: "profile",
  async run(ctx) {
    const derived = buildDerivedMetrics(ctx.profile.onboarding);
    return {
      ...ctx,
      profile: { ...ctx.profile, derived },
      debugLog: [...ctx.debugLog, "profile:derived-updated"],
    };
  },
};

/** Uses OpenAI to analyze the student profile and suggest scoring weights for this run. */
const ProfileAnalysisAgent: MatchingAgent = {
  name: "profile-analysis",
  async run(ctx) {
    const summary = summarizeStudentProfile(ctx.profile);
    const { criteria, onboarding } = ctx.profile;

    const prompt = {
      profileSummary: summary,
      details: {
        hasGpa: criteria.gpa != null,
        hasSatOrAct: criteria.satScore != null || criteria.actScore != null,
        preferredStatesCount: criteria.preferredStates?.length ?? 0,
        hasPreferredSize: !!criteria.preferredSize,
        hasPreferredMajors: (criteria.preferredMajors?.length ?? 0) > 0,
        areasOfInterest: onboarding?.areasOfInterest ?? [],
        targetDegree: onboarding?.targetDegree,
        careerPath: onboarding?.careerPath,
      },
      instructions:
        "Suggest how much weight to give each factor when scoring college fit for this student. Return ONLY valid JSON with keys: wAcademic (weight for GPA/test fit), wSelectivity (admission competitiveness), wPreference (location + campus size), wActivity (extracurricular depth), wPersonality (campus culture fit). Each number 0–1; they must sum to 1.0. If the student has strong academics (GPA + tests), favor wAcademic. If they care about location/size, favor wPreference. If they have rich activities, give wActivity a bit more. Be specific to this profile.",
    };

    try {
      const completion = await chatCompletion(
        [
          {
            role: "system",
            content:
              "You are an expert college counselor. Analyze the student profile and output scoring weights as JSON only. No other text.",
          },
          { role: "user", content: JSON.stringify(prompt) },
        ],
        { temperature: 0.3 }
      );

      const text = completion?.content
        ? (Array.isArray(completion.content)
            ? completion.content.map((p) => (typeof p === "string" ? p : (p as { text?: string }).text ?? "")).join("")
            : String(completion.content))
        : "";
      const parsed = JSON.parse(text) as Record<string, number>;
      const wAcademic = clamp01(typeof parsed.wAcademic === "number" ? parsed.wAcademic : 0.35);
      const wSelectivity = clamp01(typeof parsed.wSelectivity === "number" ? parsed.wSelectivity : 0.15);
      const wPreference = clamp01(typeof parsed.wPreference === "number" ? parsed.wPreference : 0.25);
      const wActivity = clamp01(typeof parsed.wActivity === "number" ? parsed.wActivity : 0.15);
      const wPersonality = clamp01(typeof parsed.wPersonality === "number" ? parsed.wPersonality : 0.1);
      const sum = wAcademic + wSelectivity + wPreference + wActivity + wPersonality;
      const openaiWeights: OpenAIWeightSuggestions = {
        wAcademic: wAcademic / sum,
        wSelectivity: wSelectivity / sum,
        wPreference: wPreference / sum,
        wActivity: wActivity / sum,
        wPersonality: wPersonality / sum,
      };
      return {
        ...ctx,
        openaiWeights,
        debugLog: [...ctx.debugLog, "profile-analysis:openai-weights"],
      };
    } catch {
      return { ...ctx, debugLog: [...ctx.debugLog, "profile-analysis:skip"] };
    }
  },
};

function getSatTotal(c: ScorecardCollege): number | null {
  const sat = c.admission?.sat_scores?.midpoint;
  if (!sat) return null;
  return (sat.critical_reading ?? 0) + (sat.math ?? 0) + (sat.writing ?? 0);
}

function getAct(c: ScorecardCollege): number | null {
  return c.admission?.act_scores?.midpoint?.cumulative ?? null;
}

interface AcademicFitResult {
  score: number;
  reasons: string[];
  parts: {
    gpa?: number;
    sat?: number;
    act?: number;
  };
}

/** AcademicFit: GPA/test vs school midpoints, gently adjusted by rigor. */
function academicFit(
  c: ScorecardCollege,
  criteria: StudentCriteria,
  derived?: DerivedProfileMetrics
): AcademicFitResult {
  const reasons: string[] = [];
  let total = 0;
  let count = 0;
  let gpaComponent = 0;
  let satComponent = 0;
  let actComponent = 0;
  const satTotal = getSatTotal(c);
  const act = getAct(c);
  const rate = c.latest?.admission?.admission_rate ?? c.admission?.admission_rate;

  if (criteria.satScore != null && satTotal != null) {
    const diff = Math.abs(criteria.satScore - satTotal);
    // Slightly steeper so SAT improvements show more in the score (e.g. +50 pts).
    const score = Math.max(0, 1 - diff / 350);
    total += score;
    satComponent = score;
    count++;
    if (score >= 0.7) reasons.push("Strong SAT fit with typical admitted students");
    else if (score >= 0.4) reasons.push("Moderate SAT alignment");
  }
  if (criteria.actScore != null && act != null) {
    const diff = Math.abs(criteria.actScore - act);
    const score = Math.max(0, 1 - diff / 8);
    total += score;
    actComponent = score;
    count++;
    if (score >= 0.7) reasons.push("ACT scores align with school midpoint");
  }
  if (criteria.gpa != null && rate != null) {
    const gpaNorm = Math.min(1, Math.max(0, criteria.gpa / 4));
    const selectivity = 1 - rate;
    // Steeper curve so GPA changes (e.g. 3.6 → 3.9) move the score more for selective schools.
    const gap = Math.abs(gpaNorm - selectivity);
    const score = Math.max(0, 1 - 1.6 * gap);
    total += score;
    gpaComponent = score;
    count++;
    reasons.push("GPA aligned with school selectivity");
  }
  // If we still have no academic data but do know selectivity, use that so scores differ across schools.
  if (count === 0 && rate != null) {
    const selectivity = 1 - rate;
    const score = 0.4 + selectivity * 0.6;
    total += score;
    count++;
    reasons.push("Using school selectivity until you add GPA or test scores");
  }
  if (count === 0) {
    total = 0.5;
    reasons.push("Add test scores and GPA in your profile for better academic fit");
  }
  let normalized = count > 0 ? total / count : 0.5;

  if (derived && derived.academicRigorScore > 0 && criteria.gpa != null) {
    // Give a small boost for students with strong rigor so selective schools with similar profiles rise slightly.
    const boost = 0.05 * derived.academicRigorScore;
    normalized = clamp01(normalized + boost);
    if (boost > 0.02) {
      reasons.push("Your rigorous coursework strengthens academic fit here");
    }
  }

  return {
    score: normalized,
    reasons: reasons.slice(0, 2),
    parts: {
      gpa: gpaComponent || undefined,
      sat: satComponent || undefined,
      act: actComponent || undefined,
    },
  };
}

/** SelectivityFit: preference for \"match\" selectivity band, shifted by student's preferences. */
function selectivityFit(
  c: ScorecardCollege,
  criteria: StudentCriteria,
  derived?: DerivedProfileMetrics
): { score: number; reasons: string[] } {
  const rate = c.latest?.admission?.admission_rate ?? c.admission?.admission_rate;
  const reasons: string[] = [];
  if (rate == null) return { score: 0.5, reasons: ["Selectivity data not available"] };

  // Default \"match\" band around 40% admit rate. Shift this based on selectivityImportance (0–1).
  let target = 0.4;
  if (derived?.selectivityPreferenceScore != null) {
    // 0 -> target ~0.6 (less selective schools), 1 -> target ~0.25 (more selective schools)
    const p = derived.selectivityPreferenceScore;
    target = 0.25 + (1 - p) * 0.35;
  }

  const distance = Math.abs(rate - target);
  const score = Math.max(0, 1 - distance * 2.4);
  if (rate <= 0.25) reasons.push("Highly selective (reach)");
  else if (rate <= 0.5) reasons.push("Selective, good match potential");
  else reasons.push("More accessible (safety)");
  return { score, reasons };
}

interface PreferenceFitResult {
  score: number;
  reasons: string[];
  parts: {
    state?: number;
    size?: number;
  };
}

/** PreferenceFit: state + campus size (granular so limited-data schools still get different scores). */
function preferenceFit(
  c: ScorecardCollege,
  criteria: StudentCriteria,
  derived?: DerivedProfileMetrics
): PreferenceFitResult {
  const reasons: string[] = [];
  let stateScore = 0.5;
  let sizeScore = 0.5;

  if (criteria.preferredStates?.length && c.state) {
    stateScore = criteria.preferredStates.includes(c.state) ? 1 : 0;
    if (stateScore === 1) reasons.push("In your preferred state");
  } else if (c.state) {
    reasons.push(`Located in ${c.state}`);
  }

  const size = c.latest?.student?.size ?? c.student?.size;
  if (size != null) {
    if (criteria.preferredSize) {
      const match =
        (criteria.preferredSize === "small" && size < SIZE_SMALL) ||
        (criteria.preferredSize === "medium" && size >= SIZE_SMALL && size <= SIZE_LARGE) ||
        (criteria.preferredSize === "large" && size > SIZE_LARGE);
      const idealMid = criteria.preferredSize === "small" ? 2500 : criteria.preferredSize === "medium" ? 10000 : 20000;
      const range = criteria.preferredSize === "small" ? 2500 : criteria.preferredSize === "medium" ? 5000 : 10000;
      const distance = Math.abs(size - idealMid) / (range || 1);
      sizeScore = match ? clamp01(1 - 0.2 * Math.min(1, distance)) : clamp01(0.6 - 0.2 * Math.min(1, distance));
      if (match) reasons.push("Campus size matches your preference");
    } else {
      const mid = 10000;
      sizeScore = 0.5 + 0.5 * clamp01(1 - Math.min(1, Math.abs(size - mid) / 20000));
    }
  }
  if (size != null && !reasons.some((r) => r.includes("size"))) {
    const sizeLabel = size < SIZE_SMALL ? "small" : size <= SIZE_LARGE ? "medium" : "large";
    reasons.push(`Campus size: ${sizeLabel}`);
  }

  if (derived && size != null && derived.activityDepthScore > 0.5) {
    const isLargeCampus = size > SIZE_SMALL;
    if (isLargeCampus) {
      sizeScore = clamp01(sizeScore + 0.1 * derived.activityDepthScore);
      reasons.push("Larger campus offers many opportunities for your activities");
    }
  }

  if (derived && derived.prefersHighIntensity === false && size != null && size > SIZE_LARGE) {
    sizeScore = clamp01(sizeScore - 0.1);
    reasons.push("Very large campus may feel intense; we slightly lower this match");
  }

  const score = (stateScore + sizeScore) / 2;
  return {
    score,
    reasons: reasons.slice(0, 2),
    parts: {
      state: stateScore || undefined,
      size: sizeScore || undefined,
    },
  };
}

function assignTier(c: ScorecardCollege, criteria: StudentCriteria): MatchTier {
  const rate = c.latest?.admission?.admission_rate ?? c.admission?.admission_rate;
  if (rate == null) return "match";

  const satTotal = getSatTotal(c);
  const act = getAct(c);
  const studentAboveMidpoint =
    (criteria.satScore != null && satTotal != null && criteria.satScore >= satTotal - 50) ||
    (criteria.actScore != null && act != null && criteria.actScore >= act - 1);

  if (rate <= 0.25 || !studentAboveMidpoint) return "reach";
  if (rate >= 0.6 && studentAboveMidpoint) return "safety";
  return "match";
}

function buildImproveTips(c: ScorecardCollege, criteria: StudentCriteria, tier: MatchTier): string[] {
  const tips: string[] = [];
  const name = c.name ?? "This school";
  const satTotal = getSatTotal(c);
  const act = getAct(c);
  const rate = c.latest?.admission?.admission_rate ?? c.admission?.admission_rate;
  const size = c.latest?.student?.size ?? c.student?.size;

  if (rate == null) {
    tips.push(`${name}'s admission criteria aren't in our dataset. Check their official admissions page for GPA and test score requirements.`);
  }
  if (criteria.satScore != null && satTotal != null && criteria.satScore < satTotal) {
    const gap = satTotal - criteria.satScore;
    tips.push(`Raising your SAT by ~${Math.round(gap)} points could strengthen your profile for ${name}.`);
  }
  if (criteria.satScore == null && satTotal != null) {
    tips.push(`Add your SAT in Settings to compare with ${name}'s typical admitted range (mid 50% ~${satTotal}).`);
  }
  if (criteria.actScore != null && act != null && criteria.actScore < act) {
    tips.push(`Improving your ACT by 1–2 points could improve your chances at ${name}.`);
  }
  if (criteria.actScore == null && act != null) {
    tips.push(`Add your ACT in Settings to see how you compare to ${name}'s typical range (mid ~${act}).`);
  }
  if (criteria.gpa == null && (rate != null || satTotal != null || act != null)) {
    tips.push("Adding your GPA in Settings helps us show how your profile fits this school's selectivity.");
  }
  if (tier === "reach" && rate != null) {
    tips.push(`For ${name} (reach), balance your list with more match and safety schools.`);
  }
  if (tier === "safety") {
    tips.push(`Use ${name} as a solid backup; aim for 2–3 safety schools total.`);
  }
  if (tier === "match" && rate != null) {
    tips.push(`Your profile aligns well with ${name}; strengthen your application with strong essays and recommendations.`);
  }
  if (!criteria.preferredStates?.length && c.state) {
    tips.push("Set preferred states in Settings to see more targeted matches by region.");
  }
  if (criteria.preferredSize && size != null) {
    const match =
      (criteria.preferredSize === "small" && size < SIZE_SMALL) ||
      (criteria.preferredSize === "medium" && size >= SIZE_SMALL && size <= SIZE_LARGE) ||
      (criteria.preferredSize === "large" && size > SIZE_LARGE);
    if (!match) {
      const sizeLabel = size < SIZE_SMALL ? "small" : size <= SIZE_LARGE ? "medium" : "large";
      tips.push(`${name} has a ${sizeLabel} campus; update size preference in Settings if you want different options.`);
    }
  }
  return tips.slice(0, 4);
}

const CandidateCollectorAgent: MatchingAgent = {
  name: "candidate-collector",
  async run(ctx) {
    const { criteria } = ctx.profile;
    const all: ScorecardCollege[] = [];
    const seen = new Set<number>();

    const pushUnique = (results: ScorecardCollege[]) => {
      for (const c of results) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          all.push(c);
          if (all.length >= CANDIDATE_LIMIT) break;
        }
      }
    };

    // Only recommend colleges in the user's preferred states; no national search.
    const preferredStates =
      criteria.preferredStates && criteria.preferredStates.length > 0
        ? criteria.preferredStates
        : null;

    if (!preferredStates) {
      return {
        ...ctx,
        candidates: [],
        debugLog: [...ctx.debugLog, "candidates:0 (no preferred states)"],
      };
    }

    const maxStates = 10;
    for (const state of preferredStates.slice(0, maxStates)) {
      let page = 0;
      let hasMore = true;
      while (hasMore && all.length < CANDIDATE_LIMIT) {
        const res = await searchSchools({
          per_page: PER_PAGE,
          page,
          "school.degrees_awarded.predominant": "3",
          "school.state": state,
        });
        const results = res.results ?? [];
        pushUnique(results);
        hasMore = results.length === PER_PAGE;
        page++;
      }
      if (all.length >= CANDIDATE_LIMIT) break;
    }

    return {
      ...ctx,
      candidates: all,
      debugLog: [...ctx.debugLog, `candidates:${all.length}`],
    };
  },
};

const HeuristicScoringAgent: MatchingAgent = {
  name: "heuristic-scoring",
  async run(ctx) {
    const { criteria, derived } = ctx.profile;
    if (!ctx.candidates.length) return ctx;

    const hasGpa = criteria.gpa != null;
    const hasTestScore = criteria.satScore != null || criteria.actScore != null;
    const hasFullAcademic = hasGpa && hasTestScore;

    let wAcademic = hasFullAcademic ? 0.45 : 0.35;
    let wSelectivity = 0.15;
    let wPreference = 0.25;
    let wActivity = 0.15;
    let wPersonality = 0.1;

    if (derived.selectivityPreferenceScore != null) {
      const p = derived.selectivityPreferenceScore;
      wSelectivity += 0.1 * p;
      wPreference -= 0.05 * p;
    }
    if (derived.activityDepthScore > 0.7) {
      wActivity += 0.05;
      wAcademic -= 0.02;
      wSelectivity -= 0.03;
    }
    if (derived.prefersHighIntensity === false) {
      wPreference += 0.05;
      wSelectivity -= 0.05;
    }
    let sumWeights = wAcademic + wSelectivity + wPreference + wActivity + wPersonality;
    wAcademic /= sumWeights;
    wSelectivity /= sumWeights;
    wPreference /= sumWeights;
    wActivity /= sumWeights;
    wPersonality /= sumWeights;

    if (ctx.openaiWeights) {
      const o = ctx.openaiWeights;
      const blend = 0.5;
      wAcademic = blend * wAcademic + (1 - blend) * o.wAcademic;
      wSelectivity = blend * wSelectivity + (1 - blend) * o.wSelectivity;
      wPreference = blend * wPreference + (1 - blend) * o.wPreference;
      wActivity = blend * wActivity + (1 - blend) * o.wActivity;
      wPersonality = blend * wPersonality + (1 - blend) * o.wPersonality;
      sumWeights = wAcademic + wSelectivity + wPreference + wActivity + wPersonality;
      wAcademic /= sumWeights;
      wSelectivity /= sumWeights;
      wPreference /= sumWeights;
      wActivity /= sumWeights;
      wPersonality /= sumWeights;
    }

    const scored: CollegeMatch[] = ctx.candidates.map((c) => {
      const academic = academicFit(c, criteria, derived);
      const selectivity = selectivityFit(c, criteria, derived);
      const preference = preferenceFit(c, criteria, derived);
      const rate = c.latest?.admission?.admission_rate ?? c.admission?.admission_rate;
      const satTotal = getSatTotal(c);
      const act = getAct(c);
      const dataLimited = rate == null || (satTotal == null && act == null);

      const activityScore = preference.score * (0.7 + 0.3 * derived.activityDepthScore);
      const personalityBase = derived.personalityOpennessScore ?? 0.5;
      const personalityScore = selectivity.score * (0.7 + 0.3 * personalityBase);

      const academicWeighted = wAcademic * academic.score;
      const selectivityWeighted = wSelectivity * selectivity.score;
      const preferenceWeighted = wPreference * preference.score;
      const activityWeighted = wActivity * activityScore;
      const personalityWeighted = wPersonality * personalityScore;

      const composite =
        academicWeighted +
        selectivityWeighted +
        preferenceWeighted +
        activityWeighted +
        personalityWeighted;

      const clamped = clamp01(composite);
      const baseMatchScore = Math.round(clamped * 1000) / 10;
      const tier = assignTier(c, criteria);
      const size = c.latest?.student?.size ?? c.student?.size;

      let matchScore = baseMatchScore;
      if (dataLimited) {
        matchScore = Math.round(clamped * 0.85 * 1000) / 10;
      }

      // Factor breakdown (percentage-point contributions that approximately sum to matchScore)
      const componentTotal =
        academicWeighted +
        selectivityWeighted +
        preferenceWeighted +
        activityWeighted +
        personalityWeighted;

      const pointsFrom = (component: number): number =>
        componentTotal > 0 ? (matchScore * component) / componentTotal : 0;

      const academicPoints = pointsFrom(academicWeighted);
      const selectivityPoints = pointsFrom(selectivityWeighted);
      const preferencePoints = pointsFrom(preferenceWeighted);
      const activityPoints = pointsFrom(activityWeighted);
      const personalityPoints = pointsFrom(personalityWeighted);

      let academicPartsTotal =
        (academic.parts.gpa ?? 0) + (academic.parts.sat ?? 0) + (academic.parts.act ?? 0);
      const prefPartsTotal =
        (preference.parts.state ?? 0) + (preference.parts.size ?? 0);

      const safeFrac = (part: number, total: number) => (total > 0 ? part / total : 0);

      // If we couldn't split academic score into GPA/SAT/ACT parts from data (e.g. limited Scorecard),
      // distribute it heuristically based on which student metrics are present so that the user still
      // sees how much of the score roughly comes from academics.
      let gpaBase = academic.parts.gpa ?? 0;
      let satBase = academic.parts.sat ?? 0;
      let actBase = academic.parts.act ?? 0;
      if (academicPartsTotal === 0) {
        if (hasGpa && hasTestScore) {
          gpaBase = 0.6;
          satBase = 0.4;
        } else if (hasGpa) {
          gpaBase = 1;
        } else if (hasTestScore) {
          satBase = 1;
        }
        academicPartsTotal = gpaBase + satBase + actBase;
      }

      const gpaPoints = academicPoints * safeFrac(gpaBase, academicPartsTotal);
      const satPoints = academicPoints * safeFrac(satBase, academicPartsTotal);
      const actPoints = academicPoints * safeFrac(actBase, academicPartsTotal);

      const locationPoints =
        preferencePoints * safeFrac(preference.parts.state ?? 0, prefPartsTotal);
      const sizePoints =
        preferencePoints * safeFrac(preference.parts.size ?? 0, prefPartsTotal);

      const round1 = (v: number) => Math.round(v * 10) / 10;

      const factorBreakdown: NonNullable<CollegeMatch["factorBreakdown"]> = {
        gpa: gpaPoints > 0 ? round1(gpaPoints) : undefined,
        sat: satPoints > 0 ? round1(satPoints) : undefined,
        act: actPoints > 0 ? round1(actPoints) : undefined,
        location: locationPoints > 0 ? round1(locationPoints) : undefined,
        size: sizePoints > 0 ? round1(sizePoints) : undefined,
        selectivity: selectivityPoints > 0 ? round1(selectivityPoints) : undefined,
        activities: activityPoints > 0 ? round1(activityPoints) : undefined,
        personality: personalityPoints > 0 ? round1(personalityPoints) : undefined,
      };

      const breakdownEntries = Object.entries(factorBreakdown).filter(
        ([, v]) => typeof v === "number" && v > 0
      ) as [keyof NonNullable<CollegeMatch["factorBreakdown"]>, number][];

      const labelMap: Record<string, string> = {
        gpa: "GPA",
        sat: "SAT",
        act: "ACT",
        location: "location/state fit",
        size: "campus size fit",
        selectivity: "selectivity profile",
        activities: "activities & opportunities",
        personality: "campus culture fit",
      };

      const breakdownSummary =
        breakdownEntries.length > 0
          ? "Approximate score breakdown: " +
            breakdownEntries
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([key, value]) => `${labelMap[key]} ~${value.toFixed(1)} pts`)
              .join(", ")
          : "";

      const baseReasons = [...academic.reasons, ...selectivity.reasons, ...preference.reasons];
      const reasons =
        breakdownSummary && breakdownSummary.length > 0
          ? [breakdownSummary, ...baseReasons].slice(0, 3)
          : baseReasons.slice(0, 3);
      const improveTips = buildImproveTips(c, criteria, tier);

      return {
        id: c.id,
        name: c.name ?? "Unknown",
        city: c.city,
        state: c.state,
        admissionRate: rate,
        size,
        satMidpoint: satTotal ?? undefined,
        actMidpoint: act ?? undefined,
        matchScore: Math.min(100, Math.max(0, matchScore)),
        tier,
        dataLimited: dataLimited || undefined,
        reasons,
        improveTips,
        factorBreakdown,
      };
    });

    return {
      ...ctx,
      scored,
      debugLog: [...ctx.debugLog, `scored:${scored.length}`],
    };
  },
};

const DiversityAgent: MatchingAgent = {
  name: "diversity",
  async run(ctx) {
    if (!ctx.scored.length) return ctx;

    const preferredStates = ctx.profile.criteria.preferredStates ?? [];
    let adjusted = [...ctx.scored];

    // Only keep colleges in the user's preferred states (no out-of-state recommendations).
    if (preferredStates.length > 0) {
      const stateSet = new Set(preferredStates.map((s) => s.toUpperCase()));
      adjusted = adjusted.filter((m) => m.state && stateSet.has(m.state.toUpperCase()));
    }

    adjusted.sort((a, b) => b.matchScore - a.matchScore);

    const result = adjusted.slice(0, TOP_N);

    return {
      ...ctx,
      scored: result,
      debugLog: [...ctx.debugLog, `final:${result.length}`],
    };
  },
};

const ExplanationAgent: MatchingAgent = {
  name: "explanation",
  async run(ctx) {
    if (!ctx.scored.length) {
      return {
        ...ctx,
        debugLog: [...ctx.debugLog, "explanations:none"],
      };
    }

    const studentSummary = summarizeStudentProfile(ctx.profile);
    // All results get deep analysis (max TOP_N = 20).
    const topForAI = ctx.scored.slice(0, TOP_N);

    try {
      const updated = await Promise.all(
        topForAI.map(async (match) => {
          const schoolSummary = summarizeCollege(match);

          const userContent = {
            student: studentSummary,
            school: {
              name: match.name,
              summary: schoolSummary,
              tier: match.tier,
              admissionRate: match.admissionRate != null ? `${(match.admissionRate * 100).toFixed(1)}%` : null,
              satMidpoint: match.satMidpoint,
              actMidpoint: match.actMidpoint,
              size: match.size,
              state: match.state,
              city: match.city,
              currentReasons: match.reasons,
              currentTips: match.improveTips,
            },
            instructions:
              "Perform a deep fit analysis. Produce a JSON object with: fitScore (number 0-100: how well this college fits this student overall, considering GPA, test scores, location, size, selectivity, interests, and goals—be strict for reach schools and generous for true fits), whyFit (2-3 sentences: why this college fits this student), reasons (array of 4 specific bullet points), improveTips (array of 5 concrete suggestions). If the provided admissionRate or satMidpoint is null or missing, also include your best estimates as estimatedAdmissionRate (0-1, overall admit rate) and estimatedSatTotal (400-1600, typical SAT total for admitted students). If you do not need to estimate, you may omit these fields. Respond ONLY with valid JSON; no other keys.",
          };

          const completion = await chatCompletion(
            [
              {
                role: "system",
                content:
                  "You are an expert college counselor. Analyze fit between the student and this college. You must return valid JSON including: fitScore (0-100, overall fit considering academics, location, size, selectivity, interests), whyFit, reasons, improveTips. Be consistent: reach schools lower fitScore, true matches higher. Respond ONLY with valid JSON.",
              },
              { role: "user", content: JSON.stringify(userContent) },
            ],
            { temperature: 0.35 }
          );

          if (!completion?.content) return match;

          const text = Array.isArray(completion.content)
            ? completion.content.map((p) => (typeof p === "string" ? p : (p as { text?: string }).text ?? "")).join("")
            : (completion.content ?? "");

          try {
            const parsed = JSON.parse(text) as {
              fitScore?: number;
              whyFit?: string;
              reasons?: string[];
              improveTips?: string[];
              estimatedAdmissionRate?: number;
              estimatedSatTotal?: number;
            };

            let reasons =
              parsed.reasons && Array.isArray(parsed.reasons) && parsed.reasons.length
                ? parsed.reasons.slice(0, 4)
                : match.reasons;

            // If Scorecard is missing core academic data, surface model's approximate estimates in the reasons.
            const estimateSnippets: string[] = [];
            if (
              match.admissionRate == null &&
              typeof parsed.estimatedAdmissionRate === "number" &&
              parsed.estimatedAdmissionRate > 0 &&
              parsed.estimatedAdmissionRate < 1
            ) {
              estimateSnippets.push(
                `Estimated admit rate ~${(parsed.estimatedAdmissionRate * 100).toFixed(1)}% (model-based, not official data)`
              );
            }
            if (
              match.satMidpoint == null &&
              typeof parsed.estimatedSatTotal === "number" &&
              parsed.estimatedSatTotal >= 400 &&
              parsed.estimatedSatTotal <= 1600
            ) {
              estimateSnippets.push(
                `Estimated SAT total ~${Math.round(parsed.estimatedSatTotal)} (model-based, not official data)`
              );
            }
            if (estimateSnippets.length > 0) {
              const estimateLine = estimateSnippets.join(" ");
              if (!reasons.includes(estimateLine)) {
                reasons = [estimateLine, ...reasons].slice(0, 4);
              }
            }

            const improveTips =
              parsed.improveTips && Array.isArray(parsed.improveTips) && parsed.improveTips.length
                ? parsed.improveTips.slice(0, 5)
                : match.improveTips;

            const whyFitPrefix =
              parsed.whyFit && typeof parsed.whyFit === "string"
                ? parsed.whyFit.trim()
                : null;

            const enhancedReasons =
              whyFitPrefix && !reasons.includes(whyFitPrefix)
                ? [whyFitPrefix, ...reasons].slice(0, 4)
                : reasons;

            let matchScore = match.matchScore;
            const rawFit = parsed.fitScore;
            if (typeof rawFit === "number" && !Number.isNaN(rawFit)) {
              const openaiScore = Math.min(100, Math.max(0, rawFit));
              matchScore = Math.round((0.45 * matchScore + 0.55 * openaiScore) * 10) / 10;
              matchScore = Math.min(100, Math.max(0, matchScore));
            }

            return {
              ...match,
              matchScore,
              reasons: enhancedReasons,
              improveTips,
            };
          } catch {
            return match;
          }
        })
      );

      const merged = [...ctx.scored];
      for (let i = 0; i < updated.length; i++) {
        merged[i] = updated[i];
      }

      return {
        ...ctx,
        scored: merged,
        debugLog: [...ctx.debugLog, "explanations:openai"],
      };
    } catch {
      return {
        ...ctx,
        debugLog: [...ctx.debugLog, "explanations:error"],
      };
    }
  },
};

async function runMatchingAgents(profile: MatchingProfile): Promise<CollegeMatch[]> {
  const agents: MatchingAgent[] = [
    ProfileAgent,
    ProfileAnalysisAgent,
    CandidateCollectorAgent,
    HeuristicScoringAgent,
    DiversityAgent,
    ExplanationAgent,
  ];
  let ctx: MatchingContext = {
    profile,
    candidates: [],
    scored: [],
    debugLog: [],
  };

  for (const agent of agents) {
    ctx = await agent.run(ctx);
  }

  ctx.scored.sort((a, b) => b.matchScore - a.matchScore);
  return ctx.scored;
}

export async function runMatching(
  criteria: StudentCriteria,
  onboarding?: OnboardingSnapshot | null
): Promise<CollegeMatch[]> {
  const profile = buildMatchingProfile(criteria, onboarding ?? null);
  return runMatchingAgents(profile);
}
