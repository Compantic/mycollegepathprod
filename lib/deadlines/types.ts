export type DeadlineKind =
  | "financial_aid"
  | "application"
  | "recommendation"
  | "college_verify"
  | "decision";

export type DeadlineItem = {
  id: string;
  title: string;
  description: string;
  /** ISO date YYYY-MM-DD (local calendar date, not timezone-shifted display). */
  dueDate: string;
  kind: DeadlineKind;
  collegeId?: string;
  collegeName?: string;
  href?: string;
  /** Official dates vary; always verify on the college site. */
  verifyRequired: boolean;
};

export type DeadlinesPayload = {
  cycleLabel: string;
  graduationYear: number | null;
  items: DeadlineItem[];
  savedCollegeCount: number;
};
