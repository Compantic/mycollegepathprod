"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveOnboardingDraft, getOnboardingDraft, persistOnboardingToFirestore } from "@/lib/onboarding/storage";
import { auth } from "@/lib/firebase/client";
import { STEP_CONFIG } from "@/lib/onboarding/stepConfig";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { Button } from "@/components/ui/button";
import type {
  AcademicSuccessCrucial,
  StructuredVsOpen,
  LectureVsDiscussion,
  ResearchVsApplication,
  TheoreticalVsHandsOn,
  CompetitiveVsCollaborative,
  IntrovertedVsSocial,
  LargeVsTight,
  IndependentVsGuided,
  PreferenceCoreType,
} from "@/lib/onboarding/schema";
import { FAVORITE_SUBJECT_OPTIONS, PREFERENCE_CORE_OPTIONS } from "@/lib/onboarding/schema";
import { Brain } from "lucide-react";

const STRUCTURED_OPTS: { value: StructuredVsOpen; label: string }[] = [
  { value: "Structured", label: "Structured" },
  { value: "Balanced", label: "Balanced" },
  { value: "Open-ended", label: "Open-ended" },
];
const LECTURE_OPTS: { value: LectureVsDiscussion; label: string }[] = [
  { value: "Lecture", label: "Lecture" },
  { value: "Balanced", label: "Balanced" },
  { value: "Discussion", label: "Discussion" },
];
const RESEARCH_OPTS: { value: ResearchVsApplication; label: string }[] = [
  { value: "Research", label: "Research" },
  { value: "Balanced", label: "Balanced" },
  { value: "Application", label: "Application" },
];
const THEORETICAL_OPTS: { value: TheoreticalVsHandsOn; label: string }[] = [
  { value: "Theoretical", label: "Theoretical" },
  { value: "Balanced", label: "Balanced" },
  { value: "Hands-on", label: "Hands-on" },
];
const COMPETITIVE_OPTS: { value: CompetitiveVsCollaborative; label: string }[] = [
  { value: "Competitive", label: "Competitive" },
  { value: "Balanced", label: "Balanced" },
  { value: "Collaborative", label: "Collaborative" },
];
const INTROVERTED_OPTS: { value: IntrovertedVsSocial; label: string }[] = [
  { value: "Introverted", label: "Introverted" },
  { value: "Balanced", label: "Balanced" },
  { value: "Social", label: "Social" },
];
const LARGE_OPTS: { value: LargeVsTight; label: string }[] = [
  { value: "Large networks", label: "Large networks" },
  { value: "Balanced", label: "Balanced" },
  { value: "Tight circles", label: "Tight circles" },
];
const INDEPENDENT_OPTS: { value: IndependentVsGuided; label: string }[] = [
  { value: "Independent", label: "Independent" },
  { value: "Balanced", label: "Balanced" },
  { value: "Guided", label: "Guided" },
];

function OnboardingStep2Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProfile = searchParams.get("from") === "profile";
  const [lifeSatisfaction, setLifeSatisfaction] = useState<number | "">("");
  const [addingToLife, setAddingToLife] = useState("");
  const [eliminatingFromLife, setEliminatingFromLife] = useState("");
  const [academicSuccessCrucial, setAcademicSuccessCrucial] = useState<AcademicSuccessCrucial | "">("");
  const [naturalSkills, setNaturalSkills] = useState("");
  const [fav1, setFav1] = useState("");
  const [fav2, setFav2] = useState("");
  const [fav3, setFav3] = useState("");
  const [intellectualStructuredVsOpen, setIntellectualStructuredVsOpen] = useState<StructuredVsOpen | "">("");
  const [intellectualLectureVsDiscussion, setIntellectualLectureVsDiscussion] = useState<LectureVsDiscussion | "">("");
  const [intellectualResearchVsApplication, setIntellectualResearchVsApplication] = useState<ResearchVsApplication | "">("");
  const [intellectualTheoreticalVsHandsOn, setIntellectualTheoreticalVsHandsOn] = useState<TheoreticalVsHandsOn | "">("");
  const [socialCompetitiveVsCollaborative, setSocialCompetitiveVsCollaborative] = useState<CompetitiveVsCollaborative | "">("");
  const [socialIntrovertedVsSocial, setSocialIntrovertedVsSocial] = useState<IntrovertedVsSocial | "">("");
  const [socialLargeVsTight, setSocialLargeVsTight] = useState<LargeVsTight | "">("");
  const [socialIndependentVsGuided, setSocialIndependentVsGuided] = useState<IndependentVsGuided | "">("");
  const [preferenceCoreType, setPreferenceCoreType] = useState<PreferenceCoreType | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const d = getOnboardingDraft();
    const rank = d.favoriteSubjectsRank ?? [];
    if (d.lifeSatisfaction != null) setLifeSatisfaction(d.lifeSatisfaction);
    if (d.addingToLife) setAddingToLife(d.addingToLife);
    if (d.eliminatingFromLife) setEliminatingFromLife(d.eliminatingFromLife);
    if (d.academicSuccessCrucial) setAcademicSuccessCrucial(d.academicSuccessCrucial);
    if (d.naturalSkills) setNaturalSkills(d.naturalSkills);
    if (rank[0]) setFav1(rank[0]);
    if (rank[1]) setFav2(rank[1]);
    if (rank[2]) setFav3(rank[2]);
    if (d.intellectualStructuredVsOpen) setIntellectualStructuredVsOpen(d.intellectualStructuredVsOpen);
    if (d.intellectualLectureVsDiscussion) setIntellectualLectureVsDiscussion(d.intellectualLectureVsDiscussion);
    if (d.intellectualResearchVsApplication) setIntellectualResearchVsApplication(d.intellectualResearchVsApplication);
    if (d.intellectualTheoreticalVsHandsOn) setIntellectualTheoreticalVsHandsOn(d.intellectualTheoreticalVsHandsOn);
    if (d.socialCompetitiveVsCollaborative) setSocialCompetitiveVsCollaborative(d.socialCompetitiveVsCollaborative);
    if (d.socialIntrovertedVsSocial) {
      const s = d.socialIntrovertedVsSocial as string;
      setSocialIntrovertedVsSocial(s === "Socially energized" ? "Social" : (d.socialIntrovertedVsSocial as IntrovertedVsSocial));
    }
    if (d.socialLargeVsTight) setSocialLargeVsTight(d.socialLargeVsTight);
    if (d.socialIndependentVsGuided) setSocialIndependentVsGuided(d.socialIndependentVsGuided);
    if (d.preferenceCoreType) setPreferenceCoreType(d.preferenceCoreType);
    else if (d.workInclination?.[0]) setPreferenceCoreType(d.workInclination[0]);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (lifeSatisfaction === "" || lifeSatisfaction === undefined) err.lifeSatisfaction = "Please rate your life satisfaction.";
    if (!academicSuccessCrucial) err.academicSuccessCrucial = "Please select an option.";
    if (!preferenceCoreType) err.preferenceCoreType = "Please choose your preference core type.";
    setErrors(err);
    if (Object.keys(err).length) return;

    const sat = Number(lifeSatisfaction);
    if (sat < 1 || sat > 10) {
      setErrors((prev) => ({ ...prev, lifeSatisfaction: "Choose a value between 1 and 10." }));
      return;
    }

    const rank = [fav1, fav2, fav3].filter((x, i, a) => x && a.indexOf(x) === i);

    saveOnboardingDraft({
      lifeSatisfaction: sat,
      addingToLife: addingToLife.trim() || undefined,
      eliminatingFromLife: eliminatingFromLife.trim() || undefined,
      academicSuccessCrucial: academicSuccessCrucial as AcademicSuccessCrucial,
      naturalSkills: naturalSkills.trim() || undefined,
      favoriteSubjectsRank: rank.length ? rank : undefined,
      intellectualStructuredVsOpen: intellectualStructuredVsOpen || undefined,
      intellectualLectureVsDiscussion: intellectualLectureVsDiscussion || undefined,
      intellectualResearchVsApplication: intellectualResearchVsApplication || undefined,
      intellectualTheoreticalVsHandsOn: intellectualTheoreticalVsHandsOn || undefined,
      socialCompetitiveVsCollaborative: socialCompetitiveVsCollaborative || undefined,
      socialIntrovertedVsSocial: socialIntrovertedVsSocial || undefined,
      socialLargeVsTight: socialLargeVsTight || undefined,
      socialIndependentVsGuided: socialIndependentVsGuided || undefined,
      preferenceCoreType: preferenceCoreType as PreferenceCoreType,
      workInclination: [preferenceCoreType as PreferenceCoreType],
    });
    if (fromProfile && auth.currentUser) {
      await persistOnboardingToFirestore(auth.currentUser.uid, getOnboardingDraft());
      router.push("/app/profile");
      return;
    }
    router.push("/onboarding/step-3");
  }

  const satNum = lifeSatisfaction === "" ? 5 : Math.min(10, Math.max(1, Number(lifeSatisfaction)));
  const config = STEP_CONFIG[2];

  const subjectSelect = (value: string, onChange: (v: string) => void, label: string) => (
    <div>
      <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-0 w-full rounded-button border border-bg-border bg-bg-main px-3 py-2 text-sm text-text-primary">
        <option value="">—</option>
        {FAVORITE_SUBJECT_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );

  return (
    <OnboardingStepCard
      title={config.title}
      subtitle={config.description}
      icon={<Brain className="h-5 w-5" />}
      showPrivacyFooter
      formId="onboarding-step2-form"
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => router.push(fromProfile ? "/app/profile" : "/onboarding/step-1")}>
            Back
          </Button>
          <Button type="submit" form="onboarding-step2-form" className="gap-2">
            Next <span aria-hidden>→</span>
          </Button>
        </>
      }
    >
      <form id="onboarding-step2-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="life-sat" className="text-sm font-medium text-text-primary">Life satisfaction</label>
            <span className="text-sm font-semibold text-primary-600 min-w-[2rem] text-right">{lifeSatisfaction === "" ? "—" : satNum}/10</span>
          </div>
          <p className="text-xs text-text-muted mb-2">1 = low, 10 = high. Required.</p>
          <input id="life-sat" type="range" min={1} max={10} value={satNum} onChange={(e) => setLifeSatisfaction(parseInt(e.target.value, 10))} className="onboarding-slider" />
          {errors.lifeSatisfaction && <p className="mt-1.5 text-sm text-status-dangerText">{errors.lifeSatisfaction}</p>}
        </div>

        <div>
          <label htmlFor="adding" className="block text-sm font-medium text-text-primary mb-1.5">What would you add to your life?</label>
          <p className="text-xs text-text-muted mb-2">Optional</p>
          <textarea id="adding" value={addingToLife} onChange={(e) => setAddingToLife(e.target.value)} rows={3} className="w-full onboarding-input resize-none py-3" placeholder="If you had all the opportunities without limitations…" />
        </div>

        <div>
          <label htmlFor="eliminating" className="block text-sm font-medium text-text-primary mb-1.5">What would you remove from your life?</label>
          <p className="text-xs text-text-muted mb-2">Optional</p>
          <textarea id="eliminating" value={eliminatingFromLife} onChange={(e) => setEliminatingFromLife(e.target.value)} rows={3} className="w-full onboarding-input resize-none py-3" placeholder="Something that would release the most burden…" />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-text-primary">Is academic success crucial for your happiness and life success?</legend>
          <p className="mt-0.5 text-xs text-text-muted mb-3">Required</p>
          <div className="flex flex-wrap gap-2">
            {(["Yes", "No", "Not sure"] as const).map((opt) => (
              <label key={opt} className={`onboarding-pill ${academicSuccessCrucial === opt ? "onboarding-pill-selected" : ""}`}>
                <input type="radio" name="academic" value={opt} checked={academicSuccessCrucial === opt} onChange={() => setAcademicSuccessCrucial(opt)} className="sr-only" />
                {opt}
              </label>
            ))}
          </div>
          {errors.academicSuccessCrucial && <p className="mt-1.5 text-sm text-status-dangerText">{errors.academicSuccessCrucial}</p>}
        </fieldset>

        <div>
          <label htmlFor="natural" className="block text-sm font-medium text-text-primary mb-1.5">What are you naturally good at?</label>
          <p className="text-xs text-text-muted mb-2">Optional</p>
          <textarea id="natural" value={naturalSkills} onChange={(e) => setNaturalSkills(e.target.value)} rows={3} className="w-full onboarding-input resize-none py-3" placeholder="e.g. Problem-solving, writing, teamwork…" />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Favorite subjects (rank top 3)</label>
          <p className="text-xs text-text-muted mb-2">Optional. Pick 1st, 2nd, 3rd — duplicates are ignored.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {subjectSelect(fav1, setFav1, "1st")}
            {subjectSelect(fav2, setFav2, "2nd")}
            {subjectSelect(fav3, setFav3, "3rd")}
          </div>
        </div>

        <div className="rounded-xl border border-bg-border bg-secondary-100/20 p-4 space-y-4">
          <p className="text-sm font-semibold text-text-primary">Block A — Learning style</p>
          <div>
            <label className="block text-sm font-medium text-text-primary">Structured / Balanced / Open-ended</label>
            <p className="text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {STRUCTURED_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setIntellectualStructuredVsOpen(o.value)} className={`onboarding-option-card ${intellectualStructuredVsOpen === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary">Lecture / Balanced / Discussion</label>
            <p className="text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LECTURE_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setIntellectualLectureVsDiscussion(o.value)} className={`onboarding-option-card ${intellectualLectureVsDiscussion === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary">Research / Balanced / Application</label>
            <p className="text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {RESEARCH_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setIntellectualResearchVsApplication(o.value)} className={`onboarding-option-card ${intellectualResearchVsApplication === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary">Theoretical / Balanced / Hands-on</label>
            <p className="text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {THEORETICAL_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setIntellectualTheoreticalVsHandsOn(o.value)} className={`onboarding-option-card ${intellectualTheoreticalVsHandsOn === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-bg-border bg-secondary-100/20 p-4 space-y-4">
          <p className="text-sm font-semibold text-text-primary">Block B — Social style</p>
          <div>
            <label className="block text-sm font-medium text-text-primary">Competitive / Balanced / Collaborative</label>
            <p className="text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {COMPETITIVE_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setSocialCompetitiveVsCollaborative(o.value)} className={`onboarding-option-card ${socialCompetitiveVsCollaborative === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary">Introverted / Balanced / Social</label>
            <p className="text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {INTROVERTED_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setSocialIntrovertedVsSocial(o.value)} className={`onboarding-option-card ${socialIntrovertedVsSocial === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary">Large networks / Balanced / Tight circles</label>
            <p className="text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LARGE_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setSocialLargeVsTight(o.value)} className={`onboarding-option-card ${socialLargeVsTight === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary">Independent / Balanced / Guided</label>
            <p className="text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {INDEPENDENT_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setSocialIndependentVsGuided(o.value)} className={`onboarding-option-card ${socialIndependentVsGuided === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Preference core type</label>
          <p className="text-xs text-text-muted mb-3">Which best describes what you gravitate toward? Required.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PREFERENCE_CORE_OPTIONS.map((opt) => (
              <button key={opt} type="button" onClick={() => setPreferenceCoreType(opt)} className={`onboarding-option-card ${preferenceCoreType === opt ? "onboarding-option-card-selected" : ""}`}>{opt}</button>
            ))}
          </div>
          {errors.preferenceCoreType && <p className="mt-1.5 text-sm text-status-dangerText">{errors.preferenceCoreType}</p>}
        </div>
      </form>
    </OnboardingStepCard>
  );
}

export default function OnboardingStep2Page() {
  return (
    <Suspense fallback={null}>
      <OnboardingStep2Content />
    </Suspense>
  );
}
