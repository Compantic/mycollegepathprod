"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  Pencil,
  Trash2,
  Sparkles,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { auth } from "@/lib/firebase/client";
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
  criteria?: { name: string; score: number; maxScore: number; description: string }[];
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04 } }),
};

function FeedbackSection({
  title,
  badgeColor,
  items,
  emptyText,
}: {
  title: string;
  badgeColor: string;
  items?: FeedbackItem[];
  emptyText: string;
}) {
  const list = items ?? [];
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</h3>
      {list.length === 0 ? (
        <p className="text-xs text-text-muted">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {list.map((item, idx) => (
            <li key={idx} className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-2">
              <p className="text-xs font-semibold text-text-primary">{item.title}</p>
              <p className="mt-0.5 text-[11px] text-text-muted">{item.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EssaysPage() {
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
        await updateEssay(userId, selectedId, { name, content: essayText });
        setEssays((prev) =>
          prev.map((e) =>
            e.id === selectedId ? { ...e, name, content: essayText, updatedAt: new Date().toISOString() } : e
          )
        );
      } else {
        const id = await createEssay(userId, name, essayText);
        setSelectedId(id);
        const newDoc: EssayDoc = {
          id,
          name,
          content: essayText,
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
      const res = await fetch("/api/essays/analyze", {
        method: "POST",
        credentials: "include",
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
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/20"
        >
          <FileText className="h-7 w-7" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Essay Coach</h1>
          <p className="mt-1 text-sm text-text-muted">
            Paste or upload your essay, name it, and get AI feedback with scores and a full report. Re-analyze after edits.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="flex flex-col md:flex-row md:h-[calc(100vh-14rem)] min-h-[480px] gap-0 overflow-y-auto md:overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.06)]"
      >
      {/* Left: essay history */}
      <aside className="flex w-full md:w-56 shrink-0 flex-col border-b md:border-b-0 md:border-r border-slate-200/80 bg-gradient-to-b from-slate-50 to-white">
        <div className="border-b border-slate-200/80 p-3">
          <motion.button
            type="button"
            onClick={handleNewEssay}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-sm font-semibold text-white shadow-md"
          >
            <Plus className="h-4 w-4" />
            New essay
          </motion.button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {listLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-slate-200/60 animate-pulse" />
              ))}
            </div>
          ) : essays.length === 0 ? (
            <p className="p-3 text-xs text-text-muted">No saved essays yet. Create one and save.</p>
          ) : (
            <ul className="space-y-0.5">
              {essays.map((e) => (
                <li key={e.id}>
                  <div
                    className={cn(
                      "flex items-center gap-1 rounded-xl px-2 py-1.5 text-sm transition-all",
                      selectedId === e.id
                        ? "bg-primary-500 text-white shadow-sm"
                        : "text-text-secondary hover:bg-slate-100 hover:text-text-primary"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(e.id)}
                      className="flex-1 truncate text-left px-1 py-1 font-medium"
                    >
                      {e.name || "Untitled"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(e.id)}
                      className="p-1 rounded hover:bg-white/20"
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
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <div className="border-b border-slate-200/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <Input
              value={essayName}
              onChange={(e) => setEssayName(e.target.value)}
              placeholder="Essay name"
              className="max-w-[240px] rounded-xl border-slate-200 bg-slate-50/80 text-sm font-medium"
            />
            <span className="text-xs text-text-muted">
              {essayText.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-text-primary cursor-pointer hover:bg-slate-50">
              <UploadCloud className="h-4 w-4" />
              Upload .txt
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,text/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, "text")}
              />
            </label>
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-text-primary cursor-pointer hover:bg-slate-50">
              <FileUp className="h-4 w-4" />
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
              "block w-full min-h-[280px] rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-y"
            )}
          />
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-text-muted">AI feedback is a guide, not a guarantee. Keep your own voice.</p>
            <div className="flex gap-2">
              {userId && (
                <Button onClick={handleSave} disabled={saving} variant="outline" className="rounded-xl">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              )}
              <Button onClick={handleAnalyze} disabled={!canAnalyze} className="rounded-xl px-4">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {loading ? "Analyzing..." : "Ask AI Coach"}
              </Button>
            </div>
          </div>

          {/* AI Report below essay after analysis */}
          {analysis ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-8 pt-8 border-t border-slate-200/80"
            >
              <div className="flex items-center gap-2 mb-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-semibold text-text-primary">AI Report</h2>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {analysis.overallScore != null && (
                  <section className="rounded-2xl border border-slate-200/80 bg-white p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Overall score</h3>
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 shrink-0">
                        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                          <path className="text-slate-200" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="text-primary-500" stroke="currentColor" strokeWidth="3" strokeDasharray={`${analysis.overallScore}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-text-primary">{analysis.overallScore}</span>
                      </div>
                      <p className="text-xs text-text-muted">out of 100</p>
                    </div>
                  </section>
                )}

                {analysis.reportSummary && (
                  <section className="sm:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Summary</h3>
                    <p className="text-sm text-text-primary leading-relaxed">{analysis.reportSummary}</p>
                  </section>
                )}
              </div>

              {criteria.length > 0 && (
                <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Scores by criterion</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {criteria.map((c, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="font-medium text-text-primary">{c.name}</span>
                          <span className="text-text-muted">{c.score}/{c.maxScore}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(c.score / (c.maxScore || 5)) * 100}%` }}
                            transition={{ duration: 0.4, delay: i * 0.05 }}
                            className="h-full rounded-full bg-primary-500"
                          />
                        </div>
                        {c.description && <p className="mt-0.5 text-[11px] text-text-muted">{c.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <section className="rounded-2xl border border-slate-200/80 bg-white p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Tone</h3>
                  <p className="text-sm text-text-muted">{analysis.toneSummary ?? "—"}</p>
                </section>
                {heatmap && (
                  <section className="rounded-2xl border border-slate-200/80 bg-white p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Quick view (1–5)</h3>
                    <div className="space-y-1.5 text-xs">
                      {["Impact", "Reflection", "Specificity", "Structure", "Voice"].map((label, i) => {
                        const key = label.toLowerCase() as keyof NonNullable<typeof heatmap>;
                        const value = heatmap[key as keyof typeof heatmap];
                        return (
                          <div key={label} className="flex items-center gap-2">
                            <span className="w-20 text-text-muted">{label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                              <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.max(8, Math.min(100, (value ?? 0) * 20))}%` }} />
                            </div>
                            <span className="w-6 text-right text-text-muted">{value ?? "—"}/5</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                <FeedbackSection title="Critical issues" badgeColor="bg-red-100 text-red-800" items={analysis.criticalIssues} emptyText="No blocking issues detected." />
                <FeedbackSection title="Suggestions" badgeColor="bg-amber-100 text-amber-800" items={analysis.suggestions} emptyText="Focused revision ideas will appear here." />
                <FeedbackSection title="Strengths" badgeColor="bg-emerald-100 text-emerald-800" items={analysis.strengths} emptyText="We'll highlight what's working well." />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button onClick={handleAnalyze} disabled={!canAnalyze || loading} variant="outline" size="sm" className="rounded-xl">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Re-analyze"}
                </Button>
                <Link href="/app/documents" className="inline-flex items-center gap-1 rounded-xl border border-primary-500 px-3 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-50">
                  Explore matches <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </motion.div>
          ) : !loading && essayText.trim().length >= 50 ? (
            <p className="mt-6 text-center text-sm text-text-muted">
              Run &quot;Ask AI Coach&quot; to see your report below.
            </p>
          ) : null}
        </div>
      </div>
      </motion.div>
    </div>
  );
}
