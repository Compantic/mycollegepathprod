import type { OnboardingSnapshot } from "@/lib/onboarding/types";
import type { DeadlineItem, DeadlinesPayload } from "./types";

type SavedCollege = { collegeId: string; name: string };

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function resolveGraduationYear(onboarding: OnboardingSnapshot | null | undefined): number {
  const fromAnswers =
    (typeof onboarding?.expectedGraduationYear === "number" && onboarding.expectedGraduationYear) ||
    (typeof onboarding?.graduationYear === "number" && onboarding.graduationYear) ||
    null;
  if (fromAnswers && fromAnswers >= 2020 && fromAnswers <= 2040) return fromAnswers;

  const now = new Date();
  // Default: rising senior / next spring class
  return now.getUTCFullYear() + (now.getUTCMonth() >= 6 ? 1 : 0);
}

/**
 * Fall of (gradYear - 1) is when ED/EA deadlines typically fall for a spring graduate.
 */
function cycleFallYear(gradYear: number): number {
  return gradYear - 1;
}

function strategyHints(onboarding: OnboardingSnapshot | null | undefined): string[] {
  const raw = onboarding?.applicationStrategy;
  if (!raw) return ["RD"];
  const list = Array.isArray(raw) ? raw : [raw];
  const normalized = list.map((x) => String(x).toUpperCase());
  const out: string[] = [];
  if (normalized.some((x) => x.includes("ED"))) out.push("ED");
  if (normalized.some((x) => x.includes("EA"))) out.push("EA");
  if (normalized.some((x) => x.includes("RD")) || normalized.some((x) => x.includes("NOT"))) out.push("RD");
  if (out.length === 0) out.push("RD");
  return out;
}

export function buildStudentDeadlines(args: {
  onboarding?: OnboardingSnapshot | null;
  savedColleges?: SavedCollege[];
}): DeadlinesPayload {
  const graduationYear = resolveGraduationYear(args.onboarding);
  const fallYear = cycleFallYear(graduationYear);
  const springYear = graduationYear;
  const strategies = strategyHints(args.onboarding);
  const colleges = (args.savedColleges ?? []).filter((c) => c.collegeId && c.name);

  const items: DeadlineItem[] = [
    {
      id: `common-app-open-${fallYear}`,
      title: "Common App opens",
      description: "Create or update your Common App account and start activity / essay drafts.",
      dueDate: isoDate(fallYear, 8, 1),
      kind: "application",
      verifyRequired: false,
      href: "https://www.commonapp.org/",
    },
    {
      id: `fafsa-open-${fallYear}`,
      title: "FAFSA opens",
      description: "Submit the Free Application for Federal Student Aid as early as possible.",
      dueDate: isoDate(fallYear, 10, 1),
      kind: "financial_aid",
      verifyRequired: true,
      href: "https://studentaid.gov/h/apply-for-aid/fafsa",
    },
    {
      id: `css-profile-${fallYear}`,
      title: "CSS Profile (if required)",
      description: "Many private colleges require CSS Profile in addition to FAFSA. Check each school.",
      dueDate: isoDate(fallYear, 10, 1),
      kind: "financial_aid",
      verifyRequired: true,
      href: "https://cssprofile.collegeboard.org/",
    },
    {
      id: `rec-letters-${fallYear}`,
      title: "Ask for recommendation letters",
      description: "Request teacher/counselor recommendations well before Early deadlines.",
      dueDate: isoDate(fallYear, 10, 15),
      kind: "recommendation",
      verifyRequired: false,
    },
  ];

  if (strategies.includes("ED")) {
    items.push({
      id: `ed-typical-${fallYear}`,
      title: "Early Decision (typical)",
      description: "Many ED I deadlines fall around Nov 1. Confirm each college’s exact date.",
      dueDate: isoDate(fallYear, 11, 1),
      kind: "application",
      verifyRequired: true,
    });
  }
  if (strategies.includes("EA")) {
    items.push({
      id: `ea-typical-${fallYear}`,
      title: "Early Action (typical)",
      description: "Many EA deadlines fall around Nov 1. Confirm each college’s exact date.",
      dueDate: isoDate(fallYear, 11, 1),
      kind: "application",
      verifyRequired: true,
    });
  }
  if (strategies.includes("RD") || strategies.length === 0) {
    items.push({
      id: `rd-typical-${springYear}`,
      title: "Regular Decision (typical)",
      description: "Many RD deadlines fall Jan 1–15. Confirm each college’s exact date.",
      dueDate: isoDate(springYear, 1, 1),
      kind: "application",
      verifyRequired: true,
    });
  }

  items.push(
    {
      id: `midyear-${springYear}`,
      title: "Mid-year reports",
      description: "Send mid-year grades / counselor reports if colleges request them.",
      dueDate: isoDate(springYear, 2, 1),
      kind: "application",
      verifyRequired: true,
    },
    {
      id: `decision-day-${springYear}`,
      title: "National College Decision Day",
      description: "Typical enrollment deposit deadline for many schools (May 1).",
      dueDate: isoDate(springYear, 5, 1),
      kind: "decision",
      verifyRequired: true,
    }
  );

  // Per-college verify rows — Scorecard does not publish official app deadlines.
  const strategyLabel = strategies.join(" / ");
  for (const college of colleges.slice(0, 25)) {
    const preferredDue =
      strategies.includes("ED") || strategies.includes("EA")
        ? isoDate(fallYear, 11, 1)
        : isoDate(springYear, 1, 1);
    items.push({
      id: `college-verify-${college.collegeId}`,
      title: `Verify deadlines: ${college.name}`,
      description: `Confirm ${strategyLabel} application, supplement, and aid deadlines on the official admissions site.`,
      dueDate: preferredDue,
      kind: "college_verify",
      collegeId: college.collegeId,
      collegeName: college.name,
      href: `/app/colleges/${college.collegeId}`,
      verifyRequired: true,
    });
  }

  items.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title));

  return {
    cycleLabel: `${fallYear}–${springYear} admissions cycle`,
    graduationYear,
    items,
    savedCollegeCount: colleges.length,
  };
}

export function splitDeadlinesByTime(items: DeadlineItem[], now = new Date()) {
  const today = isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const upcoming = items.filter((i) => i.dueDate >= today);
  const past = items.filter((i) => i.dueDate < today);
  return { upcoming, past, today };
}

function isoDateFromDate(d: Date): string {
  return isoDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export { isoDateFromDate };
