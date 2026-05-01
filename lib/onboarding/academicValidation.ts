import type { OnboardingAnswers } from "./schema";

function inRange(value: number | undefined, min: number, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value < min || value > max) return undefined;
  return value;
}

function inIntegerRange(value: number | undefined, min: number, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value)) return undefined;
  if (value < min || value > max) return undefined;
  return value;
}

export function normalizeAcademicAnswers(answers: OnboardingAnswers): OnboardingAnswers {
  const out: OnboardingAnswers = { ...answers };

  if (out.gpaScale !== 4 && out.gpaScale !== 5) {
    out.gpaScale = undefined;
  }

  const gpaMax = out.gpaScale ?? 5;
  out.gpa = inRange(out.gpa, 0, gpaMax);

  out.psatTotal = inIntegerRange(out.psatTotal, 320, 1520);
  out.satReadingWriting = inIntegerRange(out.satReadingWriting, 200, 800);
  out.satMath = inIntegerRange(out.satMath, 200, 800);

  if (out.satReadingWriting != null && out.satMath != null) {
    const computedSat = out.satReadingWriting + out.satMath;
    out.satTotal = inIntegerRange(computedSat, 400, 1600);
  } else {
    out.satTotal = inIntegerRange(out.satTotal, 400, 1600);
  }

  out.actComposite = inIntegerRange(out.actComposite, 1, 36);
  out.actEnglish = inIntegerRange(out.actEnglish, 1, 36);
  out.actMath = inIntegerRange(out.actMath, 1, 36);
  out.actReading = inIntegerRange(out.actReading, 1, 36);
  out.actScience = inIntegerRange(out.actScience, 1, 36);

  out.apExamsCount = inIntegerRange(out.apExamsCount, 0, 99);
  out.apAverageScore = inRange(out.apAverageScore, 1, 5);
  out.ibTotal = inIntegerRange(out.ibTotal, 1, 45);
  out.toeflScore = inIntegerRange(out.toeflScore, 0, 120);
  out.ieltsScore = inRange(out.ieltsScore, 0, 9);
  out.duolingoScore = inIntegerRange(out.duolingoScore, 10, 160);
  out.pteScore = inIntegerRange(out.pteScore, 10, 90);

  out.rigorousApCompleted = inIntegerRange(out.rigorousApCompleted, 0, 99);
  out.rigorousApThisYear = inIntegerRange(out.rigorousApThisYear, 0, 99);
  out.rigorousIbCompleted = inIntegerRange(out.rigorousIbCompleted, 0, 99);
  out.rigorousIbThisYear = inIntegerRange(out.rigorousIbThisYear, 0, 99);
  out.rigorousHonorsCompleted = inIntegerRange(out.rigorousHonorsCompleted, 0, 99);
  out.rigorousHonorsThisYear = inIntegerRange(out.rigorousHonorsThisYear, 0, 99);

  out.satScore = out.satTotal;
  out.actScore = out.actComposite;

  return out;
}
