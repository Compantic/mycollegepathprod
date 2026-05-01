export const TOTAL_ONBOARDING_STEPS = 7;

export const STEP_CONFIG: Record<number, { title: string; description: string }> = {
  1: { title: "Identity & basics", description: "Photo, name, school, and graduation year" },
  2: { title: "Psychology & personal signals", description: "How you learn, socialize, and what drives you" },
  3: { title: "Career & academic direction", description: "Goals, majors, and study habits" },
  4: { title: "Academic strength", description: "GPA, tests, and rigor — critical for matching" },
  5: { title: "Activities & decision engine", description: "Extracurriculars, preferences, financials, and strategy" },
  6: { title: "Review your profile", description: "Confirm your answers before creating your account" },
  7: { title: "Create your account", description: "Sign up with Google or email to save your profile" },
};
