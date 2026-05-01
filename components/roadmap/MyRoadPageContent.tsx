"use client";

import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Map,
  Sparkles,
  GraduationCap,
  Target,
  Award,
  Download,
  Loader2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  MapPin,
  Settings,
  BarChart2,
  Quote,
  Flag,
} from "lucide-react";
import type { OnboardingSnapshot } from "@/lib/onboarding/types";
import type { RoadmapResult, RoadmapPhase, RoadmapGap } from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { useToastOptional } from "@/components/ui/toast";
import { useRoadmapHistory } from "@/hooks/useRoadmapHistory";
import { auth } from "@/lib/firebase/client";
import { markFirstTenStepDone } from "@/lib/activation/firstTen";

export interface MyRoadPageContentProps {
  onboardingAnswers: OnboardingSnapshot | null;
  profilePhotoUrl?: string | null;
}

const DATA_SECTIONS = [
  {
    key: "academic",
    title: "Academic",
    icon: GraduationCap,
    bg: "bg-violet-50/80",
    border: "border-violet-200",
    iconBg: "bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-500/25",
    textAccent: "text-violet-900",
    getItems: (o: OnboardingSnapshot) => [
      { label: "GPA", value: o.gpa != null ? String(o.gpa) : null },
      { label: "SAT", value: o.satTotal ?? o.satScore != null ? String(o.satTotal ?? o.satScore) : null },
      { label: "ACT", value: o.actComposite ?? o.actScore != null ? String(o.actComposite ?? o.actScore) : null },
      { label: "Grade", value: o.gradeLevel ?? null },
      { label: "Graduation", value: o.expectedGraduationYear ?? o.graduationYear != null ? String(o.expectedGraduationYear ?? o.graduationYear) : null },
      { label: "Rigorous (AP/IB/Honors)", value: [o.rigorousApCompleted, o.rigorousIbCompleted, o.rigorousHonorsCompleted].some((n) => (n ?? 0) > 0) ? "Yes" : null },
    ],
  },
  {
    key: "career",
    title: "Career & Interests",
    icon: Target,
    bg: "bg-emerald-50/80",
    border: "border-emerald-200",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/20",
    textAccent: "text-emerald-900",
    getItems: (o: OnboardingSnapshot) => [
      { label: "Career path", value: o.careerPath ?? null },
      { label: "Target degree", value: o.targetDegree ?? null },
      { label: "Interests", value: o.areasOfInterest?.length ? o.areasOfInterest.join(", ") : null },
    ],
  },
  {
    key: "activities",
    title: "Activities & Awards",
    icon: Award,
    bg: "bg-amber-50/80",
    border: "border-amber-200",
    iconBg: "bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20",
    textAccent: "text-amber-900",
    getItems: (o: OnboardingSnapshot) => {
      const activities = o.activityTypes?.length ? o.activityTypes.map((a) => (typeof a === "string" ? a : a.type)).join(", ") : null;
      const awardCount = o.awardsConsolidated?.length ?? 0;
      const schoolCount = o.awardsConsolidated?.filter(a => a.level === "School").length ?? 0;
      const stateCount = o.awardsConsolidated?.filter(a => a.level === "State").length ?? 0;
      const nationalCount = o.awardsConsolidated?.filter(a => a.level === "National").length ?? 0;
      const internationalCount = o.awardsConsolidated?.filter(a => a.level === "International").length ?? 0;
      
      return [
        { label: "Activities", value: activities ?? (o.activityTypes?.length ? `${o.activityTypes.length} listed` : null) },
        { 
          label: "Awards", 
          value: awardCount > 0 
            ? `Total: ${awardCount} (School: ${schoolCount}, State: ${stateCount}, National+: ${nationalCount + internationalCount})` 
            : null 
        },
      ];
    },
  },
  {
    key: "preferences",
    title: "Preferences",
    icon: MapPin,
    bg: "bg-blue-50/80",
    border: "border-blue-200",
    iconBg: "bg-gradient-to-br from-primary-500 to-primary-600 shadow-md shadow-primary-500/25",
    textAccent: "text-blue-900",
    getItems: (o: OnboardingSnapshot) => [
      { label: "Campus", value: Array.isArray(o.campusUrbanSuburbanRural) ? o.campusUrbanSuburbanRural.join(", ") : (o.campusUrbanSuburbanRural ?? null) },
      { label: "Application strategy", value: o.applicationStrategy ?? null },
      { label: "States", value: o.preferredStates?.join(", ") ?? o.locationPreferenceStates?.join(", ") ?? null },
    ],
  },
];

function hasAnyData(o: OnboardingSnapshot | null): boolean {
  if (!o) return false;
  return (
    (o.firstName?.trim()?.length ?? 0) > 0 ||
    (o.gpa != null) ||
    (o.satScore != null) ||
    (o.actScore != null) ||
    (o.areasOfInterest?.length ?? 0) > 0 ||
    (o.activityTypes?.length ?? 0) > 0
  );
}

const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string }> = {
  academic: { label: "Academic", bg: "bg-indigo-100", text: "text-indigo-700" },
  extracurricular: { label: "Activities", bg: "bg-amber-100", text: "text-amber-800" },
  testing: { label: "Testing", bg: "bg-emerald-100", text: "text-emerald-700" },
  essays: { label: "Essays", bg: "bg-violet-100", text: "text-violet-700" },
  applications: { label: "Applications", bg: "bg-sky-100", text: "text-sky-700" },
  general: { label: "General", bg: "bg-slate-100", text: "text-slate-700" },
};

function getSeverityStyle(g: RoadmapGap): { label: string; barBg: string; badgeBg: string; badgeText: string } {
  switch (g.severity) {
    case "critical":
      return { label: "Critical", barBg: "bg-red-500", badgeBg: "bg-red-100", badgeText: "text-red-700" };
    case "important":
      return { label: "Important", barBg: "bg-amber-500", badgeBg: "bg-amber-100", badgeText: "text-amber-700" };
    default:
      return { label: "Optional", barBg: "bg-slate-400", badgeBg: "bg-slate-100", badgeText: "text-slate-600" };
  }
}

function getSeverityBarWidth(severity: RoadmapGap["severity"]): string {
  switch (severity) {
    case "critical": return "100%";
    case "important": return "66%";
    default: return "33%";
  }
}

const PROGRESS_STEPS = [0, 15, 32, 48, 62, 78, 88];
const PROGRESS_INTERVAL_MS = 500;

export function MyRoadPageContent({ onboardingAnswers, profilePhotoUrl }: MyRoadPageContentProps) {
  const [roadmap, setRoadmap] = useState<RoadmapResult | null>(null);
  const [roadmapId, setRoadmapId] = useState<string | null>(null);
  const {
    history,
    setHistory,
    historyLoading,
    historyError,
    completionMap: completedByRoadmap,
    setCompletionMap: setCompletedByRoadmap,
  } = useRoadmapHistory(Boolean(onboardingAnswers));
  const reduceMotion = useReducedMotion();
  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: reduceMotion ? 0 : 0.06,
          delayChildren: reduceMotion ? 0 : 0.08,
        },
      },
    }),
    [reduceMotion]
  );
  const itemVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 320, damping: 28 },
      },
    }),
    [reduceMotion]
  );
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const roadmapRef = useRef<HTMLDivElement>(null);
  const scrollToRoadmapAfterGenerateRef = useRef(false);
  const progressStepRef = useRef(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast: showToast } = useToastOptional();

  useEffect(() => {
    if (!loading) return;
    setProgress(0);
    progressStepRef.current = 0;
    progressTimerRef.current = setInterval(() => {
      if (progressStepRef.current < PROGRESS_STEPS.length - 1) {
        progressStepRef.current += 1;
        setProgress(PROGRESS_STEPS[progressStepRef.current]);
      }
    }, PROGRESS_INTERVAL_MS);
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [loading]);

  // Select latest roadmap from fetched history.
  useEffect(() => {
    if (roadmap || history.length === 0) return;
    setRoadmapId(history[0].roadmapId);
    setRoadmap(history[0].roadmap);
  }, [history, roadmap]);

  useLayoutEffect(() => {
    if (!roadmap || !scrollToRoadmapAfterGenerateRef.current) return;
    scrollToRoadmapAfterGenerateRef.current = false;
    roadmapRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [roadmap, reduceMotion]);

  async function handleGenerate() {
    setLoading(true);
    setRoadmap(null);
    try {
      const res = await fetchWithAuth("/api/roadmap/generate", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate roadmap");
      const data = await res.json();
      const generated: RoadmapResult = data.roadmap ?? data;
      const newId: string = data.roadmapId ?? `roadmap-${Date.now()}`;
      scrollToRoadmapAfterGenerateRef.current = true;
      setRoadmapId(newId);
      setRoadmap(generated);
      setHistory((prev) => [
        { roadmapId: newId, createdAt: new Date().toISOString(), roadmap: generated, completedItemIds: [] },
        ...prev,
      ]);
      setCompletedByRoadmap((prev) => ({ ...prev, [newId]: [] }));
      markFirstTenStepDone(auth.currentUser?.uid, "roadmap");
      setProgress(100);
    } catch (err) {
      showToast({
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "error",
      });
    } finally {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setLoading(false);
      setProgress(0);
    }
  }

  async function handleExportPDF() {
    if (!roadmapRef.current) return;
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(roadmapRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, "PNG", 0, 0, w, h);
      pdf.save(`my-roadmap-${roadmap?.studentName?.replace(/\s+/g, "-") ?? "student"}.pdf`);
      showToast({
        title: "PDF exported",
        description: "Your roadmap has been saved.",
      });
    } catch (err) {
      showToast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "error",
      });
    }
  }

  const o = onboardingAnswers;
  const hasData = hasAnyData(o);
  const selectedCompletedIds = roadmapId ? (completedByRoadmap[roadmapId] ?? []) : [];

  async function persistChecklist(nextCompletedIds: string[]) {
    if (!roadmapId) return;
    try {
      await fetchWithAuth("/api/roadmap/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadmapId,
          completedItemIds: nextCompletedIds,
        }),
      });
    } catch {
      // Keep optimistic UI even if network fails temporarily.
    }
  }

  function toggleTask(taskId: string) {
    if (!roadmapId) return;
    setCompletedByRoadmap((prev) => {
      const current = prev[roadmapId] ?? [];
      const next = current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId];
      void persistChecklist(next);
      return { ...prev, [roadmapId]: next };
    });
  }

  function buildIcs(): string | null {
    if (!roadmap) return null;
    const lines: string[] = [];
    lines.push("BEGIN:VCALENDAR");
    lines.push("VERSION:2.0");
    lines.push("PRODID:-//MyCollegePath//Roadmap//EN");
    const baseDate = new Date();
    roadmap.phases
      .slice()
      .sort((a, b) => a.order - b.order)
      .forEach((phase, idx) => {
        const start = new Date(baseDate);
        start.setMonth(start.getMonth() + idx * 3);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 3);
        const dtStart = start.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        const dtEnd = end.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        lines.push("BEGIN:VEVENT");
        lines.push(`UID:roadmap-${phase.id}@mycollegepath.ai`);
        lines.push(`DTSTART:${dtStart}`);
        lines.push(`DTEND:${dtEnd}`);
        lines.push(`SUMMARY:${phase.title}`);
        lines.push(
          `DESCRIPTION:${(phase.items || [])
            .map((i) => i.text.replace(/,/g, " "))
            .join(" | ")}`
        );
        lines.push("END:VEVENT");
      });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  if (!hasData) {
    return (
      <motion.div
        className="relative isolation-isolate overflow-hidden rounded-[2.5rem] border border-slate-800/60 p-8 text-center shadow-2xl shadow-slate-950/20 sm:p-10"
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        {/* PREMIUM BACKGROUND EFFECTS */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0f1b2d] via-primary-700 to-[#162236]" aria-hidden />
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(252,211,77,0.12) 0%, transparent 45%),
              radial-gradient(circle at 80% 20%, rgba(43,95,217,0.25) 0%, transparent 40%)`,
          }}
          aria-hidden
        />
        <div 
          className="absolute inset-0 -z-10 opacity-[0.03]" 
          style={{ 
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse at center, black, transparent)'
          }}
          aria-hidden 
        />

        <div className="relative">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white/10 text-white shadow-2xl backdrop-blur-xl ring-1 ring-white/20">
            <Map className="h-10 w-10 text-amber-400" strokeWidth={1.5} aria-hidden />
          </div>
          <div className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 backdrop-blur-md">
            <Sparkles className="size-3.5" aria-hidden />
            Your path starts here
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Complete your profile first</h2>
          <p className="mt-4 mx-auto max-w-md text-base leading-relaxed text-slate-400">
            <span className="italic text-primary-400 font-medium">We need a few details.</span> Your roadmap is built from your profile and questionnaire — finish onboarding to generate it.
          </p>
          <Link
            href="/onboarding/step-1"
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition-all hover:shadow-xl"
          >
            Complete profile
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      <motion.div className="space-y-10" initial="hidden" animate="visible" variants={containerVariants}>
        {/* Breadcrumb */}
        <motion.nav className="text-sm text-slate-500" aria-label="Breadcrumb" variants={itemVariants}>
          <Link href="/app" className="font-medium transition-colors hover:text-primary-600">
            Dashboard
          </Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="font-semibold text-slate-900">My Roadmap</span>
        </motion.nav>

        {/* Hero */}
        <motion.section variants={itemVariants} className="relative">
          <div className="relative isolation-isolate overflow-hidden rounded-[2.5rem] border border-slate-800/60 p-8 shadow-2xl shadow-slate-950/20">
            {/* PREMIUM BACKGROUND EFFECTS */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0f1b2d] via-primary-700 to-[#162236]" aria-hidden />
            <div
              className="absolute inset-0 -z-10 opacity-40"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 80%, rgba(252,211,77,0.12) 0%, transparent 45%),
                  radial-gradient(circle at 80% 20%, rgba(43,95,217,0.25) 0%, transparent 40%)`,
              }}
              aria-hidden
            />
            <div 
              className="absolute inset-0 -z-10 opacity-[0.03]" 
              style={{ 
                backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
                maskImage: 'radial-gradient(ellipse at center, black, transparent)'
              }}
              aria-hidden 
            />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <motion.div
                initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: reduceMotion ? 0 : 0.08, type: "spring", stiffness: 280, damping: 22 }}
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] bg-white/10 text-white shadow-2xl backdrop-blur-xl ring-1 ring-white/20"
              >
                <Map className="h-10 w-10 text-amber-400" strokeWidth={1.5} aria-hidden />
              </motion.div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 backdrop-blur-md">
                  <Sparkles className="size-3.5" aria-hidden />
                  Plan & timeline
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">My Roadmap</h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
                  <span className="italic text-primary-400 font-medium">Your profile, your pace.</span> Review your data below, then generate a phased plan with clear action items.
                </p>
              </div>
              <Link
                href="/app/profile"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/20 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <Settings className="h-4 w-4" aria-hidden />
                Update profile
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Data cards */}
        <motion.section className="space-y-6" variants={itemVariants}>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600">Your profile at a glance</h2>
          <motion.div
            className="grid gap-5 sm:grid-cols-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {DATA_SECTIONS.map((section) => {
              const items = section.getItems(o!);
              const filled = items.filter((x) => x.value != null && x.value !== "").length;
              if (filled === 0) return null;
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.key}
                  className={cn(
                    "rounded-2xl border p-5 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg",
                    section.border,
                    section.bg
                  )}
                  variants={itemVariants}
                  whileHover={reduceMotion ? undefined : { y: -3, transition: { duration: 0.2 } }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <motion.div
                      className={cn("flex h-11 w-11 items-center justify-center rounded-xl text-white", section.iconBg)}
                      whileHover={reduceMotion ? undefined : { scale: 1.06 }}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </motion.div>
                    <h3 className={cn("text-lg font-bold", section.textAccent)}>{section.title}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {items.map(
                      (item, j) =>
                        item.value != null &&
                        item.value !== "" && (
                          <motion.div
                            key={j}
                            initial={{ opacity: 0, x: reduceMotion ? 0 : -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: reduceMotion ? 0 : 0.04 * j, type: "spring", stiffness: 380, damping: 28 }}
                            className="rounded-xl border border-white/90 bg-white/85 px-3 py-2.5 shadow-sm ring-1 ring-slate-100/80 backdrop-blur-sm"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.label}</p>
                            <p className="break-words text-sm font-semibold text-slate-900">{item.value}</p>
                          </motion.div>
                        )
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* Generate CTA */}
        <motion.section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-primary-50/40 to-amber-50/30 p-6 shadow-onboarding-card sm:p-8" variants={itemVariants}>
          <div
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0f1b2d] via-primary-600 to-amber-400"
            aria-hidden
          />
          <div className="pointer-events-none absolute -right-24 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-primary-400/10 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/30">
                <Sparkles className="h-7 w-7" aria-hidden />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700">Next step</p>
                <h2 className="text-xl font-semibold text-slate-900">Generate your roadmap</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Phased timeline, action items, and areas to strengthen — from your profile.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className={cn(
                "inline-flex shrink-0 items-center justify-center gap-3 rounded-xl px-8 py-4 text-base font-bold text-white shadow-lg transition-all",
                "bg-gradient-to-r from-primary-600 to-primary-700 shadow-primary-600/25",
                "hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" aria-hidden />
                  Generate my roadmap
                </>
              )}
            </button>
          </div>
          {history.length > 0 && (
            <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4 text-xs text-slate-600">
              <div>
                <span className="font-bold text-slate-800">Saved roadmaps:</span>{" "}
                <select
                  value={roadmapId ?? (history[0]?.roadmapId ?? "")}
                  onChange={(e) => {
                    const id = e.target.value;
                    const selected = history.find((r) => r.roadmapId === id);
                    if (selected) {
                      setRoadmapId(selected.roadmapId);
                      setRoadmap(selected.roadmap);
                    }
                  }}
                  className="ml-1 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/15"
                >
                  {history.map((r) => (
                    <option key={r.roadmapId} value={r.roadmapId}>
                      {new Date(r.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </option>
                  ))}
                </select>
              </div>
              {historyLoading && <span>Loading saved roadmaps…</span>}
              {!historyLoading && historyError && <span className="font-medium text-amber-800">{historyError}</span>}
            </div>
          )}

          {loading && (
            <div className="relative mt-6 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-600">Building your roadmap…</span>
                <span className="text-sm font-bold tabular-nums text-primary-600">{progress}%</span>
              </div>
              <div className="overflow-hidden rounded-xl bg-slate-100/90">
                <motion.div
                  className="h-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: reduceMotion ? 0 : 0.4 }}
                />
              </div>
            </div>
          )}
        </motion.section>
      </motion.div>

      {/* Roadmap result — timeline theme with charts and animations */}
      <AnimatePresence>
        {roadmap && (
          <motion.section
            ref={roadmapRef}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.5 }}
            className="scroll-mt-24 space-y-10 rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-onboarding-card backdrop-blur-sm sm:p-8"
          >
            {/* Header + Export */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Your personalized roadmap</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="inline-flex items-center gap-2 rounded-xl border border-primary-500/50 bg-white px-4 py-2.5 text-sm font-bold text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ics = buildIcs();
                    if (!ics) return;
                    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "mycollegepath-roadmap.ics";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast?.({ title: "Calendar export created", description: "Import the .ics file into your calendar app." });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <CalendarDays className="h-4 w-4" />
                  Export .ics
                </button>
              </div>
            </div>

            {/* Summary — prominent card */}
            {roadmap.summary && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 via-white to-emerald-50/60 p-6 shadow-md"
              >
                <Quote className="absolute right-4 top-4 h-10 w-10 text-primary-300/60" aria-hidden />
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/20 text-primary-600">
                    <Flag className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary-700">Strategy summary</h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-primary">{roadmap.summary}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Areas to strengthen — severity bars + badges */}
            {roadmap.gaps.length > 0 && (
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-base font-bold text-text-primary">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Areas to strengthen
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {roadmap.gaps.map((g, i) => {
                    const sev = getSeverityStyle(g);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.12 + 0.06 * i, duration: 0.35 }}
                        className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="font-semibold text-text-primary">{g.area}</p>
                          <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", sev.badgeBg, sev.badgeText)}>
                            {sev.label}
                          </span>
                        </div>
                        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <motion.div
                            className={cn("h-full rounded-full", sev.barBg)}
                            initial={{ width: 0 }}
                            animate={{ width: getSeverityBarWidth(g.severity) }}
                            transition={{ delay: 0.2 + 0.06 * i, duration: 0.5 }}
                          />
                        </div>
                        <p className="text-xs text-text-muted">{g.description}</p>
                        <p className="mt-2 text-xs font-medium text-primary-600">{g.recommendation}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Overview bar chart — tasks per phase (pixel heights so bars always render) */}
            {roadmap.phases.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                    <BarChart2 className="h-4 w-4 shrink-0 text-primary-500" />
                    Roadmap overview
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Quick snapshot of how many <span className="font-semibold text-slate-800">action items</span> are planned
                    in each phase (P1–P{roadmap.phases.length}). A taller bar means more tasks in that part of your timeline —
                    not “importance,” just workload spread.
                  </p>
                </div>
                <div className="flex items-end justify-between gap-2 sm:gap-4">
                  {roadmap.phases
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((phase, i) => {
                      const count = phase.items.length;
                      const maxCount = Math.max(...roadmap.phases.map((p) => p.items.length), 1);
                      const CHART_PX = 112;
                      const barHeightPx = Math.max(14, Math.round((count / maxCount) * CHART_PX));
                      return (
                        <div key={phase.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                          <span className="text-xs font-bold tabular-nums text-primary-700">{count}</span>
                          <div
                            className="flex h-[120px] w-full max-w-[5rem] flex-col justify-end rounded-t-lg bg-slate-100/90 sm:max-w-none"
                            aria-hidden
                          >
                            <motion.div
                              className="mx-auto w-[72%] rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400 shadow-sm sm:w-[70%]"
                              initial={{ height: 0 }}
                              animate={{ height: barHeightPx }}
                              transition={{ delay: 0.2 + 0.07 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                          <div className="w-full text-center">
                            <span className="text-[11px] font-bold text-slate-700">P{phase.order}</span>
                            <p className="line-clamp-2 text-[10px] leading-snug text-slate-500" title={phase.title}>
                              {phase.title}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  Tip: scroll down to <span className="font-medium text-slate-700">Your timeline</span> for full task lists and
                  checkboxes per phase.
                </p>
              </motion.div>
            )}

            {/* Vertical timeline — one row per phase: circle + card */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-text-primary">Your timeline</h3>
              <div className="relative">
                {/* Full-height vertical line (animated) */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" aria-hidden />
                <motion.div
                  className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-primary-500 to-primary-400"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.9, delay: 0.3 }}
                  style={{ transformOrigin: "top", height: "100%" }}
                  aria-hidden
                />

                <div className="space-y-6">
                  {roadmap.phases
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((phase: RoadmapPhase, i: number) => (
                      <div key={phase.id} className="relative flex gap-6 sm:gap-8">
                        <div className="relative z-10 flex shrink-0 items-start pt-2" style={{ width: 48 }}>
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.35 + 0.1 * i, type: "spring", stiffness: 300 }}
                            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary-500 bg-white text-sm font-bold text-primary-600 shadow-md"
                          >
                            {phase.order}
                          </motion.div>
                        </div>

                        {/* Phase card */}
                      <motion.article
                        key={phase.id}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + 0.12 * i, duration: 0.4 }}
                        className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-md transition-all hover:border-primary-200 hover:shadow-lg"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <span className="inline-block rounded-full bg-primary-500/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-600">
                              Phase {phase.order}
                            </span>
                            <h4 className="mt-1 text-lg font-bold text-text-primary">{phase.title}</h4>
                            {phase.subtitle && <p className="text-sm text-text-muted">{phase.subtitle}</p>}
                            {phase.phaseSummary && (
                              <p className="mt-2 text-sm leading-relaxed text-text-primary/90">{phase.phaseSummary}</p>
                            )}
                          </div>
                          <span className="rounded-xl border border-primary-500/30 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600">
                            {phase.timeframe}
                          </span>
                        </div>
                        {phase.focusArea && (
                          <p className="mb-3 text-xs font-medium text-text-muted">Focus: {phase.focusArea}</p>
                        )}
                        <ul className="space-y-2">
                          {phase.items.map((item, j) => {
                            const cat = item.category ? CATEGORY_MAP[item.category] : null;
                            const checked = selectedCompletedIds.includes(item.id);
                            return (
                              <motion.li
                                key={item.id}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + 0.12 * i + 0.04 * j }}
                                className={cn(
                                  "flex items-start gap-3 rounded-xl border px-4 py-3 transition-all",
                                  checked
                                    ? "border-emerald-200 bg-emerald-50/70"
                                    : "border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-200"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleTask(item.id)}
                                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-primary-600 focus:ring-primary-500/40"
                                  aria-label={`Mark task as complete: ${item.text}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-sm font-medium", checked ? "text-text-muted line-through" : "text-text-primary")}>
                                    {item.text}
                                  </p>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    <span
                                      className={cn(
                                        "inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                        item.priority === "high" ? "bg-primary-100 text-primary-700" : item.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-text-muted"
                                      )}
                                    >
                                      {item.priority}
                                    </span>
                                    {cat && (
                                      <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", cat.bg, cat.text)}>
                                        {cat.label}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {checked && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                              </motion.li>
                            );
                          })}
                        </ul>
                      </motion.article>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
