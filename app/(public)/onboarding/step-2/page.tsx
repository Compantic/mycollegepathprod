"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveOnboardingDraft, getOnboardingDraft, persistOnboardingToFirestore } from "@/lib/onboarding/storage";
import { auth } from "@/lib/firebase/client";
import { STEP_CONFIG } from "@/lib/onboarding/stepConfig";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { Brain } from "lucide-react";
import type {
  WorkInclinationItem,
  StructuredVsOpen,
  LectureVsDiscussion,
  ResearchVsApplication,
  TheoreticalVsHandsOn,
  CompetitiveVsCollaborative,
  IntrovertedVsSocial,
  LargeVsTight,
  IndependentVsGuided,
} from "@/lib/onboarding/schema";
import { Button } from "@/components/ui/button";

const WORK_ITEMS: WorkInclinationItem[] = ["Ideas", "Data", "People", "Things"];
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
  { value: "Socially energized", label: "Socially energized" },
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

function buildRankFromSelects(first: string, second: string, third: string, fourth: string): WorkInclinationItem[] {
  const arr = [first, second, third, fourth].filter(Boolean) as WorkInclinationItem[];
  const seen = new Set<string>();
  const out: WorkInclinationItem[] = [];
  for (const x of arr) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  for (const item of WORK_ITEMS) {
    if (!seen.has(item)) out.push(item);
  }
  return out.slice(0, 4);
}

function OnboardingStep2Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProfile = searchParams.get("from") === "profile";
  const [rankFirst, setRankFirst] = useState<string>("");
  const [rankSecond, setRankSecond] = useState<string>("");
  const [rankThird, setRankThird] = useState<string>("");
  const [rankFourth, setRankFourth] = useState<string>("");
  const [intellectualStructuredVsOpen, setIntellectualStructuredVsOpen] = useState<StructuredVsOpen | "">("");
  const [intellectualLectureVsDiscussion, setIntellectualLectureVsDiscussion] = useState<LectureVsDiscussion | "">("");
  const [intellectualResearchVsApplication, setIntellectualResearchVsApplication] = useState<ResearchVsApplication | "">("");
  const [intellectualTheoreticalVsHandsOn, setIntellectualTheoreticalVsHandsOn] = useState<TheoreticalVsHandsOn | "">("");
  const [socialCompetitiveVsCollaborative, setSocialCompetitiveVsCollaborative] = useState<CompetitiveVsCollaborative | "">("");
  const [socialIntrovertedVsSocial, setSocialIntrovertedVsSocial] = useState<IntrovertedVsSocial | "">("");
  const [socialLargeVsTight, setSocialLargeVsTight] = useState<LargeVsTight | "">("");
  const [socialIndependentVsGuided, setSocialIndependentVsGuided] = useState<IndependentVsGuided | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const d = getOnboardingDraft();
    const r = d.workInclination ?? [];
    if (r[0]) setRankFirst(r[0]);
    if (r[1]) setRankSecond(r[1]);
    if (r[2]) setRankThird(r[2]);
    if (r[3]) setRankFourth(r[3]);
    if (d.intellectualStructuredVsOpen) setIntellectualStructuredVsOpen(d.intellectualStructuredVsOpen);
    if (d.intellectualLectureVsDiscussion) setIntellectualLectureVsDiscussion(d.intellectualLectureVsDiscussion);
    if (d.intellectualResearchVsApplication) setIntellectualResearchVsApplication(d.intellectualResearchVsApplication);
    if (d.intellectualTheoreticalVsHandsOn) setIntellectualTheoreticalVsHandsOn(d.intellectualTheoreticalVsHandsOn);
    if (d.socialCompetitiveVsCollaborative) setSocialCompetitiveVsCollaborative(d.socialCompetitiveVsCollaborative);
    if (d.socialIntrovertedVsSocial) setSocialIntrovertedVsSocial(d.socialIntrovertedVsSocial);
    if (d.socialLargeVsTight) setSocialLargeVsTight(d.socialLargeVsTight);
    if (d.socialIndependentVsGuided) setSocialIndependentVsGuided(d.socialIndependentVsGuided);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    const ranked = buildRankFromSelects(rankFirst, rankSecond, rankThird, rankFourth);
    if (ranked.length !== 4) err.workInclination = "Please rank all four (Ideas, Data, People, Things) with no duplicates.";
    setErrors(err);
    if (Object.keys(err).length) return;

    saveOnboardingDraft({
      workInclination: ranked,
      intellectualStructuredVsOpen: intellectualStructuredVsOpen || undefined,
      intellectualLectureVsDiscussion: intellectualLectureVsDiscussion || undefined,
      intellectualResearchVsApplication: intellectualResearchVsApplication || undefined,
      intellectualTheoreticalVsHandsOn: intellectualTheoreticalVsHandsOn || undefined,
      socialCompetitiveVsCollaborative: socialCompetitiveVsCollaborative || undefined,
      socialIntrovertedVsSocial: socialIntrovertedVsSocial || undefined,
      socialLargeVsTight: socialLargeVsTight || undefined,
      socialIndependentVsGuided: socialIndependentVsGuided || undefined,
    });
    if (fromProfile && auth.currentUser) {
      await persistOnboardingToFirestore(auth.currentUser.uid, getOnboardingDraft());
      router.push("/app/profile");
      return;
    }
    router.push("/onboarding/step-3");
  }

  const remainingForSecond = WORK_ITEMS.filter((x) => x !== rankFirst);
  const remainingForThird = remainingForSecond.filter((x) => x !== rankSecond);
  const remainingForFourth = remainingForThird.filter((x) => x !== rankThird);

  const config = STEP_CONFIG[2];

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
            <label className="block text-sm font-medium text-text-primary">
              Rank in order: Ideas, Data, People, Things (1 = most inclined)
            </label>
            <p className="mt-0.5 text-xs text-text-muted">Required. Select your 1st through 4th.</p>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-xs text-text-muted">1st</span>
                <select
                  value={rankFirst}
                  onChange={(e) => setRankFirst(e.target.value)}
                  className="mt-1 w-full rounded-button border border-bg-border bg-bg-main px-3 py-2 text-sm text-text-primary"
                >
                  <option value="">Select</option>
                  {WORK_ITEMS.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-xs text-text-muted">2nd</span>
                <select
                  value={rankSecond}
                  onChange={(e) => setRankSecond(e.target.value)}
                  className="mt-1 w-full rounded-button border border-bg-border bg-bg-main px-3 py-2 text-sm text-text-primary"
                >
                  <option value="">Select</option>
                  {remainingForSecond.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-xs text-text-muted">3rd</span>
                <select
                  value={rankThird}
                  onChange={(e) => setRankThird(e.target.value)}
                  className="mt-1 w-full rounded-button border border-bg-border bg-bg-main px-3 py-2 text-sm text-text-primary"
                >
                  <option value="">Select</option>
                  {remainingForThird.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-xs text-text-muted">4th</span>
                <select
                  value={rankFourth}
                  onChange={(e) => setRankFourth(e.target.value)}
                  className="mt-1 w-full rounded-button border border-bg-border bg-bg-main px-3 py-2 text-sm text-text-primary"
                >
                  <option value="">Select</option>
                  {remainingForFourth.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </div>
            </div>
            {errors.workInclination && <p className="mt-1 text-sm text-status-dangerText">{errors.workInclination}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">9a) Structured vs. Open-ended?</label>
            <p className="mt-0.5 text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {STRUCTURED_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setIntellectualStructuredVsOpen(o.value)} className={`onboarding-option-card ${intellectualStructuredVsOpen === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">9b) Lecture-based vs. Discussion-based?</label>
            <p className="mt-0.5 text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LECTURE_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setIntellectualLectureVsDiscussion(o.value)} className={`onboarding-option-card ${intellectualLectureVsDiscussion === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">9c) Research-driven vs. Application-driven?</label>
            <p className="mt-0.5 text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {RESEARCH_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setIntellectualResearchVsApplication(o.value)} className={`onboarding-option-card ${intellectualResearchVsApplication === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">9d) Theoretical vs. Hands-on?</label>
            <p className="mt-0.5 text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {THEORETICAL_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setIntellectualTheoreticalVsHandsOn(o.value)} className={`onboarding-option-card ${intellectualTheoreticalVsHandsOn === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">10a) Competitive or Collaborative?</label>
            <p className="mt-0.5 text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {COMPETITIVE_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setSocialCompetitiveVsCollaborative(o.value)} className={`onboarding-option-card ${socialCompetitiveVsCollaborative === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">10b) Introverted or Socially energized?</label>
            <p className="mt-0.5 text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {INTROVERTED_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setSocialIntrovertedVsSocial(o.value)} className={`onboarding-option-card ${socialIntrovertedVsSocial === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">10c) Large networks or Tight circles?</label>
            <p className="mt-0.5 text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LARGE_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setSocialLargeVsTight(o.value)} className={`onboarding-option-card ${socialLargeVsTight === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">10d) Independent or Guided?</label>
            <p className="mt-0.5 text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {INDEPENDENT_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setSocialIndependentVsGuided(o.value)} className={`onboarding-option-card ${socialIndependentVsGuided === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
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
