import { searchSchools } from "@/lib/scorecard/client";
import type { ScorecardCollege } from "@/lib/scorecard/types";
import type { StudentCriteria, CollegeMatch, MatchTier, ComponentScores } from "./types";
import type { OnboardingSnapshot } from "@/lib/onboarding/types";
import { chatCompletion } from "@/lib/ai/openai";
import { z } from "zod";

const SIZE_SMALL = 5000;
const SIZE_LARGE = 15000;
const CANDIDATE_LIMIT = 500;
const PER_PAGE = 50;
const TOP_N = 10;

export interface DerivedMetrics {
  gpa: number | null;
  sat: number | null;
  act: number | null;
  testOptional: boolean;
  rigorScore: number;
  activityScore: number;
  budgetLimit: number | null;
  needsAid: boolean;
  preferredLocales: number[]; // 1=City, 2=Suburb, 3=Town, 4=Rural
  preferredOwnership: number | null; // 1=Public, 2=Private
  selectivityTarget: number;
  academicReadiness: number;
}

export interface MatchingProfile {
  criteria: StudentCriteria;
  onboarding: OnboardingSnapshot | null;
  derived: DerivedMetrics;
  weights: {
    wAcademic: number;
    wSelectivity: number;
    wFinancial: number;
    wGeographic: number;
    wLifestyle: number;
    wActivity: number;
  };
}

interface MatchingContext {
  profile: MatchingProfile;
  candidates: ScorecardCollege[];
  scored: CollegeMatch[];
}

interface MatchingAgent {
  name: string;
  run(ctx: MatchingContext): Promise<MatchingContext>;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
  if (!values.length) return 0;
  const variance = values.reduce((acc, v) => acc + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function parseBudget(budgetStr?: string): number | null {
  if (!budgetStr) return null;
  const num = parseInt(budgetStr.replace(/\D/g, ""), 10);
  if (!isNaN(num)) return num * 1000;
  return null;
}

function getSatTotal(c: ScorecardCollege): number | null {
  const sat = c.admission?.sat_scores?.midpoint;
  if (!sat) return null;
  return (sat.critical_reading ?? 0) + (sat.math ?? 0) + (sat.writing ?? 0);
}

function getAct(c: ScorecardCollege): number | null {
  return c.admission?.act_scores?.midpoint?.cumulative ?? null;
}

export function buildMatchingProfile(
  criteria: StudentCriteria,
  onboarding: OnboardingSnapshot | null
): MatchingProfile {
  const o = onboarding;

  const gpa = criteria.gpa ?? o?.gpa ?? null;
  const sat = criteria.satScore ?? o?.satTotal ?? o?.satScore ?? null;
  const act = criteria.actScore ?? o?.actComposite ?? o?.actScore ?? null;
  
  // Rigor
  const rigorousTotal = (o?.rigorousApCompleted ?? 0) + (o?.rigorousIbCompleted ?? 0) + (o?.rigorousHonorsCompleted ?? 0);
  const rigorScore = clamp01(rigorousTotal / 10);

  // Activities
  const activityCount = o?.activityTypes?.length ?? 0;
  const awardsCount = (o?.awardsSchool?.length ?? 0) + (o?.awardsState?.length ?? 0) + (o?.awardsNational?.length ?? 0) + (o?.awardsInternational?.length ?? 0);
  const activityDepth = clamp01(activityCount / 5);
  const activityAwards = clamp01(awardsCount / 4);
  const activityScore = clamp01(activityDepth * 0.6 + activityAwards * 0.4);

  // Financial
  const budgetLimit = parseBudget(o?.budgetPerYear);
  const needsAid = o?.fafsaEligibility === "Yes";

  // Preferences
  const preferredLocales: number[] = [];
  const campusPrefs = o?.campusUrbanSuburbanRural || [];
  if (campusPrefs.includes("Urban")) preferredLocales.push(11, 12, 13);
  if (campusPrefs.includes("Suburban")) preferredLocales.push(21, 22, 23);
  if (campusPrefs.includes("Rural")) preferredLocales.push(31, 32, 33, 41, 42, 43);

  let preferredOwnership: number | null = null;
  const sectorPrefs = o?.collegeSectorPreference || [];
  if (sectorPrefs.includes("Public")) preferredOwnership = 1;
  else if (sectorPrefs.includes("Private")) preferredOwnership = 2; // 2=private nonprofit

  // Selectivity expectation
  let selectivityTarget = 0.4;
  if (o?.selectivityImportance != null) {
      const p = clamp01(o.selectivityImportance / 10);
      selectivityTarget = 0.25 + (1 - p) * 0.35;
  }

  const derived: DerivedMetrics = {
    gpa, sat, act,
    testOptional: sat == null && act == null,
    rigorScore, activityScore,
    budgetLimit, needsAid,
    preferredLocales, preferredOwnership,
    selectivityTarget,
    academicReadiness: 0.5,
  };

  const gpaNorm = derived.gpa != null ? clamp01(derived.gpa / 4) : 0.5;
  const satNorm = derived.sat != null ? clamp01((derived.sat - 900) / 700) : 0.5;
  const actNorm = derived.act != null ? clamp01((derived.act - 16) / 20) : 0.5;
  const testNorm = derived.sat != null ? satNorm : derived.act != null ? actNorm : 0.5;
  derived.academicReadiness = clamp01((gpaNorm * 0.55) + (testNorm * 0.35) + (derived.rigorScore * 0.10));

  // Base Weights Setup
  let weights = {
    wAcademic: 0.34,
    wSelectivity: 0.22,
    wFinancial: 0.18,
    wGeographic: 0.12,
    wLifestyle: 0.08,
    wActivity: 0.06
  };

  if (budgetLimit && budgetLimit <= 20000) {
     weights.wFinancial += 0.12;
     weights.wGeographic -= 0.03;
     weights.wLifestyle -= 0.04;
  }
  
  if (derived.testOptional && !derived.gpa) {
      weights.wAcademic -= 0.08;
      weights.wGeographic += 0.02;
      weights.wSelectivity -= 0.06;
      weights.wActivity += 0.12;
  }

  // Normalize weights
  const sumWeights = weights.wAcademic + weights.wSelectivity + weights.wFinancial + weights.wGeographic + weights.wLifestyle + weights.wActivity;
  weights = {
    wAcademic: weights.wAcademic / sumWeights,
    wSelectivity: weights.wSelectivity / sumWeights,
    wFinancial: weights.wFinancial / sumWeights,
    wGeographic: weights.wGeographic / sumWeights,
    wLifestyle: weights.wLifestyle / sumWeights,
    wActivity: weights.wActivity / sumWeights
  };

  return {
    criteria: {
        ...criteria,
        preferredStates: criteria.preferredStates ?? o?.preferredStates ?? o?.locationPreferenceStates,
        preferredMajors: criteria.preferredMajors ?? o?.areasOfInterest,
        preferredSize: criteria.preferredSize ?? o?.preferredSize,
    },
    onboarding: o ?? null,
    derived,
    weights
  };
}

const ProfileSetupAgent: MatchingAgent = {
  name: "profile-setup",
  async run(ctx) {
      return ctx; // Profile setup done entirely in buildMatchingProfile
  }
};

const CandidateCollectorAgent: MatchingAgent = {
  name: "candidate-collector",
  async run(ctx) {
    const { criteria, derived } = ctx.profile;
    const all: ScorecardCollege[] = [];
    const seen = new Set<number>();

    const preferredStates = criteria.preferredStates && criteria.preferredStates.length > 0 ? criteria.preferredStates : null;
    
    const pushUnique = (results: ScorecardCollege[]) => {
      for (const c of results) {
        if (derived.preferredOwnership != null && c.ownership != null) {
            if (derived.preferredOwnership === 1 && c.ownership !== 1) continue;
            if (derived.preferredOwnership === 2 && c.ownership === 1) continue;
        }
        if (!seen.has(c.id)) {
          seen.add(c.id);
          all.push(c);
        }
      }
    };

    // Fallback states if none specified: do a national search
    if (!preferredStates || preferredStates.length === 0) {
      // Fetch top 4 pages concurrently for speed
      const queries = [0, 1, 2, 3].map(page => searchSchools({
          per_page: PER_PAGE,
          page,
          "school.degrees_awarded.predominant": "3"
      }));
      const resultsArray = await Promise.allSettled(queries);
      for (const res of resultsArray) {
         if (res.status === "fulfilled" && res.value?.results) {
             pushUnique(res.value.results);
         }
      }
      return { ...ctx, candidates: all };
    }

    const maxStates = 10;
    // For each state, fetch page 0 and 1 concurrently to quickly get up to 100 schools per state
    for (const state of preferredStates.slice(0, maxStates)) {
      const queries = [0, 1].map(page => searchSchools({
        per_page: PER_PAGE,
        page,
        "school.degrees_awarded.predominant": "3",
        "school.state": state,
      }));
      const resultsArray = await Promise.allSettled(queries);
      for (const res of resultsArray) {
         if (res.status === "fulfilled" && res.value?.results) {
             pushUnique(res.value.results);
         }
      }
      if (all.length >= CANDIDATE_LIMIT) break;
    }

    return { ...ctx, candidates: all };
  }
};

function assignTier(c: ScorecardCollege, derived: DerivedMetrics): MatchTier {
    const rate = c.latest?.admission?.admission_rate ?? c.admission?.admission_rate;
    if (rate == null) return "match";
    const satTotal = getSatTotal(c);
    const act = getAct(c);
    
    const studentAboveMidpoint =
      (derived.sat != null && satTotal != null && derived.sat >= satTotal - 20) ||
      (derived.act != null && act != null && derived.act >= act - 1) ||
      (derived.gpa != null && derived.gpa >= 3.8);

    if (rate <= 0.20 || (rate <= 0.35 && !studentAboveMidpoint)) return "reach";
    if (rate >= 0.60 && studentAboveMidpoint) return "safety";
    return "match";
}

const CoreScoringAgent: MatchingAgent = {
  name: "core-scoring",
  async run(ctx) {
      const { criteria, derived, weights } = ctx.profile;

      const scored: CollegeMatch[] = ctx.candidates.map((c) => {
          let missingDataParams = 0;
          let totalDataParams = 0;

          // 1. Academic Fit
          let academicFit = 0.5;
          let academicReasons: string[] = [];
          const rate = c.latest?.admission?.admission_rate ?? c.admission?.admission_rate;
          const satTotal = getSatTotal(c);
          const act = getAct(c);

          totalDataParams += 3; // (Rate, SAT, ACT)
          
          let academicPoints = 0;
          let academicCount = 0;

          if (derived.sat != null && satTotal != null) {
              const diff = derived.sat - satTotal;
              const val = clamp01(0.5 + (diff / 200)); 
              academicPoints += val;
              academicCount++;
              if (diff >= 50) academicReasons.push("Strong SAT safely above typical admitted student");
              else if (diff >= -50) academicReasons.push("SAT highly aligned with typical student");
          } else if (derived.sat) missingDataParams++;

          if (derived.act != null && act != null) {
              const diff = derived.act - act;
              const val = clamp01(0.5 + (diff / 6));
              academicPoints += val;
              academicCount++;
              if (diff >= 2) academicReasons.push("ACT safely above midpoint");
          } else if (derived.act) missingDataParams++;

          if (derived.gpa != null && rate != null) {
              const selectivityFactor = 1 - rate; // 0.0 to 0.95
              const gpaNorm = clamp01(derived.gpa / 4);
              const diff = gpaNorm - selectivityFactor;
              const val = clamp01(0.5 + diff);
              academicPoints += val;
              academicCount++;
          } else if (derived.gpa) {
              // using rigor as fallback
              academicPoints += 0.5 + (derived.rigorScore * 0.2);
              academicCount++;
              missingDataParams++;
          }
          
          if (academicCount > 0) academicFit = clamp01((academicPoints / academicCount) + (derived.rigorScore * 0.05));
          if (academicCount === 0 && rate != null) {
              academicFit = clamp01(0.2 + rate);
          }

          // 2. Selectivity Fit (Target/Appetite)
          let selectivityFit = 0.5;
          let selectivityReasons: string[] = [];
          if (rate != null) {
              const diff = Math.abs(rate - derived.selectivityTarget);
              const appetiteFit = clamp01(1 - (diff * 1.7));
              const schoolSelectivity = clamp01(1 - rate);
              const readinessGap = Math.abs(derived.academicReadiness - schoolSelectivity);
              const readinessFit = clamp01(1 - (readinessGap * 1.6));
              selectivityFit = clamp01((appetiteFit * 0.45) + (readinessFit * 0.55));
              if (rate < 0.25) selectivityReasons.push("Highly selective institution");
          } else {
              missingDataParams++;
          }

          // 3. Financial Fit
          let financialFit = 0.5; // neutral if no budget specified
          let financialReasons: string[] = [];
          const cost = c.latest?.cost?.attendance_academic_year ?? c.latest?.cost?.tuition ?? null;
          
          if (derived.budgetLimit != null) {
              if (cost != null) {
                  totalDataParams++;
                  // if cost <= budget, score is high. if cost > budget, score drops fast unless FAFSA
                  const diff = cost - derived.budgetLimit;
                  if (diff <= 0) {
                      financialFit = 1.0;
                      financialReasons.push("Well within your annual budget");
                  } else {
                      let cushion = derived.needsAid ? 15000 : 5000;
                      if (diff <= cushion) {
                          financialFit = clamp01(0.8 - (diff / cushion) * 0.3);
                          financialReasons.push("Slightly above budget, but financial aid may bridge the gap");
                      } else {
                          financialFit = clamp01(0.3 - (diff / 30000));
                          financialReasons.push("Cost of attendance is significantly above your target budget");
                      }
                  }
              } else {
                  missingDataParams++;
              }
          }

          // 4. Geographic Fit
          let geographicFit = 0.5;
          let geoReasons: string[] = [];
          const prefStates = criteria.preferredStates ?? [];
          if (prefStates.length > 0 && c.state) {
              if (prefStates.includes(c.state)) {
                  geographicFit = 1.0;
                  geoReasons.push(`Located in your preferred state (${c.state})`);
              } else {
                  geographicFit = 0.15;
              }
          }

          // 5. Lifestyle / Campus Fit
          let lifestyleFit = 0.5;
          let lifeReasons: string[] = [];
          let lifePoints = 0;
          let lifeCount = 0;
          
          const size = c.latest?.student?.size ?? c.student?.size;

          if (criteria.preferredSize && size != null) {
              const isSmall = size < SIZE_SMALL;
              const isLarge = size > SIZE_LARGE;
              const isMed = !isSmall && !isLarge;
              if (criteria.preferredSize === "small" && isSmall) lifePoints += 1.0;
              else if (criteria.preferredSize === "large" && isLarge) lifePoints += 1.0;
              else if (criteria.preferredSize === "medium" && isMed) lifePoints += 1.0;
              else lifePoints += 0.3; // Mismatch penalty
              lifeCount++;
          }

          if (derived.preferredLocales.length > 0 && c.locale != null) {
              const match = derived.preferredLocales.some(pl => Math.floor(c.locale! / 10) === Math.floor(pl / 10));
              if (match) {
                 lifePoints += 1.0;
                 if (c.locale < 20) lifeReasons.push("Urban campus environment");
                 else if (c.locale < 30) lifeReasons.push("Suburban campus setting");
                 else lifeReasons.push("Rural/Town campus setting");
              } else {
                 lifePoints += 0.4;
              }
              lifeCount++;
          }
          if (lifeCount > 0) lifestyleFit = lifePoints / lifeCount;

          // 6. Activity Fit
          let activityFit = 0.5;
          if (size != null) {
              // Proxies: Larger schools have more clubs. If student depth is high, large school fits well. If low, doesn't matter.
              if (derived.activityScore > 0.6) {
                 activityFit = clamp01(0.5 + (size / 30000));
              } else {
                 activityFit = 0.7; // Not demanding
              }
          }

          // Compositing Score
          const compScores: ComponentScores = {
              academic: academicFit,
              selectivity: selectivityFit,
              financial: financialFit,
              geographic: geographicFit,
              lifestyle: lifestyleFit,
              activity: activityFit
          };

          const rawScore = 
              (academicFit * weights.wAcademic) +
              (selectivityFit * weights.wSelectivity) +
              (financialFit * weights.wFinancial) +
              (geographicFit * weights.wGeographic) +
              (lifestyleFit * weights.wLifestyle) +
              (activityFit * weights.wActivity);

          let eligibilityPenalty = 1.0;
          if ((criteria.preferredStates ?? []).length > 0 && c.state && !(criteria.preferredStates ?? []).includes(c.state)) {
            eligibilityPenalty *= 0.78;
          }
          if (derived.budgetLimit != null && cost != null) {
            const overBudget = Math.max(0, cost - derived.budgetLimit);
            if (overBudget > 25000) eligibilityPenalty *= derived.needsAid ? 0.80 : 0.68;
            else if (overBudget > 12000) eligibilityPenalty *= derived.needsAid ? 0.90 : 0.80;
          }

          const adjustedRaw = clamp01(rawScore * eligibilityPenalty);
          let finalPercentage = adjustedRaw * 100;
          const confidenceScore = Math.max(35, 100 - (missingDataParams * 10));

          const allReasons = [...academicReasons, ...financialReasons, ...geoReasons, ...lifeReasons, ...selectivityReasons];
          
          return {
              id: c.id,
              name: c.name ?? "Unknown",
              city: c.city,
              state: c.state,
              admissionRate: rate,
              size: size,
              satMidpoint: satTotal ?? undefined,
              actMidpoint: act ?? undefined,
              costAttendance: cost ?? undefined,
              locale: c.locale,
              ownership: c.ownership,
              
              matchScore: finalPercentage,
              rawScore: Math.round(adjustedRaw * 1000) / 10,
              confidenceScore,
              tier: assignTier(c, derived),
              
              dataLimited: confidenceScore < 80,
              reasons: allReasons.slice(0, 4),
              improveTips: [], // AI handles this
              componentScores: compScores,
              
              // Frontend backwards compatibility
              factorBreakdown: {
                  gpa: Math.round(compScores.academic * weights.wAcademic * 100),
                  sat: 0,
                  act: 0,
                  location: Math.round(compScores.geographic * weights.wGeographic * 100),
                  size: Math.round(compScores.lifestyle * weights.wLifestyle * 100),
                  selectivity: Math.round(compScores.selectivity * weights.wSelectivity * 100),
                  activities: Math.round(compScores.activity * weights.wActivity * 100),
                  personality: 0,
                  budget: Math.round(compScores.financial * weights.wFinancial * 100),
                  gating: Math.round((eligibilityPenalty - 1) * 100)
              }
          };
      });

      return { ...ctx, scored };
  }
};

const ScoreCalibrationAgent: MatchingAgent = {
  name: "score-calibration",
  async run(ctx) {
    if (!ctx.scored.length) return ctx;

    const raw = ctx.scored.map((m) => m.matchScore);
    const min = Math.min(...raw);
    const max = Math.max(...raw);
    const avg = mean(raw);
    const sd = stdDev(raw, avg) || 1;
    const range = Math.max(1, max - min);

    const ranked = [...ctx.scored].sort((a, b) => b.matchScore - a.matchScore);
    const rankById = new Map<number, number>();
    ranked.forEach((m, idx) => rankById.set(m.id, idx));

    const calibrated = ctx.scored.map((m) => {
      const base = m.matchScore;
      const minMax = (base - min) / range;
      const z = (base - avg) / sd;
      const zScaled = logistic(z * 1.35);
      const rank = rankById.get(m.id) ?? 0;
      const percentile = 1 - rank / Math.max(1, ctx.scored.length - 1);

      const blended = clamp01(0.25 * minMax + 0.25 * zScaled + 0.50 * percentile);
      const confidenceFactor = 0.72 + (m.confidenceScore / 100) * 0.28;
      const limitedDataPenalty = m.dataLimited ? 0.88 : 1;
      const deterministicJitter = (((m.id % 17) - 8) * 0.11);
      const mapped = (25 + blended * 70) * confidenceFactor * limitedDataPenalty + deterministicJitter;
      const nextScore = Math.round(clamp01(mapped / 100) * 1000) / 10;

      return { ...m, matchScore: nextScore, calibratedScore: nextScore };
    });

    return { ...ctx, scored: calibrated };
  },
};

const ExplanationsAgent: MatchingAgent = {
  name: "explain-matches",
  async run(ctx) {
      if (!ctx.scored.length) return ctx;

      // Sort mathematically
      ctx.scored.sort((a,b) => b.matchScore - a.matchScore);
      const topN = ctx.scored.slice(0, TOP_N);

      // We use OpenAI to generate reasons, tips, and evaluate major fit deterministically.
      let parsedList: any[] = [];
      
      const aiSchoolSchema = z.object({
        id: z.number(),
        whyFit: z.string().optional().default("Aligned with numerical academic & financial fit."),
        reasons: z.array(z.string()).optional().default([]),
        improveTips: z.array(z.string()).optional().default([]),
        majorAlignmentScore: z.number().optional().default(50)
      });
      const aiResponseSchema = z.array(aiSchoolSchema);

      function toCandidateObject(item: unknown): Record<string, unknown> | null {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          return item as Record<string, unknown>;
        }
        if (typeof item === "string") {
          const trimmed = item.trim();
          if (!trimmed) return null;
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              return parsed as Record<string, unknown>;
            }
          } catch {
            // If model returns plain text instead of JSON, keep it as a fallback reason.
            return { whyFit: trimmed };
          }
        }
        return null;
      }

      function normalizeAiList(list: unknown[], topSchools: CollegeMatch[]): Record<string, unknown>[] {
        const byIndexOrId: Record<string, unknown>[] = [];
        list.forEach((item, idx) => {
          const obj = toCandidateObject(item);
          if (!obj) return;
          const resolvedId =
            typeof obj.id === "number"
              ? obj.id
              : topSchools[idx]?.id;
          if (typeof resolvedId !== "number") return;
          byIndexOrId.push({
            id: resolvedId,
            whyFit: typeof obj.whyFit === "string" ? obj.whyFit : undefined,
            reasons: Array.isArray(obj.reasons) ? obj.reasons : undefined,
            improveTips: Array.isArray(obj.improveTips) ? obj.improveTips : undefined,
            majorAlignmentScore:
              typeof obj.majorAlignmentScore === "number"
                ? obj.majorAlignmentScore
                : undefined,
          });
        });
        return byIndexOrId;
      }

      const prompt = {
        student: {
          gpa: ctx.profile.derived.gpa,
          sat: ctx.profile.derived.sat,
          budget: ctx.profile.derived.budgetLimit,
          majors: ctx.profile.criteria.preferredMajors
        },
        schools: topN.map(c => ({
          id: c.id,
          name: c.name,
          matchScore: c.matchScore,
          tier: c.tier,
          admissionRate: c.admissionRate,
          state: c.state
        })),
        instructions: "Return a JSON object array. Your output MUST be EXACTLY an array of JSON objects `[{...}]` matching the id. For each, give 'whyFit' (2 sentences explaining fit), 'reasons' (2 bullet points), 'improveTips' (2 actionable admissions tips), and MOST IMPORTANTLY 'majorAlignmentScore' (int 0-100 indicating how well the school is known for the student's preferred majors; 50 if no preferred majors or unknown)."
      };

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const completion = await chatCompletion([
            { role: "system", content: "You are a college counselor generating explanatory text in strict JSON array format. DO NOT WRAP in a markdown block." },
            { role: "user", content: JSON.stringify(prompt) }
          ], { 
            model: process.env.OPENAI_MATCHING_MODEL ?? "gpt-5.5",
            temperature: 0.3,
            response_format: { type: "json_object" } 
          });

          if (completion?.content) {
            const text = Array.isArray(completion.content) 
              ? completion.content.map((p) => typeof p === "string" ? p : "").join("") 
              : String(completion.content);
            const cleaned = text.replace(/^```json?\s*|\s*```$/g, "").trim();
            // Wrap in an object if the API returns an array directly despite instruction, or extract if wrapped.
            let parsed = JSON.parse(cleaned);
            let extractedList: any[] = [];
            if (!Array.isArray(parsed) && parsed.schools && Array.isArray(parsed.schools)) {
               extractedList = parsed.schools;
            } else if (!Array.isArray(parsed) && parsed.results && Array.isArray(parsed.results)) {
               extractedList = parsed.results;
            } else if (Array.isArray(parsed)) {
               extractedList = parsed;
            } else if (typeof parsed === 'object') {
               const val = Object.values(parsed).find(Array.isArray);
               if (val) extractedList = val;
            }
            
            const normalizedList = normalizeAiList(extractedList, topN);
            // Zod Schema Validation
            const validationResult = aiResponseSchema.safeParse(normalizedList);
            if (validationResult.success && validationResult.data.length > 0) {
               parsedList = validationResult.data;
               break; // Success
            } else if (!validationResult.success) {
               console.error("Zod Validation Failed:", validationResult.error);
               // Retry the loop
            }
          }
        } catch (e) {
             if (attempt === 1) {
                // Silently fail explanation string parsing on last attempt
                console.error("ExplanationsAgent error:", e);
             }
        }
      }

      if (Array.isArray(parsedList) && parsedList.length > 0) {
        for (const school of topN) {
          const matchOutput = parsedList.find((p: any) => p.id === school.id);
          if (matchOutput) {
             school.reasons = [matchOutput.whyFit, ...(matchOutput.reasons || [])].filter(Boolean);
             school.improveTips = matchOutput.improveTips || [];
             
             // Integrate Major Alignment Score structurally without breaking compression
             const majorScore = typeof matchOutput.majorAlignmentScore === "number" ? matchOutput.majorAlignmentScore : 50;
             school.factorBreakdown = school.factorBreakdown || {};
             school.factorBreakdown.major = majorScore;

             // Only apply major scaling if the student actually listed majors
             if (ctx.profile.criteria.preferredMajors && ctx.profile.criteria.preferredMajors.length > 0) {
                 // Blend 15% major fit linearly
                 const newRaw = Math.max(0, Math.min(100, (school.matchScore * 0.85) + (majorScore * 0.15)));
                 school.matchScore = Math.round(newRaw * 10) / 10;
             }
          }
        }
        // Resort mathematically after major score modification to keep deterministic ranking strictly descending
        ctx.scored.sort((a,b) => b.matchScore - a.matchScore);
      }

      return {
          ...ctx,
          scored: [...ctx.scored].sort((a, b) => {
            if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
            const majorDelta = (b.factorBreakdown?.major ?? 50) - (a.factorBreakdown?.major ?? 50);
            if (majorDelta !== 0) return majorDelta;
            const costA = a.costAttendance ?? Number.MAX_SAFE_INTEGER;
            const costB = b.costAttendance ?? Number.MAX_SAFE_INTEGER;
            if (costA !== costB) return costA - costB;
            return a.id - b.id;
          })
      };
  }
};

const FinalScoreSpreadAgent: MatchingAgent = {
  name: "final-score-spread",
  async run(ctx) {
    if (!ctx.scored.length) return ctx;

    const sorted = [...ctx.scored].sort((a, b) => b.matchScore - a.matchScore);
    const n = sorted.length;
    if (n === 1) {
      const only = sorted[0];
      const boosted = Math.min(95, Math.max(55, only.matchScore));
      return {
        ...ctx,
        scored: [{ ...only, matchScore: Math.round(boosted * 10) / 10 }],
      };
    }

    const topRaw = Math.max(...sorted.map((m) => m.rawScore ?? m.matchScore));
    const targetTop = topRaw >= 80 ? 95 : topRaw >= 70 ? 93 : topRaw >= 60 ? 89 : 85;
    const targetBottom = Math.max(58, targetTop - 30);
    const targetRange = targetTop - targetBottom;

    const remapped = sorted.map((m, idx) => {
      const rankRatio = idx / Math.max(1, n - 1);
      const curvedRatio = Math.pow(rankRatio, 0.9);
      const rankTarget = targetTop - targetRange * curvedRatio;
      const blended = (m.matchScore * 0.2) + (rankTarget * 0.8);
      const limitedCap = m.dataLimited ? 88 : 96;
      const next = Math.min(limitedCap, Math.max(45, blended));
      return { ...m, matchScore: Math.round(next * 10) / 10 };
    });

    // Keep strictly descending for stable UX.
    for (let i = 1; i < remapped.length; i++) {
      if (remapped[i].matchScore >= remapped[i - 1].matchScore) {
        remapped[i].matchScore = Math.max(40, Math.round((remapped[i - 1].matchScore - 0.1) * 10) / 10);
      }
    }

    return { ...ctx, scored: remapped };
  },
};

export async function runMatching(
  criteria: StudentCriteria,
  onboarding?: OnboardingSnapshot | null
): Promise<CollegeMatch[]> {
  const profile = buildMatchingProfile(criteria, onboarding ?? null);
  
  const agents: MatchingAgent[] = [
      ProfileSetupAgent,
      CandidateCollectorAgent,
      CoreScoringAgent,
      ScoreCalibrationAgent,
      ExplanationsAgent,
      FinalScoreSpreadAgent
  ];

  let ctx: MatchingContext = {
      profile,
      candidates: [],
      scored: []
  };

  for (const agent of agents) {
      ctx = await agent.run(ctx);
  }

  return ctx.scored.slice(0, TOP_N);
}
