"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Brain, Sparkles, Trophy, Loader2, BarChart3, ShieldCheck, Target } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";
import { LeaderboardObfuscatedName } from "@/components/ai-score/LeaderboardObfuscatedName";
import { cn } from "@/lib/utils";

type AiScoreDoc = {
  uid: string;
  displayName: string;
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  evaluatedAt: string;
  model: string;
};

type LeaderboardRow = {
  uid: string;
  displayName: string;
  score: number;
  evaluatedAt: string;
};

export function AIScorePageContent({
  initialScore,
  currentUserId,
}: {
  initialScore: AiScoreDoc | null;
  currentUserId: string;
}) {
  const reduceMotion = useReducedMotion();
  const [score, setScore] = useState<AiScoreDoc | null>(initialScore);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loadingScore, setLoadingScore] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: reduceMotion ? 0 : 0.06,
          delayChildren: reduceMotion ? 0 : 0.05,
        },
      },
    }),
    [reduceMotion]
  );

  const itemVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 320, damping: 28 },
      },
    }),
    [reduceMotion]
  );

  useEffect(() => {
    void loadLeaderboard();
  }, []);

  async function calculateScore() {
    setLoadingScore(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/api/ai-score/calculate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to calculate score");
      setScore(data.score as AiScoreDoc);
      await loadLeaderboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate score");
    } finally {
      setLoadingScore(false);
    }
  }

  async function loadLeaderboard() {
    setLoadingBoard(true);
    try {
      const res = await fetchWithAuth("/api/ai-score/leaderboard?limit=20", { method: "GET" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load leaderboard");
      setLeaderboard((data.leaderboard ?? []) as LeaderboardRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setLoadingBoard(false);
    }
  }

  const board = leaderboard.length > 0 ? leaderboard : score ? [score] : [];
  const myRank = board.findIndex((x) => x.uid === currentUserId);
  const myPercentile =
    myRank >= 0 && board.length > 0 ? Math.max(1, Math.round(((board.length - myRank) / board.length) * 100)) : null;
  const scoreBand = useMemo(() => {
    const s = score?.score ?? 0;
    if (s >= 85) return { label: "Excellent", chip: "border-emerald-200 bg-emerald-50 text-emerald-800" };
    if (s >= 70) return { label: "Strong", chip: "border-blue-200 bg-blue-50 text-blue-900" };
    if (s >= 55) return { label: "Developing", chip: "border-amber-200 bg-amber-50 text-amber-900" };
    return { label: "Early Stage", chip: "border-slate-200 bg-slate-100 text-slate-700" };
  }, [score?.score]);

  const RUBRIC_ROWS = [
    { icon: BarChart3, title: "Academics", weight: "40%", shell: "border-blue-200 bg-blue-50/80" },
    { icon: ShieldCheck, title: "Testing", weight: "20%", shell: "border-violet-200 bg-violet-50/80" },
    { icon: Trophy, title: "Activities/Awards", weight: "20%", shell: "border-amber-200 bg-amber-50/80" },
    { icon: Target, title: "Clarity/Fit", weight: "20%", shell: "border-emerald-200 bg-emerald-50/80" },
  ] as const;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      <motion.section
        className="relative isolation-isolate overflow-hidden rounded-[2.5rem] border border-slate-800/60 p-8 shadow-2xl shadow-slate-950/20"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
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

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4 sm:gap-8">
            <motion.div
              initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.08, type: "spring", stiffness: 280, damping: 22 }}
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] bg-white/10 text-white shadow-2xl backdrop-blur-xl ring-1 ring-white/20"
            >
              <Brain className="h-10 w-10 text-amber-400" strokeWidth={1.5} aria-hidden />
            </motion.div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 backdrop-blur-md">
                <Sparkles className="size-3.5" aria-hidden />
                Readiness signal
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">My Score</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
                <span className="italic text-primary-400 font-medium">See how your profile stacks up.</span> We build a score from your data, save it, and rank you on the leaderboard.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={calculateScore}
            disabled={loadingScore}
            className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-amber-500/40 transition-all hover:scale-[1.02] hover:shadow-amber-400/50 ring-1 ring-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingScore ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Sparkles className="h-5 w-5" aria-hidden />}
            Calculate Score
          </button>
        </div>

        <div className="relative mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm ring-1 ring-blue-100/60">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-900/80">Current score</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-primary-600">{score?.score ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 shadow-sm ring-1 ring-violet-100/60">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-violet-900/80">Current rank</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{myRank >= 0 ? `#${myRank + 1}` : "—"}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm ring-1 ring-emerald-100/60">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-900/80">Percentile</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{myPercentile != null ? `%${myPercentile}` : "—"}</p>
          </div>
        </div>
      </motion.section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm font-medium text-red-800 shadow-sm">
          {error}
        </div>
      )}

      <motion.div
        className="grid gap-6 lg:grid-cols-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.section
          className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-onboarding-card backdrop-blur-sm lg:col-span-8"
          variants={itemVariants}
        >
          <div className="pointer-events-none absolute inset-0 bg-pattern opacity-[0.2]" aria-hidden />
          <div className="relative z-10">
            {score ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Current score</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <p className="text-4xl font-bold tabular-nums text-primary-600">{score.score}</p>
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide",
                          scoreBand.chip
                        )}
                      >
                        {scoreBand.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    Updated:{" "}
                    {new Date(score.evaluatedAt).toLocaleString(undefined, {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${score.score}%` }}
                    transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-800">{score.summary}</p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-800">Strengths</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                      {(score.strengths ?? []).length === 0 && <li>— No major strengths detected yet.</li>}
                      {(score.strengths ?? []).map((s, i) => (
                        <li key={`${s}-${i}`}>— {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-900">Improve next</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                      {(score.improvements ?? []).length === 0 && <li>— Keep building your profile data.</li>}
                      {(score.improvements ?? []).map((s, i) => (
                        <li key={`${s}-${i}`}>— {s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50/90 to-white p-6 text-center text-sm text-slate-600 shadow-inner">
                No score yet. Use <span className="font-bold text-primary-700">Calculate Score</span> above to run your
                first analysis.
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          className="rounded-3xl border border-violet-200/80 bg-gradient-to-b from-violet-50/50 to-white p-5 shadow-onboarding-card lg:col-span-4"
          variants={itemVariants}
        >
          <h3 className="text-base font-semibold text-slate-900">Scoring rubric</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">The score is based on these main categories.</p>
          <div className="mt-4 space-y-2">
            {RUBRIC_ROWS.map((r) => (
              <div
                key={r.title}
                className={cn("flex items-center justify-between rounded-xl border px-3 py-2.5 shadow-sm", r.shell)}
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-primary-600 shadow-sm ring-1 ring-slate-100">
                    <r.icon className="h-4 w-4" aria-hidden />
                  </span>
                  {r.title}
                </p>
                <p className="text-xs font-bold tabular-nums text-slate-600">{r.weight}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-xl border border-slate-200/80 bg-white/80 p-3 text-xs leading-relaxed text-slate-600">
            Tip: Stronger GPA, test scores, activity depth, and clearer goals tend to raise your score faster.
          </p>
        </motion.section>
      </motion.div>

      <motion.section
        className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-onboarding-card backdrop-blur-sm"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 sm:text-xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
              <Trophy className="h-5 w-5" aria-hidden />
            </span>
            Score Leaderboard
          </h2>
          <button
            type="button"
            onClick={loadLeaderboard}
            disabled={loadingBoard}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-primary-700 shadow-sm transition-colors hover:bg-primary-50 disabled:opacity-60"
          >
            {loadingBoard ? "Loading…" : "Refresh"}
          </button>
        </div>

        {board.length === 0 ? (
          <p className="text-sm text-slate-600">No scores yet. Calculate your score first.</p>
        ) : (
          <motion.div
            className="grid gap-3 md:grid-cols-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {board.map((row, i) => {
              const isMe = row.uid === currentUserId;
              return (
                <motion.div
                  key={row.uid}
                  variants={itemVariants}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border p-4 shadow-sm transition-shadow",
                    isMe
                      ? "border-primary-400/60 bg-gradient-to-r from-primary-50/90 to-amber-50/40 ring-2 ring-amber-300/40"
                      : "border-slate-200/90 bg-white/90 hover:shadow-md"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-slate-900">
                      <span className="shrink-0 tabular-nums">#{i + 1}</span>
                      <LeaderboardObfuscatedName displayName={row.displayName} isSelf={isMe} />
                      {isMe ? <span className="text-primary-600">(You)</span> : null}
                    </p>
                    <p className="text-xs font-medium text-slate-500">{new Date(row.evaluatedAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-xl font-bold tabular-nums text-primary-600">{row.score}</p>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {myRank >= 0 && (
          <p className="mt-4 text-center text-xs font-semibold text-slate-500 sm:text-left">
            Your current rank: <span className="text-primary-700">#{myRank + 1}</span>
          </p>
        )}
      </motion.section>
    </motion.div>
  );
}
