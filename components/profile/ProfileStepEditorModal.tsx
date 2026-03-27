"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OnboardingDraft } from "@/lib/onboarding/types";
import type { GradeLevel, AcademicSuccessCrucial, Gender } from "@/lib/onboarding/schema";
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

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];

const GRAD_YEARS = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

const GRADE_OPTIONS: { value: GradeLevel; label: string }[] = [
  { value: "9", label: "Grade 9" },
  { value: "10", label: "Grade 10" },
  { value: "11", label: "Grade 11" },
  { value: "12", label: "Grade 12" },
  { value: "Gap Year", label: "Gap Year" },
  { value: "Other", label: "Other" },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Non-binary", label: "Non-binary" },
  { value: "Prefer not to say", label: "Prefer not to say" },
  { value: "Other", label: "Other" },
];

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

const STEP_TITLES: Record<number, string> = {
  1: "Basic information & life outlook",
  2: "Character & learning profile",
  3: "Career direction & goals",
  4: "Academic profile & exams",
  5: "Activities & achievements",
  6: "College preferences",
};

export interface ProfileStepEditorModalProps {
  step: number;
  answers: OnboardingDraft;
  onSave: (partial: Partial<OnboardingDraft>) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

export function ProfileStepEditorModal({ step, answers, onSave, onClose, saving }: ProfileStepEditorModalProps) {
  const [step1, setStep1] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "" as Gender | "",
    genderOther: "",
    country: "United States",
    state: "",
    city: "",
    currentHighSchool: "",
    expectedGraduationYear: "" as number | "",
    gradeLevel: "" as GradeLevel | "",
    lifeSatisfaction: "" as number | "",
    addingToLife: "",
    eliminatingFromLife: "",
    academicSuccessCrucial: "" as AcademicSuccessCrucial | "",
    naturalSkills: "",
    favoriteClass: "",
  });
  const [step2, setStep2] = useState({
    rankFirst: "",
    rankSecond: "",
    rankThird: "",
    rankFourth: "",
    intellectualStructuredVsOpen: "" as StructuredVsOpen | "",
    intellectualLectureVsDiscussion: "" as LectureVsDiscussion | "",
    intellectualResearchVsApplication: "" as ResearchVsApplication | "",
    intellectualTheoreticalVsHandsOn: "" as TheoreticalVsHandsOn | "",
    socialCompetitiveVsCollaborative: "" as CompetitiveVsCollaborative | "",
    socialIntrovertedVsSocial: "" as IntrovertedVsSocial | "",
    socialLargeVsTight: "" as LargeVsTight | "",
    socialIndependentVsGuided: "" as IndependentVsGuided | "",
  });

  useEffect(() => {
    if (step === 1) {
      setStep1({
        firstName: answers.firstName ?? "",
        lastName: answers.lastName ?? "",
        dateOfBirth: answers.dateOfBirth ?? "",
        gender: (answers.gender as Gender) ?? "",
        genderOther: answers.genderOther ?? "",
        country: answers.country ?? "United States",
        state: answers.state ?? "",
        city: answers.city ?? "",
        currentHighSchool: answers.currentHighSchool ?? "",
        expectedGraduationYear: answers.expectedGraduationYear ?? "",
        gradeLevel: (answers.gradeLevel as GradeLevel) ?? "",
        lifeSatisfaction: answers.lifeSatisfaction ?? "",
        addingToLife: answers.addingToLife ?? "",
        eliminatingFromLife: answers.eliminatingFromLife ?? "",
        academicSuccessCrucial: (answers.academicSuccessCrucial as AcademicSuccessCrucial) ?? "",
        naturalSkills: answers.naturalSkills ?? "",
        favoriteClass: answers.favoriteClass ?? "",
      });
    }
    if (step === 2) {
      const r = answers.workInclination ?? [];
      setStep2({
        rankFirst: r[0] ?? "",
        rankSecond: r[1] ?? "",
        rankThird: r[2] ?? "",
        rankFourth: r[3] ?? "",
        intellectualStructuredVsOpen: (answers.intellectualStructuredVsOpen as StructuredVsOpen) ?? "",
        intellectualLectureVsDiscussion: (answers.intellectualLectureVsDiscussion as LectureVsDiscussion) ?? "",
        intellectualResearchVsApplication: (answers.intellectualResearchVsApplication as ResearchVsApplication) ?? "",
        intellectualTheoreticalVsHandsOn: (answers.intellectualTheoreticalVsHandsOn as TheoreticalVsHandsOn) ?? "",
        socialCompetitiveVsCollaborative: (answers.socialCompetitiveVsCollaborative as CompetitiveVsCollaborative) ?? "",
        socialIntrovertedVsSocial: (answers.socialIntrovertedVsSocial as IntrovertedVsSocial) ?? "",
        socialLargeVsTight: (answers.socialLargeVsTight as LargeVsTight) ?? "",
        socialIndependentVsGuided: (answers.socialIndependentVsGuided as IndependentVsGuided) ?? "",
      });
    }
  }, [step, answers]);

  async function handleSubmitStep1(e: React.FormEvent) {
    e.preventDefault();
    const sat = step1.lifeSatisfaction === "" ? undefined : Number(step1.lifeSatisfaction);
    await onSave({
      firstName: step1.firstName.trim() || undefined,
      lastName: step1.lastName.trim() || undefined,
      dateOfBirth: step1.dateOfBirth.trim() || undefined,
      gender: step1.gender || undefined,
      genderOther: step1.gender === "Other" ? step1.genderOther.trim() || undefined : undefined,
      country: step1.country || undefined,
      state: step1.state || undefined,
      city: step1.city.trim() || undefined,
      currentHighSchool: step1.currentHighSchool.trim() || undefined,
      expectedGraduationYear: step1.expectedGraduationYear === "" ? undefined : Number(step1.expectedGraduationYear),
      gradeLevel: step1.gradeLevel ? (step1.gradeLevel as GradeLevel) : undefined,
      lifeSatisfaction: sat != null && !Number.isNaN(sat) ? sat : undefined,
      addingToLife: step1.addingToLife.trim() || undefined,
      eliminatingFromLife: step1.eliminatingFromLife.trim() || undefined,
      academicSuccessCrucial: step1.academicSuccessCrucial ? (step1.academicSuccessCrucial as AcademicSuccessCrucial) : undefined,
      naturalSkills: step1.naturalSkills.trim() || undefined,
      favoriteClass: step1.favoriteClass.trim() || undefined,
    });
  }

  async function handleSubmitStep2(e: React.FormEvent) {
    e.preventDefault();
    const ranked = buildRankFromSelects(step2.rankFirst, step2.rankSecond, step2.rankThird, step2.rankFourth);
    await onSave({
      workInclination: ranked.length === 4 ? ranked : undefined,
      intellectualStructuredVsOpen: step2.intellectualStructuredVsOpen || undefined,
      intellectualLectureVsDiscussion: step2.intellectualLectureVsDiscussion || undefined,
      intellectualResearchVsApplication: step2.intellectualResearchVsApplication || undefined,
      intellectualTheoreticalVsHandsOn: step2.intellectualTheoreticalVsHandsOn || undefined,
      socialCompetitiveVsCollaborative: step2.socialCompetitiveVsCollaborative || undefined,
      socialIntrovertedVsSocial: step2.socialIntrovertedVsSocial || undefined,
      socialLargeVsTight: step2.socialLargeVsTight || undefined,
      socialIndependentVsGuided: step2.socialIndependentVsGuided || undefined,
    });
  }

  const remainingForSecond = WORK_ITEMS.filter((x) => x !== step2.rankFirst);
  const remainingForThird = remainingForSecond.filter((x) => x !== step2.rankSecond);
  const remainingForFourth = remainingForThird.filter((x) => x !== step2.rankThird);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
      <div className="bg-bg-card border border-bg-border rounded-card shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-bg-border shrink-0">
          <h2 className="text-lg font-bold text-text-primary">
            Edit: {STEP_TITLES[step] ?? `Step ${step}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-button hover:bg-secondary-100 text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4 flex-1">
          {step === 1 && (
            <form id="profile-step1-form" onSubmit={handleSubmitStep1} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">First name</label>
                  <Input value={step1.firstName} onChange={(e) => setStep1((s) => ({ ...s, firstName: e.target.value }))} placeholder="First name" className="h-11" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Last name</label>
                  <Input value={step1.lastName} onChange={(e) => setStep1((s) => ({ ...s, lastName: e.target.value }))} placeholder="Last name" className="h-11" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Date of birth</label>
                <Input type="date" value={step1.dateOfBirth} onChange={(e) => setStep1((s) => ({ ...s, dateOfBirth: e.target.value }))} className="h-11 max-w-xs" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Gender</label>
                <div className="flex flex-wrap gap-2">
                  {GENDER_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setStep1((s) => ({ ...s, gender: o.value }))}
                      className={cn("px-4 py-2 rounded-button text-sm font-medium border-2 transition-colors", step1.gender === o.value ? "border-primary-500 bg-primary-500/10 text-primary-600" : "border-bg-border bg-bg-main hover:border-primary-500/50")}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {step1.gender === "Other" && (
                  <Input value={step1.genderOther} onChange={(e) => setStep1((s) => ({ ...s, genderOther: e.target.value }))} placeholder="Specify" className="mt-2 h-11 max-w-xs" />
                )}
              </div>
              {step1.country === "United States" && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">State</label>
                  <select value={step1.state} onChange={(e) => setStep1((s) => ({ ...s, state: e.target.value }))} className="w-full max-w-xs h-11 rounded-button border border-bg-border bg-bg-main px-3 text-sm">
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">City</label>
                <Input value={step1.city} onChange={(e) => setStep1((s) => ({ ...s, city: e.target.value }))} placeholder="City" className="h-11" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Current high school</label>
                <Input value={step1.currentHighSchool} onChange={(e) => setStep1((s) => ({ ...s, currentHighSchool: e.target.value }))} placeholder="High school name" className="h-11" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Expected graduation year</label>
                <select value={step1.expectedGraduationYear === "" ? "" : step1.expectedGraduationYear} onChange={(e) => setStep1((s) => ({ ...s, expectedGraduationYear: e.target.value ? Number(e.target.value) : "" }))} className="w-full max-w-xs h-11 rounded-button border border-bg-border bg-bg-main px-3 text-sm">
                  <option value="">Select year</option>
                  {GRAD_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Grade level</label>
                <select value={step1.gradeLevel} onChange={(e) => setStep1((s) => ({ ...s, gradeLevel: e.target.value as GradeLevel }))} className="w-full max-w-xs h-11 rounded-button border border-bg-border bg-bg-main px-3 text-sm">
                  <option value="">Select grade</option>
                  {GRADE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Life satisfaction (1–10)</label>
                <input type="range" min={1} max={10} value={step1.lifeSatisfaction === "" ? 5 : step1.lifeSatisfaction} onChange={(e) => setStep1((s) => ({ ...s, lifeSatisfaction: parseInt(e.target.value, 10) }))} className="w-full max-w-xs h-2 rounded-full accent-primary-500" />
                <span className="text-sm text-text-muted ml-2">{step1.lifeSatisfaction === "" ? "—" : step1.lifeSatisfaction}/10</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">What would you add to your life?</label>
                <textarea value={step1.addingToLife} onChange={(e) => setStep1((s) => ({ ...s, addingToLife: e.target.value }))} rows={2} className="w-full rounded-button border border-bg-border bg-bg-main px-3 py-2 text-sm resize-none" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">What would you remove to reduce burden?</label>
                <textarea value={step1.eliminatingFromLife} onChange={(e) => setStep1((s) => ({ ...s, eliminatingFromLife: e.target.value }))} rows={2} className="w-full rounded-button border border-bg-border bg-bg-main px-3 py-2 text-sm resize-none" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Is academic success crucial for your happiness?</label>
                <div className="flex flex-wrap gap-2">
                  {(["Yes", "No", "Not sure"] as const).map((opt) => (
                    <button key={opt} type="button" onClick={() => setStep1((s) => ({ ...s, academicSuccessCrucial: opt }))} className={cn("px-4 py-2 rounded-button text-sm font-medium border-2", step1.academicSuccessCrucial === opt ? "border-primary-500 bg-primary-500/10 text-primary-600" : "border-bg-border bg-bg-main")}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Naturally good at</label>
                <textarea value={step1.naturalSkills} onChange={(e) => setStep1((s) => ({ ...s, naturalSkills: e.target.value }))} rows={2} className="w-full rounded-button border border-bg-border bg-bg-main px-3 py-2 text-sm resize-none" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Favorite class</label>
                <Input value={step1.favoriteClass} onChange={(e) => setStep1((s) => ({ ...s, favoriteClass: e.target.value }))} placeholder="e.g. Math" className="h-11" />
              </div>
            </form>
          )}

          {step === 2 && (
            <form id="profile-step2-form" onSubmit={handleSubmitStep2} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Rank: Ideas, Data, People, Things (1st = most inclined)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-xs text-text-muted">1st</span>
                    <select value={step2.rankFirst} onChange={(e) => setStep2((s) => ({ ...s, rankFirst: e.target.value }))} className="mt-1 w-full rounded-button border border-bg-border bg-bg-main px-3 py-2 text-sm">
                      <option value="">Select</option>
                      {WORK_ITEMS.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted">2nd</span>
                    <select value={step2.rankSecond} onChange={(e) => setStep2((s) => ({ ...s, rankSecond: e.target.value }))} className="mt-1 w-full rounded-button border border-bg-border bg-bg-main px-3 py-2 text-sm">
                      <option value="">Select</option>
                      {remainingForSecond.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted">3rd</span>
                    <select value={step2.rankThird} onChange={(e) => setStep2((s) => ({ ...s, rankThird: e.target.value }))} className="mt-1 w-full rounded-button border border-bg-border bg-bg-main px-3 py-2 text-sm">
                      <option value="">Select</option>
                      {remainingForThird.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted">4th</span>
                    <select value={step2.rankFourth} onChange={(e) => setStep2((s) => ({ ...s, rankFourth: e.target.value }))} className="mt-1 w-full rounded-button border border-bg-border bg-bg-main px-3 py-2 text-sm">
                      <option value="">Select</option>
                      {remainingForFourth.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {[
                { key: "intellectualStructuredVsOpen", label: "Structured vs. Open-ended", opts: STRUCTURED_OPTS },
                { key: "intellectualLectureVsDiscussion", label: "Lecture vs. Discussion", opts: LECTURE_OPTS },
                { key: "intellectualResearchVsApplication", label: "Research vs. Application", opts: RESEARCH_OPTS },
                { key: "intellectualTheoreticalVsHandsOn", label: "Theoretical vs. Hands-on", opts: THEORETICAL_OPTS },
                { key: "socialCompetitiveVsCollaborative", label: "Competitive vs. Collaborative", opts: COMPETITIVE_OPTS },
                { key: "socialIntrovertedVsSocial", label: "Introverted vs. Socially energized", opts: INTROVERTED_OPTS },
                { key: "socialLargeVsTight", label: "Large networks vs. Tight circles", opts: LARGE_OPTS },
                { key: "socialIndependentVsGuided", label: "Independent vs. Guided", opts: INDEPENDENT_OPTS },
              ].map(({ key, label, opts }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-text-primary mb-2">{label}</label>
                  <div className="flex flex-wrap gap-2">
                    {opts.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setStep2((s) => ({ ...s, [key]: o.value }))}
                        className={cn("px-4 py-2 rounded-button text-sm font-medium border-2", step2[key as keyof typeof step2] === o.value ? "border-primary-500 bg-primary-500/10 text-primary-600" : "border-bg-border bg-bg-main")}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </form>
          )}

          {step >= 3 && (
            <p className="text-sm text-text-muted py-4">
              For steps 3–6, use the &quot;Edit&quot; form above (basic + academic fields) or complete your profile in onboarding. In-place edit for this section is coming soon.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-bg-border shrink-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {step === 1 && (
            <Button type="submit" form="profile-step1-form" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          )}
          {step === 2 && (
            <Button type="submit" form="profile-step2-form" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          )}
          {step >= 3 && (
            <Button type="button" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
