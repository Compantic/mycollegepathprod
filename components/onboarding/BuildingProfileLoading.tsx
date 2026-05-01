"use client";

import { useEffect, useState, useRef } from "react";
import { User, Paperclip, Mic, ArrowUp, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { LogoIcon } from "@/components/landing/LogoIcon";
import { getOnboardingDraft } from "@/lib/onboarding/storage";
import type { OnboardingDraft } from "@/lib/onboarding/types";

function graduationYearFromGrade(grade: string | undefined): number | undefined {
  if (!grade) return undefined;
  const y = new Date().getFullYear();
  if (grade === "9") return y + 4;
  if (grade === "10") return y + 3;
  if (grade === "11") return y + 2;
  if (grade === "12") return y + 1;
  return y + 1;
}

const PROGRESS_DURATION_MS = 2800;
const PROGRESS_TICK_MS = 40;
const SUCCESS_SHOW_MS = 1800;

interface BuildingProfileLoadingProps {
  draft: Partial<OnboardingDraft>;
  /** Called after progress reaches 100% and success message is shown; then redirect. */
  onComplete?: () => void;
  /** When true, at 100% show "Profile created!" and call onComplete (token ready). */
  redirectReady?: boolean;
}

function buildInfoItems(draft: Partial<OnboardingDraft>): { label: string; value: string }[] {
  const items: { label: string; value: string }[] = [];
  const loc = [draft.city, draft.state, draft.country].filter(Boolean).join(", ");
  if (loc) items.push({ label: "Location", value: loc });
  if (draft.currentHighSchool) items.push({ label: "High school", value: draft.currentHighSchool });
  const gradYear = draft.expectedGraduationYear ?? graduationYearFromGrade(draft.gradeLevel) ?? draft.graduationYear;
  if (gradYear != null) items.push({ label: "Graduation year", value: String(gradYear) });
  if (draft.gender) items.push({ label: "Gender", value: draft.gender });
  if (draft.gpa != null) items.push({ label: "GPA", value: `${draft.gpa} (${draft.gpaScale ?? 4}.0 scale)` });
  if (draft.satTotal != null || draft.satScore != null) items.push({ label: "SAT", value: String(draft.satTotal ?? draft.satScore ?? "") });
  if (draft.actScore != null) items.push({ label: "ACT", value: String(draft.actScore) });
  if (draft.areasOfInterest?.length) items.push({ label: "Interests", value: draft.areasOfInterest.slice(0, 3).join(", ") });
  const prefStates = draft.locationPreferenceStates?.length ? draft.locationPreferenceStates : draft.preferredStates;
  if (prefStates?.length) items.push({ label: "Target states", value: prefStates.slice(0, 5).join(", ") + (prefStates.length > 5 ? "…" : "") });
  const campus =
    draft.campusUrbanSuburbanRural?.length
      ? draft.campusUrbanSuburbanRural.join(", ")
      : draft.preferredSize;
  if (campus) items.push({ label: "Campus", value: campus });
  if (draft.careerPathWhat) items.push({ label: "Career path", value: draft.careerPathWhat });
  if (draft.activityTypes?.length) items.push({ label: "Activities", value: draft.activityTypes.map((a) => a.type).slice(0, 3).join(", ") + (draft.activityTypes.length > 3 ? "…" : "") });
  if (draft.applicationStrategy?.length) {
    items.push({ label: "Application", value: draft.applicationStrategy.join(", ") });
  }
  return items;
}

export function BuildingProfileLoading({ draft: draftProp, onComplete, redirectReady = true }: BuildingProfileLoadingProps) {
  const [draft, setDraft] = useState<Partial<OnboardingDraft>>(draftProp);
  const [progress, setProgress] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [phase, setPhase] = useState<"loading" | "success">("loading");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Always show latest draft from client storage (may be empty on SSR/first render)
  useEffect(() => {
    setDraft(getOnboardingDraft());
  }, []);

  const infoItems = buildInfoItems(draft);

  // 0 → 100% smooth progress
  useEffect(() => {
    const totalTicks = Math.ceil(PROGRESS_DURATION_MS / PROGRESS_TICK_MS);
    const increment = 100 / totalTicks;
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + increment);
        if (next >= 100) return 100;
        return next;
      });
    }, PROGRESS_TICK_MS);
    return () => clearInterval(interval);
  }, []);

  // When 100% and redirect ready, show success phase then onComplete
  useEffect(() => {
    if (progress < 100 || !redirectReady) return;
    setPhase("success");
    const t = setTimeout(() => {
      onCompleteRef.current?.();
    }, SUCCESS_SHOW_MS);
    return () => clearTimeout(t);
  }, [progress, redirectReady]);

  useEffect(() => {
    if (visibleCount >= infoItems.length) return;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), 380);
    return () => clearTimeout(t);
  }, [visibleCount, infoItems.length]);

  const displayProgress = Math.min(100, Math.round(progress));
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference;

  const studentName = [draft.firstName, draft.lastName].filter(Boolean).join(" ") || "—";
  const gradYear = draft.expectedGraduationYear ?? graduationYearFromGrade(draft.gradeLevel) ?? draft.graduationYear;
  const academicYear = gradYear != null ? `${gradYear} Grad` : "—";
  const gpaStr = draft.gpa != null ? String(draft.gpa) : "—";
  const targetMajors = draft.areasOfInterest?.length ? draft.areasOfInterest.slice(0, 2).join(", ") : "—";

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-300">
      {/* Sol panel: Path Agent (koyu mavi) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[42%] flex-col bg-[#1e3a5f] text-white">
        <header className="p-6 animate-in fade-in slide-in-from-left-2 duration-500">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-7 w-7 shrink-0 text-amber-400" />
            <span className="text-lg font-semibold text-white">MyCollegePath</span>
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-8">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 shadow-[0_0_40px_rgba(99,102,241,0.5)] animate-onboarding-glow">
            <Sparkles className="h-10 w-10 text-white" strokeWidth={1.5} />
          </div>
          <p className="mt-6 text-xs font-medium uppercase tracking-widest text-blue-200">Path Agent</p>
          <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-white/95">
            Hi! I&apos;m your <strong className="font-semibold text-white">Path Agent</strong>. To start, you can upload your transcript or just tell me about your dream school.
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
            <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white" aria-label="Upload">
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              type="text"
              readOnly
              placeholder="Type your message here..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
            />
            <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white" aria-label="Voice input">
              <Mic className="h-5 w-5" />
            </button>
            <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2B5FD9] text-white hover:bg-[#1e4db8]" aria-label="Send">
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right panel: Building Your Profile */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto bg-white px-6 py-10 md:px-10">
        <h2 className="text-xl font-bold text-[#0F172A] animate-in fade-in slide-in-from-bottom-2 duration-500">Building Your Profile...</h2>
        <p className="mt-1 text-sm text-slate-500 animate-in fade-in duration-500 delay-100">Your information updates in real-time as we chat.</p>
        <div className="mt-6 h-1 w-12 rounded-full bg-gradient-to-r from-primary-500 to-amber-400 animate-pulse" aria-hidden />

        <div className="mt-8 w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              <User className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1 grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Student Name</p>
                <p className="truncate text-sm font-semibold text-slate-800">{studentName}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Academic Year</p>
                <p className="text-sm font-medium text-slate-800">{academicYear}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">GPA (Est.)</p>
                <p className="text-sm font-medium text-slate-800">{gpaStr}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Target Majors</p>
                <p className="text-sm font-medium text-slate-800">{targetMajors}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center">
          {phase === "loading" ? (
            <>
              <div className="relative h-28 w-28">
                <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100" aria-hidden>
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="url(#profileProgressGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-[stroke-dashoffset] duration-150 ease-out"
                    style={{ strokeDashoffset }}
                  />
                  <defs>
                    <linearGradient id="profileProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2B5FD9" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-800 tabular-nums">
                  {displayProgress}%
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800">Creating your profile...</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Your data is being saved securely.
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center animate-in zoom-in-95 fade-in duration-400">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-status-successBg text-status-successText">
                <CheckCircle2 className="h-16 w-16" strokeWidth={2} />
              </div>
              <p className="mt-4 text-xl font-bold text-slate-800">Profile created!</p>
              <p className="mt-1 text-sm text-slate-500">Redirecting...</p>
            </div>
          )}
        </div>

        {infoItems.length > 0 && (
          <div className="mt-8 w-full max-w-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">From your application</p>
            <ul className="space-y-2">
              {infoItems.slice(0, visibleCount).map((item, index) => (
                <li
                  key={`${item.label}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: "0ms" }}
                >
                  <span className="text-xs font-medium text-slate-500 shrink-0">{item.label}</span>
                  <span className="text-right text-sm font-medium text-slate-800 truncate">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <footer className="mt-auto flex gap-2 pt-10 text-xs text-slate-400">
          <Link href="/#privacy" className="hover:text-primary-500 hover:underline">Privacy Policy</Link>
          <span aria-hidden>·</span>
          <Link href="/#support" className="hover:text-primary-500 hover:underline">Support</Link>
        </footer>
      </div>
    </div>
  );
}
