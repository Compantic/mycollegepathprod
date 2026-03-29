"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, Sparkles, Trophy, Loader2, BarChart3, ShieldCheck, Target } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";

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
  const [score, setScore] = useState<AiScoreDoc | null>(initialScore);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loadingScore, setLoadingScore] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadLeaderboard();
  }, []);

  async function calculateScore() {
    setLoadingScore(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/api/ai-score/calculate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to calculate AI score");
      setScore(data.score as AiScoreDoc);
      await loadLeaderboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate AI score");
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
  const myPercentile = myRank >= 0 && board.length > 0 ? Math.max(1, Math.round(((board.length - myRank) / board.length) * 100)) : null;
  const scoreBand = useMemo(() => {
    const s = score?.score ?? 0;
    if (s >= 85) return { label: "Excellent", chip: "bg-emerald-100 text-emerald-700" };
    if (s >= 70) return { label: "Strong", chip: "bg-blue-100 text-blue-700" };
    if (s >= 55) return { label: "Developing", chip: "bg-amber-100 text-amber-700" };
    return { label: "Early Stage", chip: "bg-slate-100 text-slate-700" };
  }, [score?.score]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 via-white to-indigo-50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
              <Brain className="h-6 w-6 text-primary-500" />
              My AI Score
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">
              Builds an AI readiness score from your profile, saves it, and ranks you among all users.
            </p>
          </div>
          <button
            type="button"
            onClick={calculateScore}
            disabled={loadingScore}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loadingScore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Calculate AI Score
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-primary-100 bg-white/80 p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Current score</p>
            <p className="mt-1 text-2xl font-bold text-primary-600">{score?.score ?? "--"}</p>
          </div>
          <div className="rounded-xl border border-primary-100 bg-white/80 p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Current rank</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">{myRank >= 0 ? `#${myRank + 1}` : "--"}</p>
          </div>
          <div className="rounded-xl border border-primary-100 bg-white/80 p-3">
            <p className="text-xs uppercase tracking-wider text-text-muted">Percentile</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">{myPercentile != null ? `%${myPercentile}` : "--"}</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-bg-border bg-white p-6 shadow-sm lg:col-span-8">
          {score ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Current score</p>
                  <div className="mt-1 flex items-center gap-3">
                    <p className="text-4xl font-bold text-primary-600">{score.score}</p>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${scoreBand.chip}`}>{scoreBand.label}</span>
                  </div>
                </div>
                <p className="text-xs text-text-muted">
                  Updated:{" "}
                  {new Date(score.evaluatedAt).toLocaleString(undefined, {
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-primary-500" style={{ width: `${score.score}%` }} />
              </div>
              <p className="mt-3 text-sm text-text-primary">{score.summary}</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Strengths</p>
                  <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                    {(score.strengths ?? []).length === 0 && <li>- No major strengths detected yet.</li>}
                    {(score.strengths ?? []).map((s, i) => (
                      <li key={`${s}-${i}`}>- {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Improve next</p>
                  <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                    {(score.improvements ?? []).length === 0 && <li>- Keep building your profile data.</li>}
                    {(score.improvements ?? []).map((s, i) => (
                      <li key={`${s}-${i}`}>- {s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-text-muted">
              No score yet. Use the button above to calculate your first AI score.
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-bg-border bg-white p-5 shadow-sm lg:col-span-4">
          <h3 className="text-sm font-semibold text-text-primary">Scoring rubric</h3>
          <p className="mt-1 text-xs text-text-muted">The AI score is based on these main categories.</p>
          <div className="mt-4 space-y-2">
            {[
              { icon: BarChart3, title: "Academics", weight: "40%" },
              { icon: ShieldCheck, title: "Testing", weight: "20%" },
              { icon: Trophy, title: "Activities/Awards", weight: "20%" },
              { icon: Target, title: "Clarity/Fit", weight: "20%" },
            ].map((r) => (
              <div key={r.title} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <p className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <r.icon className="h-4 w-4 text-primary-500" />
                  {r.title}
                </p>
                <p className="text-xs font-semibold text-text-muted">{r.weight}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-text-muted">
            Tip: Stronger GPA, test scores, activity depth, and clearer goals tend to raise your score faster.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-bg-border bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
            <Trophy className="h-5 w-5 text-amber-500" />
            AI Score Leaderboard
          </h2>
          <button
            type="button"
            onClick={loadLeaderboard}
            disabled={loadingBoard}
            className="text-xs font-semibold text-primary-600 hover:underline disabled:opacity-60"
          >
            {loadingBoard ? "Loading..." : "Refresh"}
          </button>
        </div>

        {board.length === 0 ? (
          <p className="text-sm text-text-muted">No scores yet. Calculate your AI score first.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {board.map((row, i) => {
              const isMe = row.uid === currentUserId;
              return (
                <div
                  key={row.uid}
                  className={`flex items-center justify-between rounded-xl border p-3 ${isMe ? "border-primary-300 bg-primary-50/60" : "border-slate-200 bg-white"}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      #{i + 1} {row.displayName || "Student"}
                      {isMe ? " (You)" : ""}
                    </p>
                    <p className="text-xs text-text-muted">{new Date(row.evaluatedAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-lg font-bold text-primary-600">{row.score}</p>
                </div>
              );
            })}
          </div>
        )}

        {myRank >= 0 && (
          <p className="mt-3 text-xs font-medium text-text-muted">
            Your current rank: #{myRank + 1}
          </p>
        )}
      </section>
    </div>
  );
}
