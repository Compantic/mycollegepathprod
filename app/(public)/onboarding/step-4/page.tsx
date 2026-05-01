"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveOnboardingDraft, getOnboardingDraft, persistOnboardingToFirestore } from "@/lib/onboarding/storage";
import { auth } from "@/lib/firebase/client";
import type { ExamType, CollegeCreditsAnswer, ResearchProgramsAnswer } from "@/lib/onboarding/schema";
import { STEP_CONFIG } from "@/lib/onboarding/stepConfig";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileCheck, Plus, Trash2 } from "lucide-react";
import type { RigorousCourse } from "@/lib/onboarding/schema";

const EXAM_OPTIONS: ExamType[] = ["SAT", "ACT", "AP", "IB", "TOEFL", "IELTS", "Duolingo", "PTE", "PSAT"];
const EXAM_RANGES = {
  psatTotal: { min: 320, max: 1520 },
  satSection: { min: 200, max: 800 },
  satTotal: { min: 400, max: 1600 },
  act: { min: 1, max: 36 },
  apAverage: { min: 1, max: 5 },
  ibTotal: { min: 1, max: 45 },
  toefl: { min: 0, max: 120 },
  ielts: { min: 0, max: 9 },
  duolingo: { min: 10, max: 160 },
  pte: { min: 10, max: 90 },
} as const;

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
  const [rigorousApDetails, setRigorousApDetails] = useState("");
  const [rigorousIbDetails, setRigorousIbDetails] = useState("");
  const [rigorousHonorsDetails, setRigorousHonorsDetails] = useState("");

  const [rigorousApCourses, setRigorousApCourses] = useState<RigorousCourse[]>([]);
  const [rigorousIbCourses, setRigorousIbCourses] = useState<RigorousCourse[]>([]);
  const [rigorousHonorsCourses, setRigorousHonorsCourses] = useState<RigorousCourse[]>([]);
  const [collegeCredits, setCollegeCredits] = useState<CollegeCreditsAnswer | "">("");
  const [collegeCreditsDetail, setCollegeCreditsDetail] = useState("");
  const [researchPrograms, setResearchPrograms] = useState<ResearchProgramsAnswer | "">("");
  const [researchProgramsDetail, setResearchProgramsDetail] = useState("");
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
    if (d.rigorousApDetails) setRigorousApDetails(d.rigorousApDetails);
    if (d.rigorousIbDetails) setRigorousIbDetails(d.rigorousIbDetails);
    if (d.rigorousHonorsDetails) setRigorousHonorsDetails(d.rigorousHonorsDetails);
    if (d.rigorousApCourses) setRigorousApCourses(d.rigorousApCourses);
    if (d.rigorousIbCourses) setRigorousIbCourses(d.rigorousIbCourses);
    if (d.rigorousHonorsCourses) setRigorousHonorsCourses(d.rigorousHonorsCourses);
    if (d.collegeCredits) setCollegeCredits(d.collegeCredits);
    if (d.collegeCreditsDetail) setCollegeCreditsDetail(d.collegeCreditsDetail);
    if (d.researchPrograms) setResearchPrograms(d.researchPrograms);
    if (d.researchProgramsDetail) setResearchProgramsDetail(d.researchProgramsDetail);
    if (d.difficultiesOptional) setDifficultiesOptional(d.difficultiesOptional);
  }, []);

  // Auto-calculate SAT Total when Reading and Math are entered
  useEffect(() => {
    const rw = parseInt(satRW, 10);
    const math = parseInt(satMath, 10);
    if (!isNaN(rw) && !isNaN(math)) {
      setSatTotal(String(rw + math));
    }
  }, [satRW, satMath]);

  // Auto-calculate counts from course lists
  useEffect(() => {
    const comp = rigorousApCourses.filter(c => c.status === "Completed").length;
    const curr = rigorousApCourses.filter(c => c.status === "This Year").length;
    if (rigorousApCourses.length > 0) {
      setRigorousApCompleted(String(comp));
      setRigorousApThisYear(String(curr));
    }
  }, [rigorousApCourses]);

  useEffect(() => {
    const comp = rigorousIbCourses.filter(c => c.status === "Completed").length;
    const curr = rigorousIbCourses.filter(c => c.status === "This Year").length;
    if (rigorousIbCourses.length > 0) {
      setRigorousIbCompleted(String(comp));
      setRigorousIbThisYear(String(curr));
    }
  }, [rigorousIbCourses]);

  useEffect(() => {
    const comp = rigorousHonorsCourses.filter(c => c.status === "Completed").length;
    const curr = rigorousHonorsCourses.filter(c => c.status === "This Year").length;
    if (rigorousHonorsCourses.length > 0) {
      setRigorousHonorsCompleted(String(comp));
      setRigorousHonorsThisYear(String(curr));
    }
  }, [rigorousHonorsCourses]);

  function handleBoundedInputChange(
    rawValue: string,
    setValue: (v: string) => void,
    min: number,
    max: number,
    allowDecimal = false
  ) {
    const value = rawValue.replace(",", ".");
    const pattern = allowDecimal ? /^\d*(\.\d*)?$/ : /^\d*$/;
    if (!pattern.test(value)) return;
    if (value === "") {
      setValue("");
      return;
    }
    if (allowDecimal && value === ".") {
      setValue("0.");
      return;
    }
    const parsed = allowDecimal ? Number(value) : parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < min || parsed > max) return;
    setValue(value);
  }

  function addCourse(category: 'ap' | 'ib' | 'honors') {
    const newCourse: RigorousCourse = { name: "", status: "Completed" };
    if (category === 'ap') setRigorousApCourses([...rigorousApCourses, newCourse]);
    else if (category === 'ib') setRigorousIbCourses([...rigorousIbCourses, newCourse]);
    else if (category === 'honors') setRigorousHonorsCourses([...rigorousHonorsCourses, newCourse]);
  }

  function updateCourse(category: 'ap' | 'ib' | 'honors', index: number, updates: Partial<RigorousCourse>) {
    if (category === 'ap') {
      const next = [...rigorousApCourses];
      next[index] = { ...next[index], ...updates };
      setRigorousApCourses(next);
    } else if (category === 'ib') {
      const next = [...rigorousIbCourses];
      next[index] = { ...next[index], ...updates };
      setRigorousIbCourses(next);
    } else if (category === 'honors') {
      const next = [...rigorousHonorsCourses];
      next[index] = { ...next[index], ...updates };
      setRigorousHonorsCourses(next);
    }
  }

  function removeCourse(category: 'ap' | 'ib' | 'honors', index: number) {
    if (category === 'ap') setRigorousApCourses(rigorousApCourses.filter((_, i) => i !== index));
    else if (category === 'ib') setRigorousIbCourses(rigorousIbCourses.filter((_, i) => i !== index));
    else if (category === 'honors') setRigorousHonorsCourses(rigorousHonorsCourses.filter((_, i) => i !== index));
  }

  function toggleExam(exam: ExamType) {
    setExamsTaken((prev) => (prev.includes(exam) ? prev.filter((e) => e !== exam) : [...prev, exam]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!gpa.trim()) {
      err.gpa = "GPA is required.";
    } else {
      const gpaNum = parseFloat(gpa);
      if (Number.isNaN(gpaNum) || gpaNum < 0 || gpaNum > gpaScale) {
        err.gpa = `GPA must be between 0 and ${gpaScale}.`;
      }
    }
    const validateNumber = (
      key: string,
      value: string,
      min: number,
      max: number,
      label: string,
      integerOnly = true
    ) => {
      if (!value.trim()) return;
      const parsed = integerOnly ? parseInt(value, 10) : parseFloat(value);
      if (Number.isNaN(parsed) || parsed < min || parsed > max) {
        err[key] = `${label} must be between ${min} and ${max}.`;
      }
    };
    if (examsTaken.includes("PSAT")) {
      validateNumber("psatTotal", psatTotal, EXAM_RANGES.psatTotal.min, EXAM_RANGES.psatTotal.max, "PSAT total");
    }
    if (examsTaken.includes("SAT")) {
      validateNumber("satRW", satRW, EXAM_RANGES.satSection.min, EXAM_RANGES.satSection.max, "SAT Reading & Writing");
      validateNumber("satMath", satMath, EXAM_RANGES.satSection.min, EXAM_RANGES.satSection.max, "SAT Math");
      validateNumber("satTotal", satTotal, EXAM_RANGES.satTotal.min, EXAM_RANGES.satTotal.max, "SAT total");
    }
    if (examsTaken.includes("ACT")) {
      validateNumber("actComposite", actComposite, EXAM_RANGES.act.min, EXAM_RANGES.act.max, "ACT composite");
      validateNumber("actEnglish", actEnglish, EXAM_RANGES.act.min, EXAM_RANGES.act.max, "ACT English");
      validateNumber("actMath", actMath, EXAM_RANGES.act.min, EXAM_RANGES.act.max, "ACT Math");
      validateNumber("actReading", actReading, EXAM_RANGES.act.min, EXAM_RANGES.act.max, "ACT Reading");
      validateNumber("actScience", actScience, EXAM_RANGES.act.min, EXAM_RANGES.act.max, "ACT Science");
    }
    if (examsTaken.includes("AP")) {
      validateNumber("apAverageScore", apAverageScore, EXAM_RANGES.apAverage.min, EXAM_RANGES.apAverage.max, "AP average score", false);
    }
    if (examsTaken.includes("IB")) {
      validateNumber("ibTotal", ibTotal, EXAM_RANGES.ibTotal.min, EXAM_RANGES.ibTotal.max, "IB total");
    }
    if (examsTaken.includes("TOEFL")) {
      validateNumber("toeflScore", toeflScore, EXAM_RANGES.toefl.min, EXAM_RANGES.toefl.max, "TOEFL score");
    }
    if (examsTaken.includes("IELTS")) {
      validateNumber("ieltsScore", ieltsScore, EXAM_RANGES.ielts.min, EXAM_RANGES.ielts.max, "IELTS score", false);
    }
    if (examsTaken.includes("Duolingo")) {
      validateNumber("duolingoScore", duolingoScore, EXAM_RANGES.duolingo.min, EXAM_RANGES.duolingo.max, "Duolingo score");
    }
    if (examsTaken.includes("PTE")) {
      validateNumber("pteScore", pteScore, EXAM_RANGES.pte.min, EXAM_RANGES.pte.max, "PTE score");
    }
    setErrors(err);
    if (Object.keys(err).length) return;

    const gpaNum = parseFloat(gpa.trim());
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
      rigorousApDetails: rigorousApDetails.trim() || undefined,
      rigorousApCourses: rigorousApCourses.filter(c => c.name.trim()).length ? rigorousApCourses.filter(c => c.name.trim()) : undefined,
      rigorousIbCompleted: num(rigorousIbCompleted),
      rigorousIbThisYear: num(rigorousIbThisYear),
      rigorousIbDetails: rigorousIbDetails.trim() || undefined,
      rigorousIbCourses: rigorousIbCourses.filter(c => c.name.trim()).length ? rigorousIbCourses.filter(c => c.name.trim()) : undefined,
      rigorousHonorsCompleted: num(rigorousHonorsCompleted),
      rigorousHonorsThisYear: num(rigorousHonorsThisYear),
      rigorousHonorsDetails: rigorousHonorsDetails.trim() || undefined,
      rigorousHonorsCourses: rigorousHonorsCourses.filter(c => c.name.trim()).length ? rigorousHonorsCourses.filter(c => c.name.trim()) : undefined,
      collegeCredits: collegeCredits || undefined,
      collegeCreditsDetail: collegeCredits === "Yes" ? collegeCreditsDetail.trim() || undefined : undefined,
      researchPrograms: researchPrograms || undefined,
      researchProgramsDetail: researchPrograms === "Yes" ? researchProgramsDetail.trim() || undefined : undefined,
      difficultiesOptional: difficultiesOptional.trim() || undefined,
      satScore: num(satTotal) ?? (num(satRW) != null || num(satMath) != null ? (num(satRW) ?? 0) + (num(satMath) ?? 0) : undefined),
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
          <label className="block text-sm font-medium text-text-primary">GPA</label>
          <p className="mt-0.5 text-xs text-text-muted">Required — choose scale, then enter your GPA.</p>
          <div className="mt-3 grid grid-cols-2 gap-3 max-w-xs">
            <button type="button" onClick={() => setGpaScale(4)} className={`onboarding-option-card ${gpaScale === 4 ? "onboarding-option-card-selected" : ""}`}>4.0 scale</button>
            <button type="button" onClick={() => setGpaScale(5)} className={`onboarding-option-card ${gpaScale === 5 ? "onboarding-option-card-selected" : ""}`}>5.0 scale</button>
          </div>
          <Input
            type="number"
            step="0.01"
            min={0}
            max={gpaScale}
            value={gpa}
            onChange={(e) => handleBoundedInputChange(e.target.value, setGpa, 0, gpaScale, true)}
            placeholder={`e.g. 3.6 (0.0–${gpaScale}.0)`}
            className="mt-3 w-32 onboarding-input h-11"
            required
          />
          {errors.gpa && <p className="mt-1 text-sm text-status-dangerText">{errors.gpa}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary">Exams taken</label>
          <p className="mt-0.5 text-xs text-text-muted">Optional — select all that apply</p>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {EXAM_OPTIONS.map((exam) => (
              <button key={exam} type="button" onClick={() => toggleExam(exam)} className={`onboarding-option-card text-left ${examsTaken.includes(exam) ? "onboarding-option-card-selected" : ""}`}>{exam}</button>
            ))}
          </div>
        </div>

        {examsTaken.includes("PSAT") && (
          <div>
            <label className="block text-sm font-medium text-text-primary">PSAT total</label>
          <Input
            type="number"
            min={EXAM_RANGES.psatTotal.min}
            max={EXAM_RANGES.psatTotal.max}
            value={psatTotal}
            onChange={(e) => handleBoundedInputChange(e.target.value, setPsatTotal, EXAM_RANGES.psatTotal.min, EXAM_RANGES.psatTotal.max)}
            placeholder="e.g. 1200"
            className="mt-2 w-32"
          />
          {errors.psatTotal && <p className="mt-1 text-sm text-status-dangerText">{errors.psatTotal}</p>}
          </div>
        )}
        {examsTaken.includes("SAT") && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-text-primary">SAT Reading & Writing</label>
              <Input
                type="number"
                min={EXAM_RANGES.satSection.min}
                max={EXAM_RANGES.satSection.max}
                value={satRW}
                onChange={(e) => handleBoundedInputChange(e.target.value, setSatRW, EXAM_RANGES.satSection.min, EXAM_RANGES.satSection.max)}
                placeholder="e.g. 340"
                className="mt-2"
              />
              {errors.satRW && <p className="mt-1 text-sm text-status-dangerText">{errors.satRW}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary">SAT Math</label>
              <Input
                type="number"
                min={EXAM_RANGES.satSection.min}
                max={EXAM_RANGES.satSection.max}
                value={satMath}
                onChange={(e) => handleBoundedInputChange(e.target.value, setSatMath, EXAM_RANGES.satSection.min, EXAM_RANGES.satSection.max)}
                placeholder="e.g. 720"
                className="mt-2"
              />
              {errors.satMath && <p className="mt-1 text-sm text-status-dangerText">{errors.satMath}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary">SAT total (optional)</label>
              <Input
                type="number"
                min={EXAM_RANGES.satTotal.min}
                max={EXAM_RANGES.satTotal.max}
                value={satTotal}
                onChange={(e) => handleBoundedInputChange(e.target.value, setSatTotal, EXAM_RANGES.satTotal.min, EXAM_RANGES.satTotal.max)}
                placeholder="e.g. 1060"
                className="mt-2"
              />
              {errors.satTotal && <p className="mt-1 text-sm text-status-dangerText">{errors.satTotal}</p>}
            </div>
          </div>
        )}
        {examsTaken.includes("ACT") && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-primary">ACT composite</label>
              <Input
                type="number"
                min={EXAM_RANGES.act.min}
                max={EXAM_RANGES.act.max}
                value={actComposite}
                onChange={(e) => handleBoundedInputChange(e.target.value, setActComposite, EXAM_RANGES.act.min, EXAM_RANGES.act.max)}
                placeholder="e.g. 28"
                className="mt-2 w-24"
              />
              {errors.actComposite && <p className="mt-1 text-sm text-status-dangerText">{errors.actComposite}</p>}
            </div>
            <p className="text-xs text-text-muted">Optional section scores:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Input type="number" min={EXAM_RANGES.act.min} max={EXAM_RANGES.act.max} placeholder="English" value={actEnglish} onChange={(e) => handleBoundedInputChange(e.target.value, setActEnglish, EXAM_RANGES.act.min, EXAM_RANGES.act.max)} />
              <Input type="number" min={EXAM_RANGES.act.min} max={EXAM_RANGES.act.max} placeholder="Math" value={actMath} onChange={(e) => handleBoundedInputChange(e.target.value, setActMath, EXAM_RANGES.act.min, EXAM_RANGES.act.max)} />
              <Input type="number" min={EXAM_RANGES.act.min} max={EXAM_RANGES.act.max} placeholder="Reading" value={actReading} onChange={(e) => handleBoundedInputChange(e.target.value, setActReading, EXAM_RANGES.act.min, EXAM_RANGES.act.max)} />
              <Input type="number" min={EXAM_RANGES.act.min} max={EXAM_RANGES.act.max} placeholder="Science" value={actScience} onChange={(e) => handleBoundedInputChange(e.target.value, setActScience, EXAM_RANGES.act.min, EXAM_RANGES.act.max)} />
            </div>
            {(errors.actEnglish || errors.actMath || errors.actReading || errors.actScience) && (
              <p className="text-sm text-status-dangerText">ACT section scores must be between {EXAM_RANGES.act.min} and {EXAM_RANGES.act.max}.</p>
            )}
          </div>
        )}
        {examsTaken.includes("AP") && (
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary">Number of AP exams</label>
              <Input type="number" min={0} max={99} value={apExamsCount} onChange={(e) => handleBoundedInputChange(e.target.value, setApExamsCount, 0, 99)} placeholder="e.g. 3" className="mt-2 w-24" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary">Average score (optional)</label>
              <Input type="number" min={EXAM_RANGES.apAverage.min} max={EXAM_RANGES.apAverage.max} step="0.5" value={apAverageScore} onChange={(e) => handleBoundedInputChange(e.target.value, setApAverageScore, EXAM_RANGES.apAverage.min, EXAM_RANGES.apAverage.max, true)} placeholder="e.g. 4.0" className="mt-2 w-24" />
              {errors.apAverageScore && <p className="mt-1 text-sm text-status-dangerText">{errors.apAverageScore}</p>}
            </div>
          </div>
        )}
        {examsTaken.includes("IB") && (
          <div>
            <label className="block text-sm font-medium text-text-primary">IB predicted / total</label>
            <Input type="number" min={EXAM_RANGES.ibTotal.min} max={EXAM_RANGES.ibTotal.max} value={ibTotal} onChange={(e) => handleBoundedInputChange(e.target.value, setIbTotal, EXAM_RANGES.ibTotal.min, EXAM_RANGES.ibTotal.max)} placeholder="e.g. 42" className="mt-2 w-24" />
            {errors.ibTotal && <p className="mt-1 text-sm text-status-dangerText">{errors.ibTotal}</p>}
          </div>
        )}
        {(examsTaken.includes("TOEFL") || examsTaken.includes("IELTS") || examsTaken.includes("Duolingo") || examsTaken.includes("PTE")) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {examsTaken.includes("TOEFL") && <div><label className="block text-sm font-medium text-text-primary">TOEFL</label><Input type="number" min={EXAM_RANGES.toefl.min} max={EXAM_RANGES.toefl.max} value={toeflScore} onChange={(e) => handleBoundedInputChange(e.target.value, setToeflScore, EXAM_RANGES.toefl.min, EXAM_RANGES.toefl.max)} placeholder="e.g. 100" className="mt-2" />{errors.toeflScore && <p className="mt-1 text-sm text-status-dangerText">{errors.toeflScore}</p>}</div>}
            {examsTaken.includes("IELTS") && <div><label className="block text-sm font-medium text-text-primary">IELTS</label><Input type="number" min={EXAM_RANGES.ielts.min} max={EXAM_RANGES.ielts.max} step="0.5" value={ieltsScore} onChange={(e) => handleBoundedInputChange(e.target.value, setIeltsScore, EXAM_RANGES.ielts.min, EXAM_RANGES.ielts.max, true)} placeholder="e.g. 7.0" className="mt-2" />{errors.ieltsScore && <p className="mt-1 text-sm text-status-dangerText">{errors.ieltsScore}</p>}</div>}
            {examsTaken.includes("Duolingo") && <div><label className="block text-sm font-medium text-text-primary">Duolingo</label><Input type="number" min={EXAM_RANGES.duolingo.min} max={EXAM_RANGES.duolingo.max} value={duolingoScore} onChange={(e) => handleBoundedInputChange(e.target.value, setDuolingoScore, EXAM_RANGES.duolingo.min, EXAM_RANGES.duolingo.max)} placeholder="e.g. 120" className="mt-2" />{errors.duolingoScore && <p className="mt-1 text-sm text-status-dangerText">{errors.duolingoScore}</p>}</div>}
            {examsTaken.includes("PTE") && <div><label className="block text-sm font-medium text-text-primary">PTE</label><Input type="number" min={EXAM_RANGES.pte.min} max={EXAM_RANGES.pte.max} value={pteScore} onChange={(e) => handleBoundedInputChange(e.target.value, setPteScore, EXAM_RANGES.pte.min, EXAM_RANGES.pte.max)} placeholder="e.g. 65" className="mt-2" />{errors.pteScore && <p className="mt-1 text-sm text-status-dangerText">{errors.pteScore}</p>}</div>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-primary">Course rigor: AP, IB, Honors</label>
          <p className="mt-0.5 text-xs text-text-muted mb-4 text-center leading-relaxed">Optional — Add specific courses and awards to strengthen your profile.</p>
          
          <div className="space-y-6">
            {/* AP Category */}
            <div className="rounded-2xl border-2 border-bg-border bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-bold text-sm">AP</span>
                  <h4 className="font-bold text-slate-800 tracking-tight text-center">Advanced Placement</h4>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed</p>
                    <p className="text-lg font-bold text-primary-700 leading-tight text-center">{rigorousApCompleted || "0"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">This Year</p>
                    <p className="text-lg font-bold text-emerald-600 leading-tight text-center">{rigorousApThisYear || "0"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {rigorousApCourses.map((course, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Input 
                      placeholder="e.g. AP World History" 
                      value={course.name} 
                      onChange={(e) => updateCourse('ap', idx, { name: e.target.value })} 
                      className="flex-1 h-10 text-sm"
                    />
                    <div className="flex gap-2">
                      <select 
                        value={course.status} 
                        onChange={(e) => updateCourse('ap', idx, { status: e.target.value as any })}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 outline-none"
                      >
                        <option value="Completed">Completed</option>
                        <option value="This Year">This Year</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => removeCourse('ap', idx)} 
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 hover:border-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => addCourse('ap')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 hover:border-primary-200 hover:text-primary-600 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  Add AP Course
                </button>
              </div>
            </div>

            {/* IB Category */}
            <div className="rounded-2xl border-2 border-bg-border bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm">IB</span>
                  <h4 className="font-bold text-slate-800 tracking-tight text-center">International Baccalaureate</h4>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed</p>
                    <p className="text-lg font-bold text-indigo-700 leading-tight text-center">{rigorousIbCompleted || "0"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">This Year</p>
                    <p className="text-lg font-bold text-emerald-600 leading-tight text-center">{rigorousIbThisYear || "0"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {rigorousIbCourses.map((course, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 animate-in fade-in slide-in-from-top-2 duration-200 text-center">
                    <Input 
                      placeholder="e.g. IB Physics HL" 
                      value={course.name} 
                      onChange={(e) => updateCourse('ib', idx, { name: e.target.value })} 
                      className="flex-1 h-10 text-sm"
                    />
                    <div className="flex gap-2">
                      <select 
                        value={course.status} 
                        onChange={(e) => updateCourse('ib', idx, { status: e.target.value as any })}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 outline-none"
                      >
                        <option value="Completed">Completed</option>
                        <option value="This Year">This Year</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => removeCourse('ib', idx)} 
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 hover:border-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => addCourse('ib')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  Add IB Course
                </button>
              </div>
            </div>

            {/* Honors Category */}
            <div className="rounded-2xl border-2 border-bg-border bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm">H</span>
                  <h4 className="font-bold text-slate-800 tracking-tight text-center">Honors Courses</h4>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed</p>
                    <p className="text-lg font-bold text-emerald-700 leading-tight text-center">{rigorousHonorsCompleted || "0"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">This Year</p>
                    <p className="text-lg font-bold text-emerald-600 leading-tight text-center">{rigorousHonorsThisYear || "0"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {rigorousHonorsCourses.map((course, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 animate-in fade-in slide-in-from-top-2 duration-200 text-center">
                    <Input 
                      placeholder="e.g. Honors Geometry" 
                      value={course.name} 
                      onChange={(e) => updateCourse('honors', idx, { name: e.target.value })} 
                      className="flex-1 h-10 text-sm"
                    />
                    <div className="flex gap-2">
                      <select 
                        value={course.status} 
                        onChange={(e) => updateCourse('honors', idx, { status: e.target.value as any })}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 outline-none"
                      >
                        <option value="Completed">Completed</option>
                        <option value="This Year">This Year</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => removeCourse('honors', idx)} 
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 hover:border-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => addCourse('honors')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 hover:border-emerald-200 hover:text-emerald-600 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  Add Honors Course
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary">College credits?</label>
          <p className="mt-0.5 text-xs text-text-muted">If yes, add details</p>
          <div className="mt-3 grid grid-cols-2 gap-3 max-w-xs">
            <button type="button" onClick={() => setCollegeCredits("Yes")} className={`onboarding-option-card ${collegeCredits === "Yes" ? "onboarding-option-card-selected" : ""}`}>Yes</button>
            <button type="button" onClick={() => setCollegeCredits("No")} className={`onboarding-option-card ${collegeCredits === "No" ? "onboarding-option-card-selected" : ""}`}>No</button>
          </div>
          {collegeCredits === "Yes" && <textarea value={collegeCreditsDetail} onChange={(e) => setCollegeCreditsDetail(e.target.value)} rows={2} placeholder="Which college(s)?" className="mt-3 w-full rounded-xl border-2 border-bg-border bg-bg-main px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary">College programs or research with a professor?</label>
          <div className="mt-3 grid grid-cols-2 gap-3 max-w-xs">
            <button type="button" onClick={() => setResearchPrograms("Yes")} className={`onboarding-option-card ${researchPrograms === "Yes" ? "onboarding-option-card-selected" : ""}`}>Yes</button>
            <button type="button" onClick={() => setResearchPrograms("No")} className={`onboarding-option-card ${researchPrograms === "No" ? "onboarding-option-card-selected" : ""}`}>No</button>
          </div>
          {researchPrograms === "Yes" && <textarea value={researchProgramsDetail} onChange={(e) => setResearchProgramsDetail(e.target.value)} rows={2} placeholder="Describe" className="mt-3 w-full rounded-xl border-2 border-bg-border bg-bg-main px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary">Difficulties or irregularities (optional)</label>
          <textarea value={difficultiesOptional} onChange={(e) => setDifficultiesOptional(e.target.value)} rows={3} className="mt-2 w-full rounded-button border border-bg-border bg-bg-main px-4 py-2.5 text-sm placeholder:text-text-muted" placeholder="Anything we should know about your academic path?" />
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
