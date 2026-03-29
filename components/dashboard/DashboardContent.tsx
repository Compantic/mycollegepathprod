"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  BarChart3,
  User,
  AlertCircle,
  Upload,
  Zap,
  Plus,
  ChevronRight,
  Sparkles,
  Activity,
  TrendingUp,
  Trophy,
} from "lucide-react";
import type { DashboardUserData, SavedCollegeItem } from "@/lib/dashboard/getDashboardData";
import { useFirstTenActivation } from "@/hooks/useFirstTenActivation";

const PRIORITY_IMAGES: Record<string, string> = {
  "Add colleges to your list":
    "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=224&fit=crop",
  "Complete your profile":
    "https://images.unsplash.com/photo-1499750317857-19fde224296d?w=400&h=224&fit=crop",
  "Explore college matching":
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=224&fit=crop",
  "Chat with your AI coach":
    "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=400&h=224&fit=crop",
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return `Today at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  if (diffDays === 1) return `Yesterday at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

const FirstTenActivationCard = dynamic(
  () =>
    import("@/components/dashboard/FirstTenActivationCard").then((m) => m.FirstTenActivationCard),
  { ssr: false }
);

export interface DashboardContentProps {
  data: DashboardUserData | null;
  readiness: number;
  health: { essays: number; collegeList: number; documents: number };
  aiTip: string;
  aiLeaderboard?: { uid: string; displayName: string; score: number }[];
}

export function DashboardContent({ data, readiness, health, aiTip, aiLeaderboard = [] }: DashboardContentProps) {
  const firstName = data?.firstName ?? "there";
  const savedColleges = data?.savedColleges ?? [];
  const activation = useFirstTenActivation(data?.uid, Boolean(data?.onboardingAnswers));

  const priorities: { tag: "URGENT" | "HIGH PRIORITY" | "IN PROGRESS" | "QUICK WIN"; tagClass: string; title: string; subtitle: string; href: string; cta: string }[] = [];
  if (savedColleges.length < 3) {
    priorities.push({
      tag: "HIGH PRIORITY",
      tagClass: "bg-amber-500 text-white",
      title: "Add colleges to your list",
      subtitle: "Build a balanced list of reach, match, and safety schools",
      href: "/app/colleges",
      cta: "Add colleges",
    });
  }
  if (data && !data.profile?.gpa && data.profile?.satScore == null && data.profile?.actScore == null) {
    priorities.push({
      tag: priorities.length === 0 ? "URGENT" : "HIGH PRIORITY",
      tagClass: priorities.length === 0 ? "bg-red-500 text-white" : "bg-amber-500 text-white",
      title: "Complete your profile",
      subtitle: "Add GPA and test scores for better matches",
      href: "/app/profile",
      cta: "View profile",
    });
  }
  priorities.push(
    {
      tag: "IN PROGRESS",
      tagClass: "bg-primary-500 text-white",
      title: "Explore college matching",
      subtitle: "Get personalized recommendations",
      href: "/app/matching",
      cta: "Explore matches",
    },
    {
      tag: "QUICK WIN",
      tagClass: "bg-sky-500 text-white",
      title: "Chat with your AI coach",
      subtitle: "Ask questions and get 24/7 guidance",
      href: "/app/chat",
      cta: "Open chat",
    }
  );
  const top3 = priorities.slice(0, 3);

  const recentActivity: { label: string; time: string }[] = savedColleges
    .slice(0, 2)
    .map((c: SavedCollegeItem) => ({ label: `Added ${c.name} to your list`, time: formatRelativeTime(c.savedAt) }));

  const profileStep = (() => {
    if (!data) return 0;
    let score = 0;
    if (data.profile?.gpa != null) score += 40;
    if (data.profile?.satScore != null || data.profile?.actScore != null) score += 30;
    if (data.onboardingAnswers && Object.keys(data.onboardingAnswers).length > 5) score += 30;
    return Math.min(100, score);
  })();

  const collegeListStep = Math.min(100, (savedColleges.length / 8) * 100);
  const matchingStep =
    savedColleges.length >= 5 ? 100 : savedColleges.length > 0 ? 40 : 0;
  const essaysStep = health.essays;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  };

  return (
    <motion.div className="flex gap-8" variants={container} initial="hidden" animate="show">
      <div className="min-w-0 flex-1 space-y-8">
        {/* Greeting + View Profile */}
        <motion.section
          variants={item}
          className="relative overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 via-white to-indigo-50 p-6 shadow-sm"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary-400/15 blur-2xl" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-600">
                <Sparkles className="h-3.5 w-3.5" />
                Daily overview
              </p>
              <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-text-primary">
              {getGreeting()}, {firstName}!
              </h1>
              <p className="mt-1 text-text-muted">
                You&apos;re making great progress. Your application journey is <strong>{readiness}%</strong> complete.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-text-secondary shadow-sm">
                  <span className="text-primary-600">Readiness:</span> {readiness}%
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-text-secondary shadow-sm">
                  <span className="text-primary-600">Saved colleges:</span> {savedColleges.length}
                </span>
              </div>
            </div>
            <Link
              href="/app/profile"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-600 hover:shadow-lg"
            >
              <User className="h-4 w-4" />
              View Profile
            </Link>
          </div>
        </motion.section>

        {activation.show && (
          <motion.section
            variants={item}
            className="rounded-2xl"
          >
            <FirstTenActivationCard
              steps={activation.steps}
              done={activation.done}
              onPersist={activation.persist}
            />
          </motion.section>
        )}

        {/* Student journey progress (4 steps) – values from profile, saved colleges, and health */}
        <motion.section variants={item} className="rounded-2xl border border-bg-border bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-text-primary">
            Your application journey
          </h2>
          <p className="mb-3 text-xs text-text-muted">Progress updates as you complete each step.</p>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                label: "Complete profile",
                value: profileStep,
                href: "/app/profile",
              },
              {
                label: "Build college list",
                value: collegeListStep,
                href: "/app/colleges",
              },
              {
                label: "Run matching & roadmap",
                value: matchingStep,
                href: "/app/matching",
              },
              {
                label: "Finalize essays & apps",
                value: essaysStep,
                href: "/app/essays",
              },
            ].map((step, index) => (
              <Link
                key={step.label}
                href={step.href}
                className="group flex flex-col gap-1 rounded-xl border border-transparent p-2 transition-colors hover:border-primary-100"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-text-secondary">
                    Step {index + 1}
                  </p>
                  <span className="text-[11px] font-semibold text-text-muted">
                    {Math.round(step.value)}%
                  </span>
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  {step.label}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-[width] duration-700 ease-out"
                    style={{ width: `${Math.max(5, Math.min(100, step.value || 0))}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Overall Application Readiness */}
        <motion.section variants={item} className="rounded-2xl border border-bg-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <BarChart3 className="h-4 w-4 text-primary-500" />
              Overall Application Readiness
            </h2>
            <Link href="/app/profile" className="text-sm font-medium text-primary-500 hover:underline">
              View roadmap
            </Link>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <motion.div
              className="h-full rounded-full bg-primary-500 transition-[width] duration-700 ease-out"
              style={{ width: `${readiness}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${readiness}%` }}
              transition={{ duration: 0.7 }}
              role="progressbar"
              aria-valuenow={readiness}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-slate-500">{readiness}% Complete</p>
          <p className="mt-1 text-sm text-text-muted">
            {readiness >= 70
              ? "You're on track. Keep it up!"
              : "Readiness is based on your profile (GPA, test scores, preferences) and how many colleges you've added. Complete your profile and add colleges to increase it."}
          </p>
        </motion.section>

        {/* Today's Top 3 Priorities */}
        <motion.section variants={item}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Today&apos;s Top 3 Priorities
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {top3.map((p, i) => (
              <Link
                key={p.title + i}
                href={p.href}
                className="group flex flex-col overflow-hidden rounded-2xl border border-bg-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-28 w-full overflow-hidden bg-slate-200">
                  {PRIORITY_IMAGES[p.title] ? (
                    <Image
                      src={PRIORITY_IMAGES[p.title]}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200" />
                  )}
                  <span className={`absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shadow-sm ${p.tagClass}`}>
                    {p.tag}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-semibold text-text-primary">{p.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-text-muted">{p.subtitle}</p>
                  <span className="mt-3 inline-flex items-center text-sm font-medium text-primary-500 group-hover:underline">
                    {p.cta}
                    <ChevronRight className="ml-0.5 h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Application Health (from real data: college list count, essays, documents) */}
        <motion.section variants={item} className="rounded-2xl border border-bg-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-text-primary">Application Health</h2>
          <p className="mt-1 text-sm text-text-muted">Based on your profile and saved colleges.</p>
          <div className="mt-4 space-y-4">
            {[
              { name: "Essays & Supplements", value: health.essays, barClass: "bg-primary-500" },
              { name: "College List", value: health.collegeList, barClass: "bg-emerald-500" },
              { name: "Official Documents", value: health.documents, barClass: "bg-amber-500" },
            ].map(({ name, value, barClass }) => (
              <div key={name}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-text-primary">{name}</span>
                  <span className="text-text-muted">{value}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <motion.div
                    className={`h-full rounded-full transition-[width] duration-700 ${barClass}`}
                    style={{ width: `${value}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>

      </div>

      {/* Right sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 space-y-6" aria-label="Quick actions and insights">
        <div className="sticky top-24 space-y-6">
          <motion.section variants={item}>
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/app/colleges"
                className="flex w-full items-center gap-3 rounded-xl border border-bg-border bg-white px-4 py-3 text-left text-sm font-medium text-text-primary shadow-sm transition-all hover:border-primary-500/50 hover:shadow-md"
              >
                <Plus className="h-5 w-5 text-primary-500" />
                Add New College
              </Link>
              <Link
                href="/app/chat"
                className="flex w-full items-center gap-3 rounded-xl border border-bg-border bg-white px-4 py-3 text-left text-sm font-medium text-text-primary shadow-sm transition-all hover:border-primary-500/50 hover:shadow-md"
              >
                <Upload className="h-5 w-5 text-slate-500" />
                Open AI Consultant
              </Link>
            </div>
          </motion.section>

          <motion.section variants={item} className="rounded-2xl border border-bg-border bg-gradient-to-br from-primary-50/80 to-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-text-primary">
              <Zap className="h-5 w-5 text-primary-500" />
              AI Coach Insight
            </h2>
            <p className="mt-3 text-sm italic leading-relaxed text-text-muted">&ldquo;{aiTip}&rdquo;</p>
            <Link
              href="/app/matching"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
            >
              Explore matches
            </Link>
          </motion.section>

          <motion.section variants={item} className="rounded-2xl border border-bg-border bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <TrendingUp className="h-4 w-4 text-primary-500" />
              Recent Activity
            </h3>
            <div className="mt-3 space-y-2">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-text-muted">No recent events yet. Start by adding colleges.</p>
              ) : (
                recentActivity.map((a) => (
                  <div key={`${a.label}-${a.time}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <p className="text-xs font-medium text-text-primary">{a.label}</p>
                    <p className="mt-0.5 text-[11px] text-text-muted">{a.time}</p>
                  </div>
                ))
              )}
            </div>
            <Link
              href="/app/insights"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100"
            >
              <Activity className="h-3.5 w-3.5" />
              Open insights timeline
            </Link>
          </motion.section>

          <motion.section variants={item} className="rounded-2xl border border-bg-border bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Trophy className="h-4 w-4 text-amber-500" />
              AI Score Ranking
            </h3>
            <div className="mt-3 space-y-2">
              {aiLeaderboard.length === 0 ? (
                <p className="text-xs text-text-muted">No AI score data yet.</p>
              ) : (
                aiLeaderboard.slice(0, 8).map((u, i) => (
                  <div key={`${u.uid}-${i}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <p className="truncate text-xs font-medium text-text-primary">#{i + 1} {u.displayName || "Student"}</p>
                    <p className="text-xs font-bold text-primary-600">{u.score}</p>
                  </div>
                ))
              )}
            </div>
            <Link
              href="/app/ai-score"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100"
            >
              Go to My AI Score
            </Link>
          </motion.section>
        </div>
      </aside>
    </motion.div>
  );
}
