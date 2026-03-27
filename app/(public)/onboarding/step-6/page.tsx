"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getOnboardingDraft, saveOnboardingDraft, persistOnboardingToFirestore } from "@/lib/onboarding/storage";
import { auth } from "@/lib/firebase/client";
import type {
  OnboardingAnswers,
  GradeLevel,
  CampusUrbanSuburbanRural,
  LectureVsSeminar,
  CoreVsOpen,
  QuizzesVsExams,
  IntensityVsBalanced,
  HasCollegeList,
  ApplicationStrategy,
} from "@/lib/onboarding/schema";
import { ageFromDateOfBirth, formatDateOfBirth } from "@/lib/onboarding/utils";
import { STEP_CONFIG } from "@/lib/onboarding/stepConfig";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck,
  User,
  CalendarDays,
  MapPin,
  School,
  GraduationCap,
  Gauge,
  BookOpen,
  Map,
  Building2,
} from "lucide-react";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary-50/80 transition-colors">
      <div className="onboarding-icon-box shrink-0 text-primary-600 mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium text-text-muted block">{label}</span>
        <span className="text-sm font-semibold text-text-primary break-words">{value}</span>
      </div>
    </div>
  );
}

function graduationYearFromGrade(grade: GradeLevel | undefined): number | undefined {
  if (!grade) return undefined;
  const y = new Date().getFullYear();
  if (grade === "9") return y + 4;
  if (grade === "10") return y + 3;
  if (grade === "11") return y + 2;
  if (grade === "12") return y + 1;
  return y + 1;
}

function OnboardingStep6Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProfile = searchParams.get("from") === "profile";
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [admissionProcessConfidence, setAdmissionProcessConfidence] = useState<number | "">("");
  const [selectivityImportance, setSelectivityImportance] = useState<number | "">("");
  const [locationPreferenceStates, setLocationPreferenceStates] = useState<string[]>([]);
  const [campusUrbanSuburbanRural, setCampusUrbanSuburbanRural] = useState<CampusUrbanSuburbanRural | "">("");
  const [campusLectureVsSeminar, setCampusLectureVsSeminar] = useState<LectureVsSeminar | "">("");
  const [campusCoreVsOpen, setCampusCoreVsOpen] = useState<CoreVsOpen | "">("");
  const [campusQuizzesVsExams, setCampusQuizzesVsExams] = useState<QuizzesVsExams | "">("");
  const [campusIntensityVsBalanced, setCampusIntensityVsBalanced] = useState<IntensityVsBalanced | "">("");
  const [hasCollegeList, setHasCollegeList] = useState<HasCollegeList | "">("");
  const [collegeListReachMatchSafety, setCollegeListReachMatchSafety] = useState("");
  const [collegeListVisited, setCollegeListVisited] = useState("");
  const [collegeListWhatLike, setCollegeListWhatLike] = useState("");
  const [applicationStrategy, setApplicationStrategy] = useState<ApplicationStrategy | "">("");

  useEffect(() => {
    const d = getOnboardingDraft();
    setAnswers(d);
    if (d.admissionProcessConfidence != null) setAdmissionProcessConfidence(d.admissionProcessConfidence);
    if (d.selectivityImportance != null) setSelectivityImportance(d.selectivityImportance);
    if (d.locationPreferenceStates?.length) setLocationPreferenceStates(d.locationPreferenceStates);
    if (d.campusUrbanSuburbanRural) setCampusUrbanSuburbanRural(d.campusUrbanSuburbanRural);
    if (d.campusLectureVsSeminar) setCampusLectureVsSeminar(d.campusLectureVsSeminar);
    if (d.campusCoreVsOpen) setCampusCoreVsOpen(d.campusCoreVsOpen);
    if (d.campusQuizzesVsExams) setCampusQuizzesVsExams(d.campusQuizzesVsExams);
    if (d.campusIntensityVsBalanced) setCampusIntensityVsBalanced(d.campusIntensityVsBalanced);
    if (d.hasCollegeList) setHasCollegeList(d.hasCollegeList);
    if (d.collegeListReachMatchSafety) setCollegeListReachMatchSafety(d.collegeListReachMatchSafety);
    if (d.collegeListVisited) setCollegeListVisited(d.collegeListVisited);
    if (d.collegeListWhatLike) setCollegeListWhatLike(d.collegeListWhatLike);
    if (d.applicationStrategy) setApplicationStrategy(d.applicationStrategy);
  }, []);

  function toggleState(state: string) {
    setLocationPreferenceStates((prev) => (prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]));
  }

  async function handleSaveAndContinue() {
    const conf = admissionProcessConfidence === "" ? undefined : Math.min(10, Math.max(1, Number(admissionProcessConfidence)));
    const sel = selectivityImportance === "" ? undefined : Math.min(10, Math.max(1, Number(selectivityImportance)));
    saveOnboardingDraft({
      admissionProcessConfidence: conf,
      selectivityImportance: sel,
      locationPreferenceStates: locationPreferenceStates.length ? locationPreferenceStates : undefined,
      campusUrbanSuburbanRural: campusUrbanSuburbanRural || undefined,
      campusLectureVsSeminar: campusLectureVsSeminar || undefined,
      campusCoreVsOpen: campusCoreVsOpen || undefined,
      campusQuizzesVsExams: campusQuizzesVsExams || undefined,
      campusIntensityVsBalanced: campusIntensityVsBalanced || undefined,
      hasCollegeList: hasCollegeList || undefined,
      applicationStrategy: applicationStrategy || undefined,
      collegeListReachMatchSafety: hasCollegeList === "Yes" ? collegeListReachMatchSafety.trim() || undefined : undefined,
      collegeListVisited: hasCollegeList === "Yes" ? collegeListVisited.trim() || undefined : undefined,
      collegeListWhatLike: hasCollegeList === "Yes" ? collegeListWhatLike.trim() || undefined : undefined,
      preferredStates: locationPreferenceStates.length ? locationPreferenceStates : answers.preferredStates,
    });
    setAnswers(getOnboardingDraft());
    if (fromProfile && auth.currentUser) {
      await persistOnboardingToFirestore(auth.currentUser.uid, getOnboardingDraft());
      router.push("/app/profile");
      return;
    }
    router.push("/onboarding/step-7");
  }

  const confVal = admissionProcessConfidence === "" ? 5 : Math.min(10, Math.max(1, Number(admissionProcessConfidence)));
  const selVal = selectivityImportance === "" ? 5 : Math.min(10, Math.max(1, Number(selectivityImportance)));
  const gradYear = graduationYearFromGrade(answers.gradeLevel) ?? answers.graduationYear;

  const config = STEP_CONFIG[6];

  return (
    <>
      <OnboardingStepCard
        title={config.title}
        subtitle={config.description}
        icon={<ClipboardCheck className="h-5 w-5" />}
        showPrivacyFooter={false}
        formId="onboarding-step6-form"
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => router.push(fromProfile ? "/app/profile" : "/onboarding/step-5")}>
              Back
            </Button>
            <Button type="submit" form="onboarding-step6-form">
              Save & continue
            </Button>
          </>
        }
      >
        <form id="onboarding-step6-form" onSubmit={(e) => { e.preventDefault(); handleSaveAndContinue(); }} className="space-y-6">
          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium text-text-primary">How confident are you in the college admission process? (1–10)</label>
              <span className="text-sm text-text-muted">{admissionProcessConfidence === "" ? "—" : confVal}</span>
            </div>
            <input type="range" min={1} max={10} value={confVal} onChange={(e) => setAdmissionProcessConfidence(parseInt(e.target.value, 10))} className="mt-2 w-full h-3 rounded-pill appearance-none bg-secondary-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500" />
          </div>

          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium text-text-primary">How important is it to attend a selective college? (1–10)</label>
              <span className="text-sm text-text-muted">{selVal}</span>
            </div>
            <input type="range" min={1} max={10} value={selVal} onChange={(e) => setSelectivityImportance(parseInt(e.target.value, 10))} className="mt-2 w-full h-3 rounded-pill appearance-none bg-secondary-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">Which states do you want to go to college in?</label>
            <p className="mt-0.5 text-xs text-text-muted">Optional. Multi-select.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {US_STATES.map((state) => (
                <button key={state} type="button" onClick={() => toggleState(state)} className={`rounded-pill px-3 py-1.5 text-sm font-medium ${locationPreferenceStates.includes(state) ? "bg-primary-500 text-white" : "bg-secondary-200 text-text-primary hover:bg-secondary-300"}`}>
                  {state}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">31a) Urban, suburban, or rural?</label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["Urban", "Suburban", "Rural"] as const).map((opt) => (
                <button key={opt} type="button" onClick={() => setCampusUrbanSuburbanRural(opt)} className={`onboarding-option-card ${campusUrbanSuburbanRural === opt ? "onboarding-option-card-selected" : ""}`}>{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">31b) 200-person lecture or 12-person seminar?</label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["Large lecture", "Balanced", "Small seminar"] as const).map((opt) => (
                <button key={opt} type="button" onClick={() => setCampusLectureVsSeminar(opt)} className={`onboarding-option-card ${campusLectureVsSeminar === opt ? "onboarding-option-card-selected" : ""}`}>{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">31c) Mandatory humanities core or total flexibility (open curriculum)?</label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["Core", "Balanced", "Open curriculum"] as const).map((opt) => (
                <button key={opt} type="button" onClick={() => setCampusCoreVsOpen(opt)} className={`onboarding-option-card ${campusCoreVsOpen === opt ? "onboarding-option-card-selected" : ""}`}>{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">31d) Weekly quizzes or 3 high-stakes exams?</label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["Weekly quizzes", "Balanced", "High-stakes exams"] as const).map((opt) => (
                <button key={opt} type="button" onClick={() => setCampusQuizzesVsExams(opt)} className={`onboarding-option-card ${campusQuizzesVsExams === opt ? "onboarding-option-card-selected" : ""}`}>{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">31e) High-achievement intensity vs. balanced life?</label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["High intensity", "Balanced", "Balanced life"] as const).map((opt) => (
                <button key={opt} type="button" onClick={() => setCampusIntensityVsBalanced(opt)} className={`onboarding-option-card ${campusIntensityVsBalanced === opt ? "onboarding-option-card-selected" : ""}`}>{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">Do you have a college list?</label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" onClick={() => setHasCollegeList("Yes")} className={`onboarding-option-card ${hasCollegeList === "Yes" ? "onboarding-option-card-selected" : ""}`}>Yes</button>
              <button type="button" onClick={() => setHasCollegeList("No")} className={`onboarding-option-card ${hasCollegeList === "No" ? "onboarding-option-card-selected" : ""}`}>No</button>
            </div>
          </div>

          {hasCollegeList === "Yes" && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary">What are the best reach/match/safety colleges for you currently?</label>
                <textarea value={collegeListReachMatchSafety} onChange={(e) => setCollegeListReachMatchSafety(e.target.value)} rows={3} className="mt-2 w-full rounded-button border border-bg-border bg-bg-main px-4 py-2.5 text-sm" placeholder="List or describe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">Which ones have you visited?</label>
                <textarea value={collegeListVisited} onChange={(e) => setCollegeListVisited(e.target.value)} rows={2} className="mt-2 w-full rounded-button border border-bg-border bg-bg-main px-4 py-2.5 text-sm" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">What do you specifically like about them?</label>
                <textarea value={collegeListWhatLike} onChange={(e) => setCollegeListWhatLike(e.target.value)} rows={3} className="mt-2 w-full rounded-button border border-bg-border bg-bg-main px-4 py-2.5 text-sm" placeholder="Optional" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary">Do you plan to apply Early Decision, Early Action, or Regular Decision?</label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(["ED", "EA", "RD", "Not sure"] as const).map((opt) => (
                <button key={opt} type="button" onClick={() => setApplicationStrategy(opt)} className={`onboarding-option-card ${applicationStrategy === opt ? "onboarding-option-card-selected" : ""}`}>{opt}</button>
              ))}
            </div>
          </div>

        </form>

        <section className="mt-8 onboarding-card rounded-2xl border-2 border-bg-border bg-white p-5 shadow-soft animate-in fade-in slide-in-from-bottom-3 duration-300" aria-label="Profile summary">
          <div className="flex items-center gap-3 pb-4 border-b border-bg-border">
            <div className="onboarding-icon-box text-primary-600 border-primary-500/30 bg-primary-500/10">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Profile Summary</h2>
              <p className="text-xs text-text-muted">Key fields from your answers.</p>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            {(answers.firstName || answers.lastName) && (
              <SummaryRow icon={<User className="h-4 w-4" />} label="Name" value={[answers.firstName, answers.lastName].filter(Boolean).join(" ")} />
            )}
            {answers.dateOfBirth && (
              <SummaryRow icon={<CalendarDays className="h-4 w-4" />} label="Date of birth" value={`${formatDateOfBirth(answers.dateOfBirth)}${ageFromDateOfBirth(answers.dateOfBirth) != null ? ` (Age: ${ageFromDateOfBirth(answers.dateOfBirth)} years)` : ""}`} />
            )}
            {answers.gender && (
              <SummaryRow icon={<User className="h-4 w-4" />} label="Gender" value={`${answers.gender}${answers.gender === "Other" && answers.genderOther ? ` — ${answers.genderOther}` : ""}`} />
            )}
            {(answers.city || answers.state || answers.country) && (
              <SummaryRow icon={<MapPin className="h-4 w-4" />} label="Location" value={[answers.city, answers.state, answers.country].filter(Boolean).join(", ")} />
            )}
            {answers.currentHighSchool && <SummaryRow icon={<School className="h-4 w-4" />} label="Current high school" value={answers.currentHighSchool} />}
            {(answers.expectedGraduationYear != null || gradYear != null) && (
              <SummaryRow icon={<GraduationCap className="h-4 w-4" />} label="Expected graduation year" value={String(answers.expectedGraduationYear ?? gradYear ?? "—")} />
            )}
            {(answers.gradeLevel || gradYear != null) && (
              <SummaryRow icon={<School className="h-4 w-4" />} label="Grade" value={`${answers.gradeLevel ?? "—"}${gradYear != null ? ` (${gradYear})` : ""}`} />
            )}
            {answers.gpa != null && <SummaryRow icon={<Gauge className="h-4 w-4" />} label="GPA" value={`${answers.gpa} (${answers.gpaScale ?? 4}.0 scale)`} />}
            {(answers.satScore != null || answers.actScore != null) && (
              <SummaryRow icon={<BookOpen className="h-4 w-4" />} label="Test scores" value={[answers.satScore != null ? `SAT ${answers.satTotal ?? answers.satScore}` : null, answers.actScore != null ? `ACT ${answers.actScore}` : null].filter(Boolean).join(", ")} />
            )}
            {(locationPreferenceStates.length > 0 || answers.preferredStates?.length) && (
              <SummaryRow icon={<Map className="h-4 w-4" />} label="Target states" value={(locationPreferenceStates.length ? locationPreferenceStates : answers.preferredStates ?? []).join(", ")} />
            )}
            {(campusUrbanSuburbanRural || answers.preferredSize) && (
              <SummaryRow icon={<Building2 className="h-4 w-4" />} label="Campus" value={campusUrbanSuburbanRural || answers.preferredSize || "—"} />
            )}
          </div>
          {!answers.firstName && !answers.lastName && !answers.gradeLevel && answers.gpa == null && !answers.satScore && !answers.actScore && !locationPreferenceStates.length && !answers.preferredStates?.length && (
            <p className="mt-4 text-center text-sm text-text-muted py-6 rounded-xl bg-secondary-100/50">Complete the steps above to see your summary.</p>
          )}
        </section>
      </OnboardingStepCard>
    </>
  );
}

export default function OnboardingStep6Page() {
  return (
    <Suspense fallback={null}>
      <OnboardingStep6Content />
    </Suspense>
  );
}
