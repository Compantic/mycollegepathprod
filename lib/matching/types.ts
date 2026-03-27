export interface StudentCriteria {
  gpa?: number;
  satScore?: number;
  actScore?: number;
  preferredMajors?: string[];
  preferredStates?: string[];
  preferredSize?: "small" | "medium" | "large";
}

export type MatchTier = "reach" | "match" | "safety";

export interface CollegeMatch {
  id: number;
  name: string;
  city?: string;
  state?: string;
  admissionRate?: number;
  size?: number;
  satMidpoint?: number;
  actMidpoint?: number;
  /** 0–100 overall match score (one decimal); reflects GPA, test scores, selectivity, preferences */
  matchScore: number;
  tier: MatchTier;
  /** true when admission/SAT/ACT data was missing for this school */
  dataLimited?: boolean;
  /** Up to 3 short reason strings */
  reasons: string[];
  /** School-specific improvement tips */
  improveTips: string[];
  /**
   * Optional numeric breakdown of where the match score comes from (percentage points that
   * roughly sum to matchScore). Useful for debugging and for showing users which factors
   * matter most for this college.
   */
  factorBreakdown?: {
    /** Contribution from GPA vs school selectivity. */
    gpa?: number;
    /** Contribution from SAT alignment with the school's midpoint. */
    sat?: number;
    /** Contribution from ACT alignment with the school's midpoint. */
    act?: number;
    /** Contribution from being in a preferred state / region. */
    location?: number;
    /** Contribution from campus size fit. */
    size?: number;
    /** Contribution from the school's selectivity profile relative to preferences. */
    selectivity?: number;
    /** Contribution from activity depth / opportunities fit. */
    activities?: number;
    /** Contribution from personality / campus culture fit. */
    personality?: number;
  };
}

export interface MatchingRunResult {
  runId: string;
  matches: CollegeMatch[];
}
