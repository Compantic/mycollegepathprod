"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveOnboardingDraft, getOnboardingDraft, persistOnboardingToFirestore } from "@/lib/onboarding/storage";
import { auth } from "@/lib/firebase/client";
import type { CareerPath, TargetDegree, KnowCoursesStandOut, InterestCategory } from "@/lib/onboarding/schema";
import { STEP_CONFIG } from "@/lib/onboarding/stepConfig";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase } from "lucide-react";

const CAREER_OPTS: { value: CareerPath; label: string }[] = [
  { value: "Yes", label: "Yes" },
  { value: "Not sure", label: "Not sure" },
  { value: "No", label: "No" },
];

const INTEREST_CATEGORIES: { value: InterestCategory; label: string }[] = [
  { value: "STEM", label: "STEM" },
  { value: "Health", label: "Health" },
  { value: "Business", label: "Business" },
  { value: "Humanities", label: "Humanities" },
  { value: "Social Sciences", label: "Social Sciences" },
  { value: "Arts", label: "Arts" },
  { value: "Education", label: "Education" },
  { value: "Other", label: "Other" },
];

const TARGET_DEGREE_OPTS: { value: TargetDegree; label: string }[] = [
  { value: "MA", label: "MA" },
  { value: "MS", label: "MS" },
  { value: "GD", label: "GD" },
  { value: "LLM", label: "LLM" },
  { value: "PHD", label: "PHD" },
  { value: "Ed.D", label: "Ed.D" },
  { value: "MD", label: "MD" },
  { value: "DO", label: "DO" },
  { value: "DDS", label: "DDS" },
  { value: "DVM", label: "DVM" },
  { value: "Not sure", label: "Not sure" },
];

const KNOW_COURSES_OPTS: { value: KnowCoursesStandOut; label: string }[] = [
  { value: "Yes", label: "Yes" },
  { value: "Somewhat", label: "Somewhat" },
  { value: "No", label: "No" },
];

function OnboardingStep3Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProfile = searchParams.get("from") === "profile";
  const [careerPath, setCareerPath] = useState<CareerPath | "">("");
  const [careerPathWhat, setCareerPathWhat] = useState("");
  const [careerConfidence, setCareerConfidence] = useState<number | "">("");
  const [areasOfInterest, setAreasOfInterest] = useState<InterestCategory[]>([]);
  const [interestOther, setInterestOther] = useState("");
  const [targetDegree, setTargetDegree] = useState<TargetDegree | "">("");
  const [knowCoursesStandOut, setKnowCoursesStandOut] = useState<KnowCoursesStandOut | "">("");
  const [knowActivitiesStandOut, setKnowActivitiesStandOut] = useState<number | "">("");
  const [studySkillsConfidence, setStudySkillsConfidence] = useState<number | "">("");
  const [focusDifficulty, setFocusDifficulty] = useState<number | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const d = getOnboardingDraft();
    if (d.careerPath) setCareerPath(d.careerPath);
    if (d.careerPathWhat) setCareerPathWhat(d.careerPathWhat);
    if (d.careerConfidence != null) setCareerConfidence(d.careerConfidence);
    if (d.areasOfInterest?.length) setAreasOfInterest(d.areasOfInterest);
    if (d.interestOther) setInterestOther(d.interestOther);
    if (d.targetDegree) setTargetDegree(d.targetDegree);
    if (d.knowCoursesStandOut) setKnowCoursesStandOut(d.knowCoursesStandOut);
    if (d.knowActivitiesStandOut != null) setKnowActivitiesStandOut(d.knowActivitiesStandOut);
    if (d.studySkillsConfidence != null) setStudySkillsConfidence(d.studySkillsConfidence);
    if (d.focusDifficulty != null) setFocusDifficulty(d.focusDifficulty);
  }, []);

  function toggleInterest(cat: InterestCategory) {
    setAreasOfInterest((prev) => (prev.includes(cat) ? prev.filter((x) => x !== cat) : [...prev, cat]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (careerPath === "Yes" && !careerPathWhat.trim()) err.careerPathWhat = "Please describe your career path.";
    if (areasOfInterest.length === 0) err.areasOfInterest = "Select at least one intended major area.";
    setErrors(err);
    if (Object.keys(err).length) return;

    const conf = careerConfidence === "" ? undefined : Math.min(10, Math.max(1, Number(careerConfidence)));
    const act = knowActivitiesStandOut === "" ? undefined : Math.min(10, Math.max(1, Number(knowActivitiesStandOut)));
    const study = studySkillsConfidence === "" ? undefined : Math.min(10, Math.max(1, Number(studySkillsConfidence)));
    const focus = focusDifficulty === "" ? undefined : Math.min(10, Math.max(1, Number(focusDifficulty)));

    saveOnboardingDraft({
      careerPath: careerPath || undefined,
      careerPathWhat: careerPathWhat.trim() || undefined,
      careerConfidence: conf,
      areasOfInterest,
      interestOther: interestOther.trim() || undefined,
      targetDegree: targetDegree || undefined,
      knowCoursesStandOut: knowCoursesStandOut || undefined,
      knowActivitiesStandOut: act,
      studySkillsConfidence: study,
      focusDifficulty: focus,
    });
    if (fromProfile && auth.currentUser) {
      await persistOnboardingToFirestore(auth.currentUser.uid, getOnboardingDraft());
      router.push("/app/profile");
      return;
    }
    router.push("/onboarding/step-4");
  }

  const confVal = careerConfidence === "" ? 5 : Math.min(10, Math.max(1, Number(careerConfidence)));
  const actVal = knowActivitiesStandOut === "" ? 5 : Math.min(10, Math.max(1, Number(knowActivitiesStandOut)));
  const studyVal = studySkillsConfidence === "" ? 5 : Math.min(10, Math.max(1, Number(studySkillsConfidence)));
  const focusVal = focusDifficulty === "" ? 5 : Math.min(10, Math.max(1, Number(focusDifficulty)));

  const config = STEP_CONFIG[3];

  return (
    <OnboardingStepCard
      title={config.title}
      subtitle={config.description}
      icon={<Briefcase className="h-5 w-5" />}
      showPrivacyFooter
      formId="onboarding-step3-form"
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => router.push(fromProfile ? "/app/profile" : "/onboarding/step-2")}>Back</Button>
          <Button type="submit" form="onboarding-step3-form" className="gap-2">Next <span aria-hidden>→</span></Button>
        </>
      }
    >
      <form id="onboarding-step3-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-primary">Career path in mind?</label>
          <p className="mt-0.5 text-xs text-text-muted">Required</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CAREER_OPTS.map((o) => (
              <button key={o.value} type="button" onClick={() => setCareerPath(o.value)} className={`onboarding-option-card ${careerPath === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
            ))}
          </div>
        </div>

        {careerPath === "Yes" && (
          <div>
            <label htmlFor="career-what" className="block text-sm font-medium text-text-primary">What career?</label>
            <p className="mt-0.5 text-xs text-text-muted">Required when you answer Yes</p>
            <Input id="career-what" value={careerPathWhat} onChange={(e) => setCareerPathWhat(e.target.value)} placeholder="e.g. Medicine, Engineering" className="mt-2" />
            {errors.careerPathWhat && <p className="mt-1 text-sm text-status-dangerText">{errors.careerPathWhat}</p>}
          </div>
        )}

        <div>
          <div className="flex justify-between">
            <label className="text-sm font-medium text-text-primary">Career confidence (1–10)</label>
            <span className="text-sm text-text-muted">{careerConfidence === "" ? "—" : confVal}</span>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">Optional</p>
          <input type="range" min={1} max={10} value={confVal} onChange={(e) => setCareerConfidence(parseInt(e.target.value, 10))} className="mt-2 w-full h-3 rounded-pill appearance-none bg-secondary-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary">Intended major areas</label>
          <p className="mt-0.5 text-xs text-text-muted">Required — select all that apply</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTEREST_CATEGORIES.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => toggleInterest(o.value)}
                className={`rounded-pill px-3 py-1.5 text-sm font-medium transition-colors ${areasOfInterest.includes(o.value) ? "bg-primary-500 text-white" : "bg-secondary-200 text-text-primary hover:bg-secondary-300"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {areasOfInterest.includes("Other") && (
            <Input value={interestOther} onChange={(e) => setInterestOther(e.target.value)} placeholder="Specify other (e.g. Pre-law)" className="mt-2" />
          )}
          {errors.areasOfInterest && <p className="mt-1.5 text-sm text-status-dangerText">{errors.areasOfInterest}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary">Do you know required courses for your path?</label>
          <p className="mt-0.5 text-xs text-text-muted">Optional</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {KNOW_COURSES_OPTS.map((o) => (
              <button key={o.value} type="button" onClick={() => setKnowCoursesStandOut(o.value)} className={`onboarding-option-card ${knowCoursesStandOut === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between">
            <label className="text-sm font-medium text-text-primary">Do you know required activities? (1–10)</label>
            <span className="text-sm text-text-muted">{knowActivitiesStandOut === "" ? "—" : actVal}</span>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">Optional</p>
          <input type="range" min={1} max={10} value={actVal} onChange={(e) => setKnowActivitiesStandOut(parseInt(e.target.value, 10))} className="mt-2 w-full h-3 rounded-pill appearance-none bg-secondary-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500" />
        </div>

        <div>
          <label htmlFor="target-degree" className="block text-sm font-medium text-text-primary">Highest degree goal</label>
          <p className="mt-0.5 text-xs text-text-muted">Optional</p>
          <select id="target-degree" value={targetDegree} onChange={(e) => setTargetDegree((e.target.value || "") as TargetDegree)} className="mt-2 w-full rounded-button border border-bg-border bg-bg-main px-4 py-2.5 text-text-primary">
            <option value="">Select</option>
            {TARGET_DEGREE_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between">
            <label className="text-sm font-medium text-text-primary">Study skills confidence (1–10)</label>
            <span className="text-sm text-text-muted">{studySkillsConfidence === "" ? "—" : studyVal}</span>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">Optional</p>
          <input type="range" min={1} max={10} value={studyVal} onChange={(e) => setStudySkillsConfidence(parseInt(e.target.value, 10))} className="mt-2 w-full h-3 rounded-pill appearance-none bg-secondary-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500" />
        </div>

        <div>
          <div className="flex justify-between">
            <label className="text-sm font-medium text-text-primary">Focus difficulty — how hard is it to stay focused? (1–10)</label>
            <span className="text-sm text-text-muted">{focusDifficulty === "" ? "—" : focusVal}</span>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">Optional. Higher = more difficulty focusing.</p>
          <input type="range" min={1} max={10} value={focusVal} onChange={(e) => setFocusDifficulty(parseInt(e.target.value, 10))} className="mt-2 w-full h-3 rounded-pill appearance-none bg-secondary-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500" />
        </div>
      </form>
    </OnboardingStepCard>
  );
}

export default function OnboardingStep3Page() {
  return (
    <Suspense fallback={null}>
      <OnboardingStep3Content />
    </Suspense>
  );
}
