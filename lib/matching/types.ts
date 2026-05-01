import type { ScorecardCollege } from "@/lib/scorecard/types";

export interface StudentCriteria {
  gpa?: number;
  satScore?: number;
  actScore?: number;
  preferredMajors?: string[];
  preferredStates?: string[];
  preferredSize?: "small" | "medium" | "large";
}

export type MatchTier = "reach" | "match" | "safety";

export interface ComponentScores {
  academic: number;
  selectivity: number;
  financial: number;
  geographic: number;
  lifestyle: number;
  activity: number;
}

export interface CollegeMatch {
  id: number;
  name: string;
  city?: string;
  state?: string;
  admissionRate?: number;
  size?: number;
  satMidpoint?: number;
  actMidpoint?: number;
  costAttendance?: number;
  locale?: number;
  ownership?: number;
  
  matchScore: number;
  /** Deterministic weighted score before global calibration. */
  rawScore?: number;
  /** Score after global calibration pass, before explanation adjustments. */
  calibratedScore?: number;
  confidenceScore: number;
  tier: MatchTier;
  
  dataLimited?: boolean;
  reasons: string[];
  improveTips: string[];
  
  componentScores?: ComponentScores;
  
  // Frontend/legacy fallback mapping for visuals
  factorBreakdown?: {
    gpa?: number;
    sat?: number;
    act?: number;
    location?: number;
    size?: number;
    selectivity?: number;
    activities?: number;
    personality?: number;
    budget?: number; // added for new financial support
    major?: number; // AI-assigned major fit 
  };
}

export interface MatchingRunResult {
  runId: string;
  matches: CollegeMatch[];
}
