"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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

export interface MyRoadPageContentProps {
  onboardingAnswers: OnboardingSnapshot | null;
  profilePhotoUrl?: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const DATA_SECTIONS = [
  {
    key: "academic",
    title: "Academic",
    icon: GraduationCap,
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    iconBg: "bg-indigo-500",
    textAccent: "text-indigo-700",
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
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-500",
    textAccent: "text-emerald-700",
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
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-500",
    textAccent: "text-amber-800",
    getItems: (o: OnboardingSnapshot) => {
      const activities = o.activityTypes?.length ? o.activityTypes.map((a) => (typeof a === "string" ? a : a.type)).join(", ") : null;
      const awardCount = (o.awardsSchool?.length ?? 0) + (o.awardsState?.length ?? 0) + (o.awardsNational?.length ?? 0) + (o.awardsInternational?.length ?? 0);
      return [
        { label: "Activities", value: activities ?? (o.activityTypes?.length ? `${o.activityTypes.length} listed` : null) },
        { label: "Awards", value: awardCount > 0 ? `School: ${o.awardsSchool?.length ?? 0}, State: ${o.awardsState?.length ?? 0}, National+: ${(o.awardsNational?.length ?? 0) + (o.awardsInternational?.length ?? 0)}` : null },
      ];
    },
  },
  {
    key: "preferences",
    title: "Preferences",
    icon: MapPin,
    bg: "bg-sky-50",
    border: "border-sky-200",
    iconBg: "bg-sky-500",
    textAccent: "text-sky-700",
    getItems: (o: OnboardingSnapshot) => [
      { label: "Campus", value: o.campusUrbanSuburbanRural ?? null },
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
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const roadmapRef = useRef<HTMLDivElement>(null);
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

  async function handleGenerate() {
    setLoading(true);
    setRoadmap(null);
    try {
      const res = await fetchWithAuth("/api/roadmap/generate", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate roadmap");
      const data = await res.json();
      const generated: RoadmapResult = data.roadmap ?? data;
      const newId: string = data.roadmapId ?? `roadmap-${Date.now()}`;
      setRoadmapId(newId);
      setRoadmap(generated);
      setHistory((prev) => [
        { roadmapId: newId, createdAt: new Date().toISOString(), roadmap: generated, completedItemIds: [] },
        ...prev,
      ]);
      setCompletedByRoadmap((prev) => ({ ...prev, [newId]: [] }));
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
        className="rounded-2xl border-2 border-primary-500/20 bg-gradient-to-br from-primary-500/10 via-white to-primary-600/5 p-8 sm:p-10 text-center shadow-lg"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg ring-4 ring-primary-500/20">
          <Map className="h-10 w-10" aria-hidden />
        </div>
        <h2 className="mt-6 text-xl font-bold text-text-primary">Complete your profile first</h2>
        <p className="mt-2 max-w-md mx-auto text-sm text-text-muted">
          Your personalized roadmap is based on your profile and questionnaire. Complete onboarding to generate your roadmap.
        </p>
        <Link
          href="/onboarding/step-1"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-primary-600 hover:shadow-lg"
        >
          Complete profile
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Breadcrumb */}
      <motion.nav className="text-sm text-text-muted" aria-label="Breadcrumb" variants={itemVariants}>
        <Link href="/app" className="hover:text-primary-500 transition-colors">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-text-primary">My Roadmap</span>
      </motion.nav>

      {/* Hero */}
      <motion.section
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500/15 via-white to-primary-600/10 border border-primary-500/25 p-6 sm:p-8 shadow-lg"
        variants={itemVariants}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent)] pointer-events-none" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <motion.div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg ring-4 ring-primary-500/20"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Map className="h-7 w-7" aria-hidden />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                My Roadmap
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
                Your profile drives a tailored college application plan. Review your data below, then generate your personalized timeline and action items.
              </p>
            </div>
          </div>
          <Link
            href="/app/profile"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-bg-border bg-white px-4 py-2.5 text-sm font-medium text-text-primary transition-all hover:border-primary-500 hover:bg-primary-50/50 hover:shadow-md"
          >
            <Settings className="h-4 w-4" />
            Update profile
          </Link>
        </div>
      </motion.section>

      {/* Data cards */}
      <motion.section className="space-y-6" variants={itemVariants}>
        <h2 className="text-lg font-bold text-text-primary">Your profile at a glance</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {DATA_SECTIONS.map((section, i) => {
            const items = section.getItems(o!);
            const filled = items.filter((x) => x.value != null && x.value !== "").length;
            if (filled === 0) return null;
            const Icon = section.icon;
            return (
              <motion.div
                key={section.key}
                className={cn("rounded-2xl border-2 p-5 transition-shadow hover:shadow-lg", section.border, section.bg)}
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    className={cn("flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm", section.iconBg)}
                    whileHover={{ scale: 1.08 }}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <h3 className={cn("font-semibold", section.textAccent)}>{section.title}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {items.map(
                    (item, j) =>
                      item.value != null &&
                      item.value !== "" && (
                        <motion.div
                          key={j}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * j }}
                          className="rounded-xl border border-white/80 bg-white/60 px-3 py-2.5 backdrop-blur-sm"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{item.label}</p>
                          <p className="text-sm font-medium text-text-primary break-words">{item.value}</p>
                        </motion.div>
                      )
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Generate CTA */}
      <motion.section
        className="overflow-hidden rounded-2xl border-2 border-primary-500/20 bg-gradient-to-br from-primary-500/10 via-white to-amber-500/5 p-6 shadow-lg"
        variants={itemVariants}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg ring-4 ring-primary-500/20">
              <Sparkles className="h-7 w-7" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Generate your roadmap</h2>
              <p className="mt-1 text-sm text-text-muted">
                Get a phased timeline, action items, and areas to strengthen based on your profile.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className={cn(
              "shrink-0 inline-flex items-center justify-center gap-3 rounded-xl px-8 py-4 text-base font-semibold shadow-lg transition-all",
              "bg-gradient-to-r from-primary-500 to-primary-600 text-white",
              "hover:from-primary-600 hover:to-primary-700 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate my roadmap
              </>
            )}
          </button>
        </div>
        {history.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
            <div>
              <span className="font-semibold text-text-secondary">Saved roadmaps:</span>{" "}
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
                className="ml-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-text-primary shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500/60"
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
            {!historyLoading && historyError && (
              <span className="text-amber-700">{historyError}</span>
            )}
          </div>
        )}

        {loading && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-text-muted">Building your roadmap…</span>
              <span className="text-sm font-bold tabular-nums text-primary-600">{progress}%</span>
            </div>
            <div className="overflow-hidden rounded-xl bg-white/80">
              <motion.div
                className="h-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        )}
      </motion.section>

      {/* Roadmap result — timeline theme with charts and animations */}
      <AnimatePresence>
        {roadmap && (
          <motion.section
            ref={roadmapRef}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-10 rounded-3xl border-2 border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-white p-6 sm:p-8 shadow-xl"
          >
            {/* Header + Export */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-text-primary">Your personalized roadmap</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-primary-500/40 bg-white px-4 py-2.5 text-sm font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
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
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-bg-border bg-white px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-slate-50 transition-colors"
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

            {/* Overview bar chart — tasks per phase */}
            {roadmap.phases.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm"
              >
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-primary">
                  <BarChart2 className="h-4 w-4 text-primary-500" />
                  Roadmap overview
                </h3>
                <div className="flex items-end gap-2 h-20">
                  {roadmap.phases
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((phase, i) => {
                      const count = phase.items.length;
                      const maxCount = Math.max(...roadmap.phases.map((p) => p.items.length), 1);
                      const heightPct = Math.max(25, (count / maxCount) * 100);
                      return (
                        <div key={phase.id} className="flex flex-1 flex-col items-center gap-1 min-w-0">
                          <div className="w-full flex-1 flex flex-col justify-end min-h-[3rem]">
                            <motion.div
                              className="w-full rounded-t-md bg-gradient-to-t from-primary-600 to-primary-500"
                              initial={{ height: 0 }}
                              animate={{ height: `${heightPct}%` }}
                              transition={{ delay: 0.25 + 0.08 * i, duration: 0.5 }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-text-muted">P{phase.order}</span>
                        </div>
                      );
                    })}
                </div>
                <p className="mt-2 text-xs text-text-muted">Tasks per phase (P1–P{roadmap.phases.length})</p>
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
