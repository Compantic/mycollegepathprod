"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  FileText,
  Loader2,
  UploadCloud,
  FileUp,
  Plus,
  Trash2,
  Sparkles,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import {
  listEssays,
  getEssay,
  createEssay,
  updateEssay,
  deleteEssay,
  type EssayDoc,
} from "@/lib/firebase/firestore";
import { extractTextFromPdf } from "@/lib/pdf/extractText";

type FeedbackItem = { title: string; description: string };

interface AnalysisResult {
  toneSummary?: string;
  criticalIssues?: FeedbackItem[];
  suggestions?: FeedbackItem[];
  strengths?: FeedbackItem[];
  heatmap?: {
    impact?: number;
    reflection?: number;
    specificity?: number;
    structure?: number;
    voice?: number;
  };
  overallScore?: number;
  reportSummary?: string;
  criteria?: { name: string; score: number; maxScore: number; description: string; improvementTip?: string }[];
  /** True when the server returned a heuristic review because AI was unavailable. */
  fallback?: boolean;
}

const FEEDBACK_VARIANT = {
  rose: "border-rose-200 bg-rose-50/50 text-rose-900",
  amber: "border-amber-200 bg-amber-50/50 text-amber-900",
  emerald: "border-emerald-200 bg-emerald-50/50 text-emerald-900",
} as const;

function FeedbackSection({
  title,
  variant,
  items,
  emptyText,
}: {
  title: string;
  variant: keyof typeof FEEDBACK_VARIANT;
  items?: FeedbackItem[];
  emptyText: string;
}) {
  const list = items ?? [];
  const shell = FEEDBACK_VARIANT[variant];
  return (
    <div className={cn("rounded-2xl border p-4 shadow-sm", shell)}>
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">{title}</h3>
      {list.length === 0 ? (
        <p className="text-xs text-slate-600/90">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {list.map((item, idx) => (
            <li key={idx} className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-semibold text-slate-900">{item.title}</p>
              <p className="mt-0.5 text-[11px] text-slate-600">{item.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function buildCriterionTip(name: string, score: number, maxScore: number, providedTip?: string): string {
  if (providedTip?.trim()) return providedTip.trim();
  if (score >= maxScore) {
    return "Keep this at 5/5 by preserving this strength while you revise other sections.";
  }

  const gap = Math.max(1, maxScore - score);
  const intensity =
    gap >= 3 ? "Make a substantial revision here." : gap === 2 ? "Make a focused revision here." : "Make a light polish here.";

  const key = name.toLowerCase();
  if (key.includes("clarity")) {
    return `${intensity} Tighten topic sentences, remove vague phrasing, and ensure each paragraph has one clear point.`;
  }
  if (key.includes("structure")) {
    return `${intensity} Improve transitions and paragraph order so the narrative builds logically from start to finish.`;
  }
  if (key.includes("voice")) {
    return `${intensity} Replace generic lines with your own phrasing, perspective, and specific reflections.`;
  }
  if (key.includes("impact")) {
    return `${intensity} Highlight stakes and outcomes: what changed in you, and why it matters to a reader.`;
  }
  if (key.includes("specificity")) {
    return `${intensity} Add concrete details (moments, numbers, names, actions) instead of broad claims.`;
  }
  if (key.includes("reflection")) {
    return `${intensity} Go beyond what happened: explain what you learned and how it shaped your decisions.`;
  }
  if (key.includes("hook") || key.includes("conclusion")) {
    return `${intensity} Open with a vivid, specific hook and end by connecting your growth to future goals.`;
  }
  return `${intensity} Add one concrete example and one reflective sentence to make this criterion stronger.`;
}

export default function EssaysPage() {
  const reduceMotion = useReducedMotion();
  const [essays, setEssays] = useState<EssayDoc[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [essayName, setEssayName] = useState("");
  const [essayText, setEssayText] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid ?? null);
      if (!user) {
        setEssays([]);
        setSelectedId(null);
        setListLoading(false);
        return;
      }
      listEssays(user.uid)
        .then(setEssays)
        .catch(() => setEssays([]))
        .finally(() => setListLoading(false));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId || !selectedId) return;
    getEssay(userId, selectedId).then((doc) => {
      if (doc) {
        setEssayName(doc.name);
        setEssayText(doc.content);
        setAnalysis((doc.analysis as AnalysisResult) ?? null);
      }
    });
  }, [userId, selectedId]);

  useEffect(() => {
    if (!analysis) return;
    const id = requestAnimationFrame(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, [analysis]);

  async function handleSave() {
    if (!userId) {
      setError("Sign in to save essays.");
      return;
    }
    const name = essayName.trim() || "Untitled essay";
    setError(null);
    setSaving(true);
    try {
      if (selectedId) {
        await updateEssay(userId, selectedId, { name, content: essayText, analysis: analysis ?? undefined });
        setEssays((prev) =>
          prev.map((e) =>
            e.id === selectedId
              ? { ...e, name, content: essayText, analysis: analysis ?? e.analysis, updatedAt: new Date().toISOString() }
              : e
          )
        );
      } else {
        const id = await createEssay(userId, name, essayText, analysis ?? undefined);
        setSelectedId(id);
        const newDoc: EssayDoc = {
          id,
          name,
          content: essayText,
          analysis: analysis ?? undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setEssays((prev) => [newDoc, ...prev]);
      }
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAnalyze() {
    setError(null);
    setAnalysis(null);
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/essays/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essay: essayText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAnalysis(data);
      if (userId && selectedId) {
        await updateEssay(userId, selectedId, { analysis: data });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: "text" | "pdf") {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (type === "text") {
      if (!file.type.startsWith("text/") && !file.name.endsWith(".md")) {
        setError("Use a .txt or .md file, or paste text.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setEssayText(String(reader.result ?? ""));
        setError(null);
      };
      reader.readAsText(file);
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }
    setError(null);
    extractTextFromPdf(file)
      .then((text) => {
        setEssayText(text);
        if (!essayName.trim()) setEssayName(file.name.replace(/\.pdf$/i, ""));
      })
      .catch(() => setError("Could not read PDF. Try pasting the text instead."));
  }

  function handleNewEssay() {
    setSelectedId(null);
    setEssayName("");
    setEssayText("");
    setAnalysis(null);
    setError(null);
  }

  async function handleDelete(id: string) {
    if (!userId) return;
    try {
      await deleteEssay(userId, id);
      setEssays((prev) => prev.filter((e) => e.id !== id));
      if (selectedId === id) handleNewEssay();
    } catch {
      setError("Could not delete.");
    }
  }

  const canAnalyze = essayText.trim().length >= 50 && !loading;
  const heatmap = analysis?.heatmap ?? null;
  const criteria = analysis?.criteria ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="space-y-6"
    >
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
            <FileText className="h-10 w-10 text-amber-400" strokeWidth={1.5} aria-hidden />
          </motion.div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 backdrop-blur-md">
              <Sparkles className="size-3.5" aria-hidden />
              Writing coach
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Essay Coach</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
              <span className="italic text-primary-400 font-medium">Your voice stays yours.</span> Paste or upload your essay, name it, and get detailed feedback with scores and a full report.
            </p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28, delay: reduceMotion ? 0 : 0.05 }}
        className="flex min-h-[480px] flex-col overflow-y-auto rounded-3xl border border-slate-200/90 bg-white/95 shadow-onboarding-card backdrop-blur-sm md:h-[calc(100vh-12rem)] md:flex-row md:overflow-hidden"
      >
        <div className="h-1 shrink-0 bg-gradient-to-r from-[#0f1b2d] via-primary-600 to-amber-400 md:hidden" aria-hidden />
        {/* Left: essay history */}
        <aside className="flex w-full shrink-0 flex-col border-b border-slate-200/80 bg-gradient-to-b from-slate-50/95 to-white md:w-60 md:border-b-0 md:border-r">
          <div className="hidden h-1 shrink-0 bg-gradient-to-r from-primary-600 to-amber-400 md:block" aria-hidden />
          <div className="border-b border-slate-200/80 p-3">
            <motion.button
              type="button"
              onClick={handleNewEssay}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition-shadow hover:shadow-xl"
            >
              <Plus className="h-4 w-4" />
              New essay
            </motion.button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {listLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 animate-pulse rounded-xl bg-slate-200/60" />
                ))}
              </div>
            ) : essays.length === 0 ? (
              <p className="p-3 text-xs leading-relaxed text-slate-500">
                No saved essays yet. Create one and save.
              </p>
            ) : (
              <ul className="space-y-1">
                {essays.map((e) => (
                  <li key={e.id}>
                    <div
                      className={cn(
                        "flex items-center gap-0.5 rounded-xl px-1.5 py-1 text-sm transition-all",
                        selectedId === e.id
                          ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md ring-2 ring-amber-300/40"
                          : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(e.id)}
                        className="min-w-0 flex-1 truncate px-2 py-2 text-left font-semibold"
                      >
                        {e.name || "Untitled"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(e.id)}
                        className={cn(
                          "rounded-lg p-1.5 transition-colors",
                          selectedId === e.id ? "hover:bg-white/15" : "hover:bg-slate-100"
                        )}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Center: draft */}
        <div className="relative flex min-w-0 flex-1 flex-col bg-gradient-to-b from-white via-slate-50/40 to-primary-50/15">
          <div className="pointer-events-none absolute inset-0 bg-pattern opacity-[0.35]" aria-hidden />
          <div className="relative z-10 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={essayName}
                onChange={(e) => setEssayName(e.target.value)}
                placeholder="Essay name"
                className="max-w-[240px] rounded-xl border-slate-200/90 bg-white text-sm font-semibold text-slate-900 shadow-sm"
              />
              <span className="text-xs font-medium text-slate-500">
                {essayText.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
          </div>
          <div className="relative z-10 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs font-semibold text-emerald-900 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50">
                <UploadCloud className="h-4 w-4 text-emerald-600" aria-hidden />
                Upload .txt
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,text/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, "text")}
                />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs font-semibold text-blue-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50">
                <FileUp className="h-4 w-4 text-primary-600" aria-hidden />
                Upload PDF
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, "pdf")}
                />
              </label>
            </div>
            <textarea
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="Paste your essay here or start typing..."
              spellCheck={false}
              className={cn(
                "block min-h-[280px] w-full resize-y rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400",
                "focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/15"
              )}
            />
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-slate-500 sm:max-w-[55%]">
                Feedback is a guide, not a guarantee. Keep your own voice.
              </p>
              <div className="flex shrink-0 flex-wrap gap-2">
                {userId && (
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    variant="outline"
                    className="rounded-xl border-slate-200 bg-white font-semibold shadow-sm"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                )}
                <motion.button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  whileHover={reduceMotion || !canAnalyze ? undefined : { scale: 1.03 }}
                  whileTap={reduceMotion || !canAnalyze ? undefined : { scale: 0.97 }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition-shadow hover:shadow-xl disabled:pointer-events-none disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? "Analyzing..." : "Get Feedback"}
                </motion.button>
              </div>
            </div>

            {/* Feedback report below essay after analysis */}
            {analysis ? (
              <motion.div
                ref={reportRef}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                className="mt-8 border-t border-slate-200/80 pt-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary-600 ring-1 ring-blue-100">
                    <BarChart3 className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Feedback Report</h2>
                    <p className="text-xs text-slate-500">Scores and notes from your latest analysis</p>
                  </div>
                </div>

                {analysis.fallback ? (
                  <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    <p className="font-semibold">Preliminary review</p>
                    <p className="mt-1 text-amber-900/90">
                      The AI coach was temporarily unavailable, so this is a structural draft review. Re-run analysis
                      shortly for full narrative feedback.
                    </p>
                  </div>
                ) : null}

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {analysis.overallScore != null && (
                    <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 shadow-sm">
                      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-900/80">
                        Overall score
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="relative h-20 w-20 shrink-0">
                          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-violet-200"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-primary-600"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeDasharray={`${analysis.overallScore}, 100`}
                              strokeLinecap="round"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-900">
                            {analysis.overallScore}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">out of 100</p>
                      </div>
                    </section>
                  )}

                  {analysis.reportSummary && (
                    <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm sm:col-span-2">
                      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-900/80">Summary</h3>
                      <p className="text-sm leading-relaxed text-slate-800">{analysis.reportSummary}</p>
                    </section>
                  )}
                </div>

                {criteria.length > 0 && (
                  <section className="mt-6 rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
                    <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
                      Scores by criterion
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {criteria.map((c, i) => (
                        <div key={i}>
                          <div className="mb-0.5 flex justify-between text-xs">
                            <span className="font-semibold text-slate-900">{c.name}</span>
                            <span className="text-slate-500">
                              {c.score}/{c.maxScore}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(c.score / (c.maxScore || 5)) * 100}%` }}
                              transition={{
                                duration: reduceMotion ? 0 : 0.45,
                                delay: reduceMotion ? 0 : i * 0.05,
                                ease: "easeOut",
                              }}
                              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
                            />
                          </div>
                          {c.description && <p className="mt-0.5 text-[11px] text-slate-500">{c.description}</p>}
                          <p className="mt-1.5 rounded-lg border border-amber-200/80 bg-amber-50/70 px-2.5 py-1.5 text-[11px] text-amber-900">
                            <span className="font-semibold">To reach 5/5:</span>{" "}
                            {buildCriterionTip(c.name, c.score, c.maxScore || 5, c.improvementTip)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
                    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-900/80">Tone</h3>
                    <p className="text-sm text-slate-700">{analysis.toneSummary ?? "—"}</p>
                  </section>
                  {heatmap && (
                    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm sm:col-span-2 lg:col-span-2">
                      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-900/80">
                        Quick view (1–5)
                      </h3>
                      <div className="space-y-1.5 text-xs">
                        {["Impact", "Reflection", "Specificity", "Structure", "Voice"].map((label) => {
                          const key = label.toLowerCase() as keyof NonNullable<typeof heatmap>;
                          const value = heatmap[key as keyof typeof heatmap];
                          return (
                            <div key={label} className="flex items-center gap-2">
                              <span className="w-20 text-slate-600">{label}</span>
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/80">
                                <div
                                  className="h-full rounded-full bg-emerald-500"
                                  style={{ width: `${Math.max(8, Math.min(100, (value ?? 0) * 20))}%` }}
                                />
                              </div>
                              <span className="w-6 text-right text-slate-500">{value ?? "—"}/5</span>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-3">
                  <FeedbackSection
                    title="Critical issues"
                    variant="rose"
                    items={analysis.criticalIssues}
                    emptyText="No blocking issues detected."
                  />
                  <FeedbackSection
                    title="Suggestions"
                    variant="amber"
                    items={analysis.suggestions}
                    emptyText="Focused revision ideas will appear here."
                  />
                  <FeedbackSection
                    title="Strengths"
                    variant="emerald"
                    items={analysis.strengths}
                    emptyText="We'll highlight what's working well."
                  />
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {userId && (
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-slate-200 bg-white font-semibold shadow-sm"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                  )}
                  <Button
                    onClick={handleAnalyze}
                    disabled={!canAnalyze || loading}
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-slate-200 bg-white font-semibold shadow-sm"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Re-analyze"}
                  </Button>
                  <Link
                    href="/app/documents"
                    className="inline-flex items-center gap-1 rounded-xl border border-primary-500/80 bg-white px-3 py-2 text-xs font-bold text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
                  >
                    Explore matches <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </motion.div>
            ) : !loading && essayText.trim().length >= 50 ? (
              <p className="mt-6 text-center text-sm text-slate-500">
                Run &quot;Get Feedback&quot; to see your report below.
              </p>
            ) : null}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
