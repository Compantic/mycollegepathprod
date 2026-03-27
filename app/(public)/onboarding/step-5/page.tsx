"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveOnboardingDraft, getOnboardingDraft, persistOnboardingToFirestore } from "@/lib/onboarding/storage";
import { auth } from "@/lib/firebase/client";
import type { ActivityType, ActivityRankItem, ActivityWithIntensity, AwardItem } from "@/lib/onboarding/schema";
import { STEP_CONFIG } from "@/lib/onboarding/stepConfig";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Award } from "lucide-react";

const ACTIVITY_TYPES: ActivityType[] = [
  "Arts/Music",
  "Clubs",
  "Community engagement",
  "Family responsibilities",
  "Hobbies",
  "Sports",
  "Work/Volunteering",
];
const RANK_ITEMS: ActivityRankItem[] = ["Leadership", "Volunteer", "Hobbies & clubs", "Academic"];

function OnboardingStep5Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProfile = searchParams.get("from") === "profile";
  const [activities, setActivities] = useState<ActivityWithIntensity[]>([]);
  const [activityRanking, setActivityRanking] = useState<ActivityRankItem[]>([]);
  const [awardsSchool, setAwardsSchool] = useState<AwardItem[]>([]);
  const [awardsState, setAwardsState] = useState<AwardItem[]>([]);
  const [awardsNational, setAwardsNational] = useState<AwardItem[]>([]);
  const [awardsInternational, setAwardsInternational] = useState<AwardItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const d = getOnboardingDraft();
    if (d.activityTypes?.length) setActivities(d.activityTypes);
    if (d.activityRanking?.length) setActivityRanking(d.activityRanking);
    if (d.awardsSchool?.length) setAwardsSchool(d.awardsSchool);
    if (d.awardsState?.length) setAwardsState(d.awardsState);
    if (d.awardsNational?.length) setAwardsNational(d.awardsNational);
    if (d.awardsInternational?.length) setAwardsInternational(d.awardsInternational);
  }, []);

  function toggleActivity(type: ActivityType) {
    setActivities((prev) => {
      const exists = prev.find((a) => a.type === type);
      if (exists) return prev.filter((a) => a.type !== type);
      return [...prev, { type, weeksParticipated: undefined, hoursPerWeek: undefined }];
    });
  }

  function setActivityWeeks(type: ActivityType, value: number | undefined) {
    setActivities((prev) => prev.map((a) => (a.type === type ? { ...a, weeksParticipated: value } : a)));
  }
  function setActivityHours(type: ActivityType, value: number | undefined) {
    setActivities((prev) => prev.map((a) => (a.type === type ? { ...a, hoursPerWeek: value } : a)));
  }

  function setRankOrder(ordered: ActivityRankItem[]) {
    setActivityRanking(ordered);
  }
  function moveRank(index: number, dir: "up" | "down") {
    const current = activityRanking.length === 4 ? activityRanking : [...RANK_ITEMS];
    const next = [...current];
    const swap = dir === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setActivityRanking(next);
  }

  function addAward(level: "School" | "State" | "National" | "International") {
    const setter = level === "School" ? setAwardsSchool : level === "State" ? setAwardsState : level === "National" ? setAwardsNational : setAwardsInternational;
    setter((prev) => [...prev, { title: "", description: "" }]);
  }
  function updateAward(level: "School" | "State" | "National" | "International", index: number, field: "title" | "description", value: string) {
    const setter = level === "School" ? setAwardsSchool : level === "State" ? setAwardsState : level === "National" ? setAwardsNational : setAwardsInternational;
    setter((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveOnboardingDraft({
      activityTypes: activities.length ? activities : undefined,
      activityRanking: activityRanking.length === 4 ? activityRanking : undefined,
      awardsSchool: awardsSchool.length ? awardsSchool : undefined,
      awardsState: awardsState.length ? awardsState : undefined,
      awardsNational: awardsNational.length ? awardsNational : undefined,
      awardsInternational: awardsInternational.length ? awardsInternational : undefined,
    });
    if (fromProfile && auth.currentUser) {
      await persistOnboardingToFirestore(auth.currentUser.uid, getOnboardingDraft());
      router.push("/app/profile");
      return;
    }
    router.push("/onboarding/step-6");
  }

  const rankOrder = activityRanking.length === 4 ? activityRanking : [...RANK_ITEMS];

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
      <form id="onboarding-step5-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary">Activity types — select each you do, then add weeks and hours per week</label>
            <p className="mt-0.5 text-xs text-text-muted">Optional. Click a card to select; click again to deselect.</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACTIVITY_TYPES.map((type) => {
                const act = activities.find((a) => a.type === type);
                const selected = !!act;
                return (
                  <div key={type} className={`rounded-xl border-2 overflow-hidden transition-all ${selected ? "border-primary-500 bg-primary-500/10" : "border-bg-border bg-white hover:border-primary-500/50"}`}>
                    <button type="button" onClick={() => toggleActivity(type)} className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${selected ? "text-primary-600" : "text-text-primary"}`}>
                      {type}
                    </button>
                    {selected && act && (
                      <div className="px-4 pb-3 pt-0 flex gap-4 border-t border-bg-border/80 pt-3" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <label className="text-xs text-text-muted">Weeks</label>
                          <Input type="number" min={0} value={act.weeksParticipated ?? ""} onChange={(e) => setActivityWeeks(type, e.target.value ? parseInt(e.target.value, 10) : undefined)} className="mt-1 w-24 h-9 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted">Hours/week</label>
                          <Input type="number" min={0} value={act.hoursPerWeek ?? ""} onChange={(e) => setActivityHours(type, e.target.value ? parseInt(e.target.value, 10) : undefined)} className="mt-1 w-24 h-9 text-sm" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">Rank your activities/extracurriculars (1 = most important)</label>
            <p className="mt-0.5 text-xs text-text-muted">Optional. Reorder to set ranking.</p>
            <div className="mt-2 space-y-2">
              {rankOrder.map((item, index) => (
                <div key={item} className="flex items-center gap-2 rounded-button border border-bg-border bg-bg-main px-3 py-2">
                  <span className="text-sm text-text-muted w-6 shrink-0">{index + 1}.</span>
                  <span className="text-text-primary flex-1 min-w-0">{item}</span>
                  <div className="flex flex-col shrink-0 rounded border border-bg-border overflow-hidden">
                    <button type="button" onClick={() => moveRank(index, "up")} disabled={index === 0} className="min-w-[2.25rem] min-h-[1.75rem] flex items-center justify-center text-text-muted hover:bg-secondary-100 hover:text-primary-600 disabled:opacity-40 disabled:pointer-events-none" aria-label="Move up">↑</button>
                    <span className="h-px bg-bg-border" aria-hidden />
                    <button type="button" onClick={() => moveRank(index, "down")} disabled={index === rankOrder.length - 1} className="min-w-[2.25rem] min-h-[1.75rem] flex items-center justify-center text-text-muted hover:bg-secondary-100 hover:text-primary-600 disabled:opacity-40 disabled:pointer-events-none" aria-label="Move down">↓</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(["School", "State", "National", "International"] as const).map((level) => {
            const list = level === "School" ? awardsSchool : level === "State" ? awardsState : level === "National" ? awardsNational : awardsInternational;
            return (
              <div key={level}>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">{level} level — honors and awards</label>
                  <Button type="button" variant="outline" size="sm" onClick={() => addAward(level)}>Add</Button>
                </div>
                <p className="mt-0.5 text-xs text-text-muted">Optional. Title + short description per item.</p>
                <div className="mt-2 space-y-2">
                  {list.map((a, i) => (
                    <div key={i} className="rounded-button border border-bg-border bg-bg-main p-3 space-y-2">
                      <Input value={a.title} onChange={(e) => updateAward(level, i, "title", e.target.value)} placeholder="Title" />
                      <Input value={a.description ?? ""} onChange={(e) => updateAward(level, i, "description", e.target.value)} placeholder="Short description (optional)" className="text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

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
