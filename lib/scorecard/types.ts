/** API returns flat keys like "school.name". We normalize to this shape. */
export interface ScorecardCollege {
  id: number;
  name: string;
  city?: string;
  state?: string;
  school_url?: string;
  location?: { lat: number; lon: number };
  locale?: number;
  ownership?: number;
  student?: { size?: number };
  admission?: { admission_rate?: number; sat_scores?: { midpoint?: { critical_reading?: number; math?: number; writing?: number } }; act_scores?: { midpoint?: { cumulative?: number } } };
  latest?: {
    student?: { size?: number };
    admission?: { admission_rate?: number };
    admissions?: {
      admission_rate?: { overall?: number };
      sat_scores?: {
        "25th_percentile"?: { critical_reading?: number; math?: number };
        "75th_percentile"?: { critical_reading?: number; math?: number };
      };
      act_scores?: {
        "25th_percentile"?: { cumulative?: number };
        "75th_percentile"?: { cumulative?: number };
      };
    };
    cost?: {
      tuition?: number;
      roomboard?: number;
      attendance_academic_year?: number;
      avg_net_price?: {
        overall?: number;
        by_income_level?: {
          "0-30000"?: number;
          "30001-48000"?: number;
          "48001-75000"?: number;
          "75001-110000"?: number;
          "110001-plus"?: number;
        };
      };
    };
    aid?: { median_debt?: { completers?: { monthly_payments?: number } } };
    earnings?: { "10_yrs_after_entry"?: { median?: number } };
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
  "school.locale"?: number;
  "school.ownership"?: number;
  "student.size"?: number;
  "admission.admission_rate"?: number;
  "admission.sat_scores.midpoint.critical_reading"?: number;
  "admission.sat_scores.midpoint.math"?: number;
  "admission.sat_scores.midpoint.writing"?: number;
  "admission.act_scores.midpoint.cumulative"?: number;
  "latest.student.size"?: number;
  "latest.admission.admission_rate"?: number;
  "latest.admissions.admission_rate.overall"?: number;
  "latest.admissions.sat_scores.25th_percentile.critical_reading"?: number;
  "latest.admissions.sat_scores.75th_percentile.critical_reading"?: number;
  "latest.admissions.sat_scores.25th_percentile.math"?: number;
  "latest.admissions.sat_scores.75th_percentile.math"?: number;
  "latest.admissions.act_scores.25th_percentile.cumulative"?: number;
  "latest.admissions.act_scores.75th_percentile.cumulative"?: number;
  "latest.cost.tuition.reported"?: number;
  "latest.cost.roomboard.reported"?: number;
  "latest.cost.attendance.academic_year"?: number;
  "latest.cost.avg_net_price.overall"?: number;
  "latest.cost.avg_net_price.by_income_level.0-30000"?: number;
  "latest.cost.avg_net_price.by_income_level.30001-48000"?: number;
  "latest.cost.avg_net_price.by_income_level.48001-75000"?: number;
  "latest.cost.avg_net_price.by_income_level.75001-110000"?: number;
  "latest.cost.avg_net_price.by_income_level.110001-plus"?: number;
  "latest.aid.median_debt.completers.monthly_payments"?: number;
  "latest.earnings.10_yrs_after_entry.median"?: number;
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
