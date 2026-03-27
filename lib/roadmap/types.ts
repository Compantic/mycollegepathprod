export interface RoadmapPhase {
  id: string;
  title: string;
  subtitle?: string;
  /** Short 1–2 sentence overview for this phase */
  phaseSummary?: string;
  timeframe: string;
  order: number;
  items: RoadmapItem[];
  focusArea?: string;
}

export interface RoadmapItem {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
  category?: "academic" | "extracurricular" | "testing" | "essays" | "applications" | "general";
}

export interface RoadmapGap {
  area: string;
  severity: "critical" | "important" | "optional";
  description: string;
  recommendation: string;
}

export interface RoadmapResult {
  phases: RoadmapPhase[];
  gaps: RoadmapGap[];
  summary: string;
  studentName?: string;
  graduationYear?: number;
}
