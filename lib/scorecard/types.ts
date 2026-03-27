/** API returns flat keys like "school.name". We normalize to this shape. */
export interface ScorecardCollege {
  id: number;
  name: string;
  city?: string;
  state?: string;
  school_url?: string;
  location?: { lat: number; lon: number };
  student?: { size?: number };
  admission?: { admission_rate?: number; sat_scores?: { midpoint?: { critical_reading?: number; math?: number; writing?: number } }; act_scores?: { midpoint?: { cumulative?: number } } };
  latest?: {
    student?: { size?: number };
    admission?: { admission_rate?: number };
    cost?: { tuition?: number; roomboard?: number };
  };
  /** Average GPA of enrolled students (if API provides). */
  avgGpa?: number;
  [key: string]: unknown;
}

/** Raw API result row (dot-notation keys) */
export interface ScorecardRow {
  id: number;
  "school.name"?: string;
  "school.city"?: string;
  "school.state"?: string;
  "school.school_url"?: string;
  "school.location"?: { lat: number; lon: number };
  "student.size"?: number;
  "admission.admission_rate"?: number;
  "admission.sat_scores.midpoint.critical_reading"?: number;
  "admission.sat_scores.midpoint.math"?: number;
  "admission.sat_scores.midpoint.writing"?: number;
  "admission.act_scores.midpoint.cumulative"?: number;
  "latest.student.size"?: number;
  "latest.admission.admission_rate"?: number;
  "latest.cost.tuition.reported"?: number;
  "latest.cost.roomboard.reported"?: number;
  [key: string]: unknown;
}

export interface ScorecardSearchParams {
  schoolname?: string;
  "school.degrees_awarded.predominant"?: string; // 1,2,3,4
  "school.degrees_awarded.highest"?: string;
  "school.region_id"?: string;
  "school.state"?: string;
  per_page?: number;
  page?: number;
  fields?: string;
}

export interface ScorecardSearchResponse {
  results?: ScorecardCollege[];
  metadata?: { total?: number; page?: number; per_page?: number };
}
