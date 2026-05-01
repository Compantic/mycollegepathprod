"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  saveOnboardingDraft,
  getOnboardingDraft,
  getOnboardingFromFirestore,
  persistOnboardingToFirestore,
} from "@/lib/onboarding/storage";
import { auth } from "@/lib/firebase/client";
import { onAuthStateChanged, type User } from "firebase/auth";
import type {
  ActivityType,
  ActivityRankItem,
  ActivityWithIntensity,
  AwardItem,
  TutoringBenefit,
  CampusUrbanSuburbanRural,
  LectureVsSeminar,
  CoreVsOpen,
  IntensityVsBalanced,
  HasCollegeList,
  ApplicationStrategy,
  BudgetPerYear,
  FamilyIncomeBracket,
  FafsaEligibility,
  CollegeSectorPreference,
  DegreeLengthPreference,
  InternationalOpenness,
  OnboardingAnswers,
  AwardWithLevel,
  AwardLevel,
} from "@/lib/onboarding/schema";
import { ACTIVITY_TYPES, ACTIVITY_RANK_ITEMS } from "@/lib/onboarding/schema";
import { STEP_CONFIG } from "@/lib/onboarding/stepConfig";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Award, Star, Trophy, Globe, Building2, Trash2, Plus } from "lucide-react";
import { UsStatesMapPicker } from "@/components/onboarding/UsStatesMapPicker";

const TUTORING_OPTS: { value: TutoringBenefit; label: string }[] = [
  { value: "Individual", label: "Individual" },
  { value: "Small group", label: "Small group" },
  { value: "Large group", label: "Large group" },
  { value: "No", label: "No" },
  { value: "No preference", label: "No preference" },
];

const BUDGET_OPTS: BudgetPerYear[] = ["5K", "10K", "20K", "30K", "40K", "50K", "60K", "70K+"];
const INCOME_OPTS: FamilyIncomeBracket[] = [
  "Under $40,000",
  "$40,000–$75,000",
  "$75,000–$125,000",
  "$125,000–$200,000",
  "$200,000+",
  "Prefer not to say",
];
const FAFSA_OPTS: FafsaEligibility[] = ["Yes", "No", "Not sure"];
const SECTOR_OPTS: CollegeSectorPreference[] = ["Public", "Private", "Technical"];
const DEGREE_LEN_OPTS: { value: DegreeLengthPreference; label: string }[] = [
  { value: "2-year", label: "2-year" },
  { value: "4-year", label: "4-year" },
  { value: "No preference", label: "No preference" },
];
const INTL_OPTS: { value: InternationalOpenness; label: string }[] = [
  { value: "Must", label: "Must include international options" },
  { value: "No preference", label: "No preference" },
];

function waitForAuthUser(): Promise<User | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      resolve(u);
    });
  });
}

function OnboardingStep5Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProfile = searchParams.get("from") === "profile";
  const [activities, setActivities] = useState<ActivityWithIntensity[]>([]);
  const [awardsConsolidated, setAwardsConsolidated] = useState<AwardWithLevel[]>([]);
  const [tutoringBenefit, setTutoringBenefit] = useState<TutoringBenefit | "">("");
  const [locationPreferenceStates, setLocationPreferenceStates] = useState<string[]>([]);
  const [campusUrbanSuburbanRural, setCampusUrbanSuburbanRural] = useState<CampusUrbanSuburbanRural[]>([]);
  const [campusLectureVsSeminar, setCampusLectureVsSeminar] = useState<LectureVsSeminar[]>([]);
  const [campusCoreVsOpen, setCampusCoreVsOpen] = useState<CoreVsOpen[]>([]);
  const [campusIntensityVsBalanced, setCampusIntensityVsBalanced] = useState<IntensityVsBalanced[]>([]);
  const [collegeSectorPreference, setCollegeSectorPreference] = useState<CollegeSectorPreference[]>([]);
  const [degreeLengthPreference, setDegreeLengthPreference] = useState<DegreeLengthPreference | "">("");
  const [internationalOpenness, setInternationalOpenness] = useState<InternationalOpenness | "">("");
  const [budgetPerYear, setBudgetPerYear] = useState<BudgetPerYear | "">("");
  const [familyIncome, setFamilyIncome] = useState<FamilyIncomeBracket | "">("");
  const [fafsaEligibility, setFafsaEligibility] = useState<FafsaEligibility | "">("");
  const [hasCollegeList, setHasCollegeList] = useState<HasCollegeList | "">("");
  const [collegeListReachMatchSafety, setCollegeListReachMatchSafety] = useState("");
  const [collegeListVisited, setCollegeListVisited] = useState("");
  const [collegeListWhatLike, setCollegeListWhatLike] = useState("");
  const [applicationStrategy, setApplicationStrategy] = useState<ApplicationStrategy[]>([]);
  const [admissionProcessConfidence, setAdmissionProcessConfidence] = useState<number | "">("");
  const [selectivityImportance, setSelectivityImportance] = useState<number | "">("");

  useEffect(() => {
    let cancelled = false;

    function applyFromDraft(d: OnboardingAnswers) {
      setActivities(d.activityTypes ?? []);
      setAwardsConsolidated(d.awardsConsolidated ?? []);
      setTutoringBenefit(d.tutoringBenefit ?? "");
      setLocationPreferenceStates(d.locationPreferenceStates ?? []);
      
      const toArr = <T,>(v: any): T[] => Array.isArray(v) ? v : (v ? [v] : []);
      
      setCampusUrbanSuburbanRural(toArr<CampusUrbanSuburbanRural>(d.campusUrbanSuburbanRural));
      setCampusLectureVsSeminar(toArr<LectureVsSeminar>(d.campusLectureVsSeminar));
      setCampusCoreVsOpen(toArr<CoreVsOpen>(d.campusCoreVsOpen));
      
      if (d.campusIntensityVsBalanced) {
        const raw = toArr<string>(d.campusIntensityVsBalanced);
        const processed = raw.map(v => v === "Balanced life" ? "Lifestyle" : v) as IntensityVsBalanced[];
        setCampusIntensityVsBalanced(processed);
      } else {
        setCampusIntensityVsBalanced([]);
      }
      setCollegeSectorPreference(toArr<CollegeSectorPreference>(d.collegeSectorPreference));
      setDegreeLengthPreference(d.degreeLengthPreference ?? "");
      setInternationalOpenness(d.internationalOpenness ?? "");
      setBudgetPerYear(d.budgetPerYear ?? "");
      setFamilyIncome(d.familyIncome ?? "");
      setFafsaEligibility(d.fafsaEligibility ?? "");
      setHasCollegeList(d.hasCollegeList ?? "");
      setCollegeListReachMatchSafety(d.collegeListReachMatchSafety ?? "");
      setCollegeListVisited(d.collegeListVisited ?? "");
      setCollegeListWhatLike(d.collegeListWhatLike ?? "");
      setApplicationStrategy(toArr<ApplicationStrategy>(d.applicationStrategy));
      setAdmissionProcessConfidence(d.admissionProcessConfidence != null ? d.admissionProcessConfidence : "");
      setSelectivityImportance(d.selectivityImportance != null ? d.selectivityImportance : "");
    }

    async function run() {
      const local = getOnboardingDraft();
      if (!fromProfile) {
        applyFromDraft(local);
        return;
      }
      const user = await waitForAuthUser();
      if (cancelled) return;
      if (user) {
        try {
          const remote = await getOnboardingFromFirestore(user.uid);
          if (cancelled) return;
          const merged = { ...local, ...(remote ?? {}) } as OnboardingAnswers;
          saveOnboardingDraft(merged);
          applyFromDraft(merged);
        } catch (e) {
          console.error(e);
          applyFromDraft(local);
        }
      } else {
        applyFromDraft(local);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [fromProfile]);

  function addActivity(type: ActivityType) {
    setActivities((prev) => [...prev, { type, weeksParticipated: undefined, hoursPerWeek: undefined, description: "" }]);
  }

  function removeActivity(index: number) {
    setActivities((prev) => prev.filter((_, i) => i !== index));
  }

  function updateActivity(index: number, updates: Partial<ActivityWithIntensity>) {
    setActivities((prev) => prev.map((a, i) => (i === index ? { ...a, ...updates } : a)));
  }

  function addAward() {
    setAwardsConsolidated((prev) => [...prev, { title: "", description: "", level: "School" }]);
  }

  function updateAward(index: number, updates: Partial<AwardWithLevel>) {
    setAwardsConsolidated((prev) => prev.map((a, i) => (i === index ? { ...a, ...updates } : a)));
  }

  function removeAward(index: number) {
    setAwardsConsolidated((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleState(state: string) {
    setLocationPreferenceStates((prev) => (prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]));
  }

  function togglePreference<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, value: T) {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const conf = admissionProcessConfidence === "" ? undefined : Math.min(10, Math.max(1, Number(admissionProcessConfidence)));
    const sel = selectivityImportance === "" ? undefined : Math.min(10, Math.max(1, Number(selectivityImportance)));
    saveOnboardingDraft({
      activityTypes: activities.length ? activities : undefined,
      awardsConsolidated: awardsConsolidated.filter(a => a.title.trim()).length ? awardsConsolidated.filter(a => a.title.trim()) : undefined,
      tutoringBenefit: tutoringBenefit || undefined,
      locationPreferenceStates: locationPreferenceStates.length ? locationPreferenceStates : undefined,
      preferredStates: locationPreferenceStates.length ? locationPreferenceStates : undefined,
      campusUrbanSuburbanRural: campusUrbanSuburbanRural.length ? campusUrbanSuburbanRural : undefined,
      campusLectureVsSeminar: campusLectureVsSeminar.length ? campusLectureVsSeminar : undefined,
      campusCoreVsOpen: campusCoreVsOpen.length ? campusCoreVsOpen : undefined,
      campusIntensityVsBalanced: campusIntensityVsBalanced.length ? campusIntensityVsBalanced : undefined,
      collegeSectorPreference: collegeSectorPreference.length ? collegeSectorPreference : undefined,
      degreeLengthPreference: degreeLengthPreference || undefined,
      internationalOpenness: internationalOpenness || undefined,
      budgetPerYear: budgetPerYear || undefined,
      familyIncome: familyIncome || undefined,
      fafsaEligibility: fafsaEligibility || undefined,
      hasCollegeList: hasCollegeList || undefined,
      collegeListReachMatchSafety: hasCollegeList === "Yes" ? collegeListReachMatchSafety.trim() || undefined : undefined,
      collegeListVisited: hasCollegeList === "Yes" ? collegeListVisited.trim() || undefined : undefined,
      collegeListWhatLike: hasCollegeList === "Yes" ? collegeListWhatLike.trim() || undefined : undefined,
      applicationStrategy: applicationStrategy.length ? applicationStrategy : undefined,
      admissionProcessConfidence: conf,
      selectivityImportance: sel,
    });
    if (fromProfile && auth.currentUser) {
      await persistOnboardingToFirestore(auth.currentUser.uid, getOnboardingDraft());
      router.push("/app/profile");
      return;
    }
    router.push("/onboarding/step-6");
  }

  const confVal = admissionProcessConfidence === "" ? 5 : Math.min(10, Math.max(1, Number(admissionProcessConfidence)));
  const selVal = selectivityImportance === "" ? 5 : Math.min(10, Math.max(1, Number(selectivityImportance)));

  const config = STEP_CONFIG[5];

  return (
    <OnboardingStepCard
      title={config.title}
      subtitle={config.description}
      icon={<Award className="h-5 w-5" />}
      showPrivacyFooter
      formId="onboarding-step5-form"
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => router.push(fromProfile ? "/app/profile" : "/onboarding/step-4")}>Back</Button>
          <Button type="submit" form="onboarding-step5-form" className="gap-2">Next <span aria-hidden>→</span></Button>
        </>
      }
    >
      <form id="onboarding-step5-form" onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">Activities</h3>
          </div>
          <p className="text-xs text-text-muted">Optional — add specific activities you've participated in</p>
          
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-start">
            {ACTIVITY_TYPES.map((type) => {
              const items = activities
                .map((a, i) => ({ ...a, originalIndex: i }))
                .filter((a) => a.type === type);
              const hasItems = items.length > 0;

              return (
                <div key={type} className={`rounded-xl border-2 transition-all p-4 flex flex-col gap-4 ${hasItems ? "border-primary-500 bg-primary-500/5" : "border-bg-border bg-white hover:border-primary-500/30"}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${hasItems ? "text-primary-700" : "text-text-primary"}`}>{type}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => addActivity(type)} className="h-8 px-3 text-xs gap-1.5 border-primary-500/20 text-primary-600 hover:bg-primary-50">
                      {hasItems ? "Add Another" : "Add"}
                    </Button>
                  </div>

                  {hasItems && (
                    <div className="space-y-4">
                      {items.map((act, listIdx) => (
                        <div key={act.originalIndex} className="relative rounded-lg border border-bg-border bg-white/50 p-4 space-y-3">
                          <button
                            type="button"
                            onClick={() => removeActivity(act.originalIndex)}
                            className="absolute right-2 top-2 h-6 w-6 flex items-center justify-center rounded-full text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                            aria-label="Remove activity"
                          >
                            ×
                          </button>
                          
                          <div>
                            <label className="text-xs font-medium text-text-muted">Name / Description</label>
                            <Input
                              placeholder={`e.g. ${type === "Sports" ? "Basketball" : type === "Clubs" ? "Debate Club" : "Details..."}`}
                              value={act.description ?? ""}
                              onChange={(e) => updateActivity(act.originalIndex, { description: e.target.value })}
                              className="mt-1 h-9 text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-text-muted">Weeks</label>
                              <Input
                                type="number"
                                min={0}
                                inputMode="numeric"
                                placeholder="40"
                                value={act.weeksParticipated ?? ""}
                                onChange={(e) => updateActivity(act.originalIndex, { weeksParticipated: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                                className="mt-1 h-9 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-text-muted">Hours/week</label>
                              <Input
                                type="number"
                                min={0}
                                inputMode="numeric"
                                placeholder="5"
                                value={act.hoursPerWeek ?? ""}
                                onChange={(e) => updateActivity(act.originalIndex, { hoursPerWeek: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                                className="mt-1 h-9 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Consolidated Honors & Awards */}
        <section className="space-y-6 pt-4 border-t border-bg-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Honors & Awards
              </h3>
              <p className="text-xs text-text-muted mt-1">Add recognitions from school, state, national, or international levels.</p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addAward}
              className="h-9 px-4 text-xs gap-2 border-primary-500/20 text-primary-600 hover:bg-primary-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Award
            </Button>
          </div>

          <div className="space-y-4">
            {awardsConsolidated.map((award, i) => (
              <div key={i} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  type="button"
                  onClick={() => removeAward(i)}
                  className="absolute right-3 top-3 h-8 w-8 flex items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-90"
                  aria-label="Remove award"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-3">
                    <Input 
                      value={award.title} 
                      onChange={(e) => updateAward(i, { title: e.target.value })} 
                      placeholder="e.g. National Honor Society" 
                      className="h-10 text-sm font-semibold"
                    />
                    <Input 
                      value={award.description ?? ""} 
                      onChange={(e) => updateAward(i, { description: e.target.value })} 
                      placeholder="Short description or context (optional)" 
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-2">Award Level:</span>
                  {(["School", "State", "National", "International"] as const).map((level) => {
                    const isSelected = award.level === level;
                    const Icon = level === "School" ? Building2 : level === "State" ? Star : level === "National" ? Trophy : Globe;
                    
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => updateAward(i, { level })}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all border ${
                          isSelected 
                            ? "bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-600/20" 
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-slate-300"
                        }`}
                      >
                        <Icon className={`h-3 w-3 ${isSelected ? "text-white" : "text-slate-400"}`} />
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {awardsConsolidated.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/30 text-center">
                <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-3 shadow-sm">
                  <Star className="h-6 w-6 text-slate-200" />
                </div>
                <p className="text-sm font-medium text-slate-400">No honors or awards added yet.</p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">Tutoring need</h3>
          <p className="text-xs text-text-muted">Optional</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TUTORING_OPTS.map((o) => (
              <button key={o.value} type="button" onClick={() => setTutoringBenefit(o.value)} className={`onboarding-option-card ${tutoringBenefit === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
            ))}
          </div>
        </section>

        <section className="space-y-4 pt-2 border-t border-bg-border">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">College preferences</h3>

          <div>
            <label className="block text-sm font-medium text-text-primary">States (click map)</label>
            <p className="text-xs text-text-muted mt-0.5">Where you want to attend college — tap a state to select or deselect</p>
            <div className="mt-3">
              <UsStatesMapPicker selected={locationPreferenceStates} onToggle={toggleState} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">Campus type</label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["Urban", "Suburban", "Rural"] as const).map((opt) => (
                <button 
                  key={opt} 
                  type="button" 
                  onClick={() => togglePreference(setCampusUrbanSuburbanRural, opt)} 
                  className={`onboarding-option-card ${campusUrbanSuburbanRural.includes(opt) ? "onboarding-option-card-selected" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">Class size</label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["Large lecture", "Balanced", "Small seminar"] as const).map((opt) => (
                <button 
                  key={opt} 
                  type="button" 
                  onClick={() => togglePreference(setCampusLectureVsSeminar, opt)} 
                  className={`onboarding-option-card ${campusLectureVsSeminar.includes(opt) ? "onboarding-option-card-selected" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">Curriculum style</label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["Core", "Balanced", "Open curriculum"] as const).map((opt) => (
                <button 
                  key={opt} 
                  type="button" 
                  onClick={() => togglePreference(setCampusCoreVsOpen, opt)} 
                  className={`onboarding-option-card ${campusCoreVsOpen.includes(opt) ? "onboarding-option-card-selected" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">Academic pressure</label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["High intensity", "Balanced", "Lifestyle"] as const).map((opt) => (
                <button 
                  key={opt} 
                  type="button" 
                  onClick={() => togglePreference(setCampusIntensityVsBalanced, opt)} 
                  className={`onboarding-option-card ${campusIntensityVsBalanced.includes(opt) ? "onboarding-option-card-selected" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">College type</label>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SECTOR_OPTS.map((opt) => (
                <button 
                  key={opt} 
                  type="button" 
                  onClick={() => togglePreference(setCollegeSectorPreference, opt)} 
                  className={`onboarding-option-card ${collegeSectorPreference.includes(opt) ? "onboarding-option-card-selected" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">2-year vs 4-year</label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DEGREE_LEN_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setDegreeLengthPreference(o.value)} className={`onboarding-option-card ${degreeLengthPreference === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">International openness</label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTL_OPTS.map((o) => (
                <button key={o.value} type="button" onClick={() => setInternationalOpenness(o.value)} className={`onboarding-option-card ${internationalOpenness === o.value ? "onboarding-option-card-selected" : ""}`}>{o.label}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4 pt-2 border-t border-bg-border">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">Financials</h3>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-text-primary">Budget per year (tuition &amp; living)</label>
            <select id="budget" value={budgetPerYear} onChange={(e) => setBudgetPerYear((e.target.value || "") as BudgetPerYear)} className="mt-2 w-full max-w-xs onboarding-select">
              <option value="">Select</option>
              {BUDGET_OPTS.map((b) => (
                <option key={b} value={b}>
                  {b === "70K+"
                    ? "$70,000+"
                    : `$${b.replace("K", ",000")}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="income" className="block text-sm font-medium text-text-primary">Family income (approximate)</label>
            <select id="income" value={familyIncome} onChange={(e) => setFamilyIncome((e.target.value || "") as FamilyIncomeBracket)} className="mt-2 w-full max-w-md onboarding-select">
              <option value="">Select</option>
              {INCOME_OPTS.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">FAFSA eligibility</label>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {FAFSA_OPTS.map((opt) => (
                <button key={opt} type="button" onClick={() => setFafsaEligibility(opt)} className={`onboarding-option-card ${fafsaEligibility === opt ? "onboarding-option-card-selected" : ""}`}>{opt}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4 pt-2 border-t border-bg-border">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">College strategy</h3>

          <div>
            <label className="block text-sm font-medium text-text-primary">Have a college list?</label>
            <div className="mt-3 grid grid-cols-2 gap-3 max-w-xs">
              <button type="button" onClick={() => setHasCollegeList("Yes")} className={`onboarding-option-card ${hasCollegeList === "Yes" ? "onboarding-option-card-selected" : ""}`}>Yes</button>
              <button type="button" onClick={() => setHasCollegeList("No")} className={`onboarding-option-card ${hasCollegeList === "No" ? "onboarding-option-card-selected" : ""}`}>No</button>
            </div>
          </div>

          {hasCollegeList === "Yes" && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary">Which colleges? (reach / match / safety)</label>
                <textarea value={collegeListReachMatchSafety} onChange={(e) => setCollegeListReachMatchSafety(e.target.value)} rows={3} className="mt-2 w-full rounded-button border border-bg-border bg-bg-main px-4 py-2.5 text-sm" placeholder="List or describe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">Visited?</label>
                <textarea value={collegeListVisited} onChange={(e) => setCollegeListVisited(e.target.value)} rows={2} className="mt-2 w-full rounded-button border border-bg-border bg-bg-main px-4 py-2.5 text-sm" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary">What did you like?</label>
                <textarea value={collegeListWhatLike} onChange={(e) => setCollegeListWhatLike(e.target.value)} rows={3} className="mt-2 w-full rounded-button border border-bg-border bg-bg-main px-4 py-2.5 text-sm" placeholder="Optional" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary">Application plan</label>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(["ED", "EA", "RD", "Not sure"] as const).map((opt) => (
                <button 
                  key={opt} 
                  type="button" 
                  onClick={() => togglePreference(setApplicationStrategy, opt)} 
                  className={`onboarding-option-card ${applicationStrategy.includes(opt) ? "onboarding-option-card-selected" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium text-text-primary">Confidence in admission process (1–10)</label>
              <span className="text-sm text-text-muted">{admissionProcessConfidence === "" ? "—" : confVal}</span>
            </div>
            <input type="range" min={1} max={10} value={confVal} onChange={(e) => setAdmissionProcessConfidence(parseInt(e.target.value, 10))} className="mt-2 w-full h-3 rounded-pill appearance-none bg-secondary-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500" />
          </div>

          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium text-text-primary">Importance of selective college (1–10)</label>
              <span className="text-sm text-text-muted">{selVal}</span>
            </div>
            <input type="range" min={1} max={10} value={selVal} onChange={(e) => setSelectivityImportance(parseInt(e.target.value, 10))} className="mt-2 w-full h-3 rounded-pill appearance-none bg-secondary-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500" />
          </div>
        </section>
      </form>
    </OnboardingStepCard>
  );
}

export default function OnboardingStep5Page() {
  return (
    <Suspense fallback={null}>
      <OnboardingStep5Content />
    </Suspense>
  );
}
