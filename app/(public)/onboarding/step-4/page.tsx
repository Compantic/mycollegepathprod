"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveOnboardingDraft, getOnboardingDraft, persistOnboardingToFirestore } from "@/lib/onboarding/storage";
import { auth } from "@/lib/firebase/client";
import type { ExamType, TutoringBenefit, CollegeCreditsAnswer, ResearchProgramsAnswer } from "@/lib/onboarding/schema";
import { STEP_CONFIG } from "@/lib/onboarding/stepConfig";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileCheck } from "lucide-react";

const EXAM_OPTIONS: ExamType[] = ["ACT", "SAT", "SAT Subject", "AP", "IB", "Cambridge", "TOEFL", "PTE Academic", "IELTS", "Duolingo", "PSAT"];
const TUTORING_OPTS: { value: TutoringBenefit; label: string }[] = [
  { value: "Individual", label: "Individual" },
  { value: "Small group", label: "Small group" },
  { value: "Large group", label: "Large group" },
  { value: "No", label: "No" },
];

function OnboardingStep4Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProfile = searchParams.get("from") === "profile";
  const [gpa, setGpa] = useState<string>("");
  const [gpaScale, setGpaScale] = useState<4 | 5>(4);
  const [examsTaken, setExamsTaken] = useState<ExamType[]>([]);
  const [psatTotal, setPsatTotal] = useState("");
  const [satRW, setSatRW] = useState("");
  const [satMath, setSatMath] = useState("");
  const [satTotal, setSatTotal] = useState("");
  const [actComposite, setActComposite] = useState("");
  const [actEnglish, setActEnglish] = useState("");
  const [actMath, setActMath] = useState("");
  const [actReading, setActReading] = useState("");
  const [actScience, setActScience] = useState("");
  const [apExamsCount, setApExamsCount] = useState("");
  const [apAverageScore, setApAverageScore] = useState("");
  const [ibTotal, setIbTotal] = useState("");
  const [toeflScore, setToeflScore] = useState("");
  const [ieltsScore, setIeltsScore] = useState("");
  const [duolingoScore, setDuolingoScore] = useState("");
  const [pteScore, setPteScore] = useState("");
  const [rigorousApCompleted, setRigorousApCompleted] = useState("");
  const [rigorousApThisYear, setRigorousApThisYear] = useState("");
  const [rigorousIbCompleted, setRigorousIbCompleted] = useState("");
  const [rigorousIbThisYear, setRigorousIbThisYear] = useState("");
  const [rigorousHonorsCompleted, setRigorousHonorsCompleted] = useState("");
  const [rigorousHonorsThisYear, setRigorousHonorsThisYear] = useState("");
  const [collegeCredits, setCollegeCredits] = useState<CollegeCreditsAnswer | "">("");
  const [collegeCreditsDetail, setCollegeCreditsDetail] = useState("");
  const [researchPrograms, setResearchPrograms] = useState<ResearchProgramsAnswer | "">("");
  const [researchProgramsDetail, setResearchProgramsDetail] = useState("");
  const [tutoringBenefit, setTutoringBenefit] = useState<TutoringBenefit | "">("");
  const [difficultiesOptional, setDifficultiesOptional] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const d = getOnboardingDraft();
    if (d.gpa != null) setGpa(String(d.gpa));
    if (d.gpaScale) setGpaScale(d.gpaScale);
    if (d.examsTaken?.length) setExamsTaken(d.examsTaken);
    if (d.psatTotal != null) setPsatTotal(String(d.psatTotal));
    if (d.satReadingWriting != null) setSatRW(String(d.satReadingWriting));
    if (d.satMath != null) setSatMath(String(d.satMath));
    if (d.satTotal != null) setSatTotal(String(d.satTotal));
    if (d.actComposite != null) setActComposite(String(d.actComposite));
    if (d.actEnglish != null) setActEnglish(String(d.actEnglish));
    if (d.actMath != null) setActMath(String(d.actMath));
    if (d.actReading != null) setActReading(String(d.actReading));
    if (d.actScience != null) setActScience(String(d.actScience));
    if (d.apExamsCount != null) setApExamsCount(String(d.apExamsCount));
    if (d.apAverageScore != null) setApAverageScore(String(d.apAverageScore));
    if (d.ibTotal != null) setIbTotal(String(d.ibTotal));
    if (d.toeflScore != null) setToeflScore(String(d.toeflScore));
    if (d.ieltsScore != null) setIeltsScore(String(d.ieltsScore));
    if (d.duolingoScore != null) setDuolingoScore(String(d.duolingoScore));
    if (d.pteScore != null) setPteScore(String(d.pteScore));
    if (d.rigorousApCompleted != null) setRigorousApCompleted(String(d.rigorousApCompleted));
    if (d.rigorousApThisYear != null) setRigorousApThisYear(String(d.rigorousApThisYear));
    if (d.rigorousIbCompleted != null) setRigorousIbCompleted(String(d.rigorousIbCompleted));
    if (d.rigorousIbThisYear != null) setRigorousIbThisYear(String(d.rigorousIbThisYear));
    if (d.rigorousHonorsCompleted != null) setRigorousHonorsCompleted(String(d.rigorousHonorsCompleted));
    if (d.rigorousHonorsThisYear != null) setRigorousHonorsThisYear(String(d.rigorousHonorsThisYear));
    if (d.collegeCredits) setCollegeCredits(d.collegeCredits);
    if (d.collegeCreditsDetail) setCollegeCreditsDetail(d.collegeCreditsDetail);
    if (d.researchPrograms) setResearchPrograms(d.researchPrograms);
    if (d.researchProgramsDetail) setResearchProgramsDetail(d.researchProgramsDetail);
    if (d.tutoringBenefit) setTutoringBenefit(d.tutoringBenefit);
    if (d.difficultiesOptional) setDifficultiesOptional(d.difficultiesOptional);
  }, []);

  function toggleExam(exam: ExamType) {
    setExamsTaken((prev) => (prev.includes(exam) ? prev.filter((e) => e !== exam) : [...prev, exam]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    const gpaNum = gpa.trim() ? parseFloat(gpa) : undefined;
    if (gpaNum != null && (Number.isNaN(gpaNum) || gpaNum < 0 || gpaNum > gpaScale)) {
      err.gpa = `GPA must be between 0 and ${gpaScale}.`;
    }
    setErrors(err);
    if (Object.keys(err).length) return;

    const num = (s: string) => (s.trim() ? parseInt(s, 10) : undefined);
    const f = (s: string) => (s.trim() ? parseFloat(s) : undefined);
    saveOnboardingDraft({
      gpa: gpaNum,
      gpaScale,
      examsTaken: examsTaken.length ? examsTaken : undefined,
      psatTotal: num(psatTotal),
      satReadingWriting: num(satRW),
      satMath: num(satMath),
      satTotal: num(satTotal),
      actComposite: num(actComposite),
      actEnglish: num(actEnglish),
      actMath: num(actMath),
      actReading: num(actReading),
      actScience: num(actScience),
      apExamsCount: num(apExamsCount),
      apAverageScore: f(apAverageScore),
      ibTotal: num(ibTotal),
      toeflScore: num(toeflScore),
      ieltsScore: f(ieltsScore),
      duolingoScore: num(duolingoScore),
      pteScore: num(pteScore),
      rigorousApCompleted: num(rigorousApCompleted),
      rigorousApThisYear: num(rigorousApThisYear),
      rigorousIbCompleted: num(rigorousIbCompleted),
      rigorousIbThisYear: num(rigorousIbThisYear),
      rigorousHonorsCompleted: num(rigorousHonorsCompleted),
      rigorousHonorsThisYear: num(rigorousHonorsThisYear),
      collegeCredits: collegeCredits || undefined,
      collegeCreditsDetail: collegeCredits === "Yes" ? collegeCreditsDetail.trim() || undefined : undefined,
      researchPrograms: researchPrograms || undefined,
      researchProgramsDetail: researchPrograms === "Yes" ? researchProgramsDetail.trim() || undefined : undefined,
      tutoringBenefit: tutoringBenefit || undefined,
      difficultiesOptional: difficultiesOptional.trim() || undefined,
      // Keep legacy fields for matching
      satScore: num(satTotal) ?? num(satRW) ? (num(satRW) ?? 0) + (num(satMath) ?? 0) : undefined,
      actScore: num(actComposite),
    });
    if (fromProfile && auth.currentUser) {
      await persistOnboardingToFirestore(auth.currentUser.uid, getOnboardingDraft());
      router.push("/app/profile");
      return;
    }
    router.push("/onboarding/step-5");
  }

  const config = STEP_CONFIG[4];

  return (
    <OnboardingStepCard
      title={config.title}
      subtitle={config.description}
      icon={<FileCheck className="h-5 w-5" />}
      showPrivacyFooter
      formId="onboarding-step4-form"
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => router.push(fromProfile ? "/app/profile" : "/onboarding/step-3")}>Back</Button>
          <Button type="submit" form="onboarding-step4-form" className="gap-2">Next <span aria-hidden>→</span></Button>
        </>
      }
    >
      <form id="onboarding-step4-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary">Your GPA</label>
            <p className="mt-0.5 text-xs text-text-muted">Choose scale, then enter value. Optional.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 max-w-xs">
              <button type="button" onClick={() => setGpaScale(4)} className={`onboarding-option-card ${gpaScale === 4 ? "onboarding-option-card-selected" : ""}`}>4.0 scale</button>
              <button type="button" onClick={() => setGpaScale(5)} className={`onboarding-option-card ${gpaScale === 5 ? "onboarding-option-card-selected" : ""}`}>5.0 scale</button>
            </div>
            <Input type="number" step="0.1" min={0} max={gpaScale} value={gpa} onChange={(e) => setGpa(e.target.value)} placeholder={`e.g. 3.6 (0.0–${gpaScale}.0)`} className="mt-3 w-32 onboarding-input h-11" />
            {errors.gpa && <p className="mt-1 text-sm text-status-dangerText">{errors.gpa}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">Exams taken (check all that apply)</label>
            <p className="mt-0.5 text-xs text-text-muted">Optional. Click to select multiple.</p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {EXAM_OPTIONS.map((exam) => (
                <button key={exam} type="button" onClick={() => toggleExam(exam)} className={`onboarding-option-card text-left ${examsTaken.includes(exam) ? "onboarding-option-card-selected" : ""}`}>{exam}</button>
              ))}
            </div>
          </div>

          {examsTaken.includes("PSAT") && (
            <div>
              <label className="block text-sm font-medium text-text-primary">PSAT: Total</label>
              <Input type="number" value={psatTotal} onChange={(e) => setPsatTotal(e.target.value)} placeholder="e.g. 1200" className="mt-2 w-32" />
            </div>
          )}
          {examsTaken.includes("SAT") && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-text-primary">SAT Reading & Writing</label>
                <Input type="number" value={satRW} onChange={(e) => setSatRW(e.target.value)} placeholder="e.g. 340 (200–800)" className="mt-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">SAT Math</label>
                <Input type="number" value={satMath} onChange={(e) => setSatMath(e.target.value)} placeholder="e.g. 720 (200–800)" className="mt-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">SAT Total (optional)</label>
                <Input type="number" value={satTotal} onChange={(e) => setSatTotal(e.target.value)} placeholder="e.g. 1060 (400–1600)" className="mt-2" />
              </div>
            </div>
          )}
          {examsTaken.includes("ACT") && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-primary">ACT Composite</label>
                <Input type="number" min={1} max={36} value={actComposite} onChange={(e) => setActComposite(e.target.value)} placeholder="e.g. 28 (1–36)" className="mt-2 w-24" />
              </div>
              <p className="text-xs text-text-muted">Optional section scores:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Input type="number" placeholder="English (1–36)" value={actEnglish} onChange={(e) => setActEnglish(e.target.value)} />
                <Input type="number" placeholder="Math (1–36)" value={actMath} onChange={(e) => setActMath(e.target.value)} />
                <Input type="number" placeholder="Reading (1–36)" value={actReading} onChange={(e) => setActReading(e.target.value)} />
                <Input type="number" placeholder="Science (1–36)" value={actScience} onChange={(e) => setActScience(e.target.value)} />
              </div>
            </div>
          )}
          {examsTaken.includes("AP") && (
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary">Number of AP exams</label>
                <Input type="number" value={apExamsCount} onChange={(e) => setApExamsCount(e.target.value)} placeholder="e.g. 3" className="mt-2 w-24" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">Average score (optional)</label>
                <Input type="number" min={1} max={5} step="0.5" value={apAverageScore} onChange={(e) => setApAverageScore(e.target.value)} placeholder="e.g. 4.0" className="mt-2 w-24" />
              </div>
            </div>
          )}
          {examsTaken.includes("IB") && (
            <div>
              <label className="block text-sm font-medium text-text-primary">IB predicted/achieved total</label>
              <Input type="number" value={ibTotal} onChange={(e) => setIbTotal(e.target.value)} placeholder="e.g. 42" className="mt-2 w-24" />
            </div>
          )}
          {(examsTaken.includes("TOEFL") || examsTaken.includes("IELTS") || examsTaken.includes("Duolingo") || examsTaken.includes("PTE Academic")) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {examsTaken.includes("TOEFL") && <div><label className="block text-sm font-medium text-text-primary">TOEFL</label><Input type="number" value={toeflScore} onChange={(e) => setToeflScore(e.target.value)} placeholder="e.g. 100" className="mt-2" /></div>}
              {examsTaken.includes("IELTS") && <div><label className="block text-sm font-medium text-text-primary">IELTS</label><Input type="number" step="0.5" value={ieltsScore} onChange={(e) => setIeltsScore(e.target.value)} placeholder="e.g. 7.0" className="mt-2" /></div>}
              {examsTaken.includes("Duolingo") && <div><label className="block text-sm font-medium text-text-primary">Duolingo</label><Input type="number" value={duolingoScore} onChange={(e) => setDuolingoScore(e.target.value)} placeholder="e.g. 120" className="mt-2" /></div>}
              {examsTaken.includes("PTE Academic") && <div><label className="block text-sm font-medium text-text-primary">PTE Academic</label><Input type="number" value={pteScore} onChange={(e) => setPteScore(e.target.value)} placeholder="e.g. 65" className="mt-2" /></div>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary">Rigorous courses: AP, IB, Honors — completed and this year</label>
            <p className="mt-0.5 text-xs text-text-muted mb-3">Optional. Two numbers per type. Enter numbers directly (no spinner arrows).</p>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl border-2 border-bg-border bg-secondary-100/30 p-4 space-y-3">
                <span className="text-sm font-semibold text-primary-600">AP</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">Completed</label>
                    <Input type="number" min={0} placeholder="0" value={rigorousApCompleted} onChange={(e) => setRigorousApCompleted(e.target.value)} className="onboarding-input h-11 w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">This year</label>
                    <Input type="number" min={0} placeholder="0" value={rigorousApThisYear} onChange={(e) => setRigorousApThisYear(e.target.value)} className="onboarding-input h-11 w-full" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border-2 border-bg-border bg-secondary-100/30 p-4 space-y-3">
                <span className="text-sm font-semibold text-primary-600">IB</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">Completed</label>
                    <Input type="number" min={0} placeholder="0" value={rigorousIbCompleted} onChange={(e) => setRigorousIbCompleted(e.target.value)} className="onboarding-input h-11 w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">This year</label>
                    <Input type="number" min={0} placeholder="0" value={rigorousIbThisYear} onChange={(e) => setRigorousIbThisYear(e.target.value)} className="onboarding-input h-11 w-full" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border-2 border-bg-border bg-secondary-100/30 p-4 space-y-3">
                <span className="text-sm font-semibold text-primary-600">Honors</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">Completed</label>
                    <Input type="number" min={0} placeholder="0" value={rigorousHonorsCompleted} onChange={(e) => setRigorousHonorsCompleted(e.target.value)} className="onboarding-input h-11 w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">This year</label>
                    <Input type="number" min={0} placeholder="0" value={rigorousHonorsThisYear} onChange={(e) => setRigorousHonorsThisYear(e.target.value)} className="onboarding-input h-11 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">Have you received any college credits? If yes, from which college?</label>
            <div className="mt-3 grid grid-cols-2 gap-3 max-w-xs">
              <button type="button" onClick={() => setCollegeCredits("Yes")} className={`onboarding-option-card ${collegeCredits === "Yes" ? "onboarding-option-card-selected" : ""}`}>Yes</button>
              <button type="button" onClick={() => setCollegeCredits("No")} className={`onboarding-option-card ${collegeCredits === "No" ? "onboarding-option-card-selected" : ""}`}>No</button>
            </div>
            {collegeCredits === "Yes" && <textarea value={collegeCreditsDetail} onChange={(e) => setCollegeCreditsDetail(e.target.value)} rows={2} placeholder="Which college(s)?" className="mt-3 w-full rounded-xl border-2 border-bg-border bg-bg-main px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">Have you attended any programs at a college or done research with a college professor?</label>
            <div className="mt-3 grid grid-cols-2 gap-3 max-w-xs">
              <button type="button" onClick={() => setResearchPrograms("Yes")} className={`onboarding-option-card ${researchPrograms === "Yes" ? "onboarding-option-card-selected" : ""}`}>Yes</button>
              <button type="button" onClick={() => setResearchPrograms("No")} className={`onboarding-option-card ${researchPrograms === "No" ? "onboarding-option-card-selected" : ""}`}>No</button>
            </div>
            {researchPrograms === "Yes" && <textarea value={researchProgramsDetail} onChange={(e) => setResearchProgramsDetail(e.target.value)} rows={2} placeholder="Describe" className="mt-3 w-full rounded-xl border-2 border-bg-border bg-bg-main px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">I believe I will benefit from Tutoring:</label>
            <p className="mt-0.5 text-xs text-text-muted">Optional</p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TUTORING_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setTutoringBenefit(o.value)} className={`onboarding-option-card ${tutoringBenefit === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">Any irregularities or difficulties during your preparation or in high school? (Optional)</label>
            <textarea value={difficultiesOptional} onChange={(e) => setDifficultiesOptional(e.target.value)} rows={3} className="mt-2 w-full rounded-button border border-bg-border bg-bg-main px-4 py-2.5 text-sm placeholder:text-text-muted" placeholder="Optional" />
          </div>

        </form>
    </OnboardingStepCard>
  );
}

export default function OnboardingStep4Page() {
  return (
    <Suspense fallback={null}>
      <OnboardingStep4Content />
    </Suspense>
  );
}
