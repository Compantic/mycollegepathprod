"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
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
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import type { DashboardUserData, SavedCollegeItem } from "@/lib/dashboard/getDashboardData";
import { useFirstTenActivation } from "@/hooks/useFirstTenActivation";
import { FirstTenActivationCard } from "@/components/dashboard/FirstTenActivationCard";
import { cn } from "@/lib/utils";

const PRIORITY_IMAGES: Record<string, string> = {
  "Add colleges to your list": "/images/dashboard/priority_college_list.png",
  "Complete your profile": "/images/dashboard/priority_profile_completion.png",
  "Explore college matching": "/images/dashboard/priority_matching.png",
  "Open your consultant chat": "/images/dashboard/priority_ai_coach.png",
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

export interface DashboardContentProps {
  data: DashboardUserData | null;
  readiness: number;
  health: { essays: number; collegeList: number; documents: number };
  aiTip: string;
  aiLeaderboard?: { uid: string; displayName: string; score: number }[];
}

function tagStyles(tag: string) {
  switch (tag) {
    case "URGENT":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "HIGH PRIORITY":
      return "border-amber-300 bg-amber-200 text-amber-900";
    case "IN PROGRESS":
      return "border-primary-400/50 bg-primary-500 text-white";
    case "QUICK WIN":
      return "border-violet-200 bg-violet-50 text-violet-900";
    default:
      return "border-slate-200 bg-slate-100 text-slate-800";
  }
}

export function DashboardContent({ data, readiness, health, aiTip, aiLeaderboard = [] }: DashboardContentProps) {
  const reduceMotion = useReducedMotion();
  const firstName = data?.firstName ?? "there";
  const savedColleges = data?.savedColleges ?? [];
  const activation = useFirstTenActivation(data?.uid, {
    enabled: Boolean(data?.onboardingAnswers),
    savedCollegesCount: savedColleges.length,
  });

  const priorities: {
    tag: "URGENT" | "HIGH PRIORITY" | "IN PROGRESS" | "QUICK WIN";
    title: string;
    subtitle: string;
    href: string;
    cta: string;
  }[] = [];
  if (savedColleges.length < 3) {
    priorities.push({
      tag: "HIGH PRIORITY",
      title: "Add colleges to your list",
      subtitle: "Build a balanced list of reach, match, and safety schools",
      href: "/app/colleges",
      cta: "Add colleges",
    });
  }
  if (data && !data.profile?.gpa && data.profile?.satScore == null && data.profile?.actScore == null) {
    priorities.push({
      tag: priorities.length === 0 ? "URGENT" : "HIGH PRIORITY",
      title: "Complete your profile",
      subtitle: "Add GPA and test scores for better matches",
      href: "/app/profile",
      cta: "View profile",
    });
  }
  priorities.push(
    {
      tag: "IN PROGRESS",
      title: "Explore college matching",
      subtitle: "Get personalized recommendations",
      href: "/app/matching",
      cta: "Explore matches",
    },
    {
      tag: "QUICK WIN",
      title: "Open your consultant chat",
      subtitle: "Ask questions and get 24/7 guidance",
      href: "/app/chat",
      cta: "Open chat",
    }
  );
  const top3 = priorities.slice(0, 3);


  const profileStep = (() => {
    if (!data) return 0;
    let score = 0;
    if (data.profile?.gpa != null) score += 40;
    if (data.profile?.satScore != null || data.profile?.actScore != null) score += 30;
    if (data.onboardingAnswers && Object.keys(data.onboardingAnswers).length > 5) score += 30;
    return Math.min(100, score);
  })();

  const collegeListStep = Math.min(100, (savedColleges.length / 8) * 100);
  const matchingStep = savedColleges.length >= 5 ? 100 : savedColleges.length > 0 ? 40 : 0;
  const essaysStep = health.essays;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: reduceMotion ? 0 : 0.07, delayChildren: reduceMotion ? 0 : 0.06 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 320, damping: 28 },
    },
  };


  return (
    <div className="flex gap-8 lg:gap-10">
      <motion.div
        className="min-w-0 flex-1 space-y-8 lg:space-y-10"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.section 
          variants={item} 
          className="relative isolation-isolate overflow-hidden rounded-[2.5rem] border border-slate-800/60 p-8 shadow-2xl shadow-slate-950/20"
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

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 backdrop-blur-md">
                <Sparkles className="size-3.5" aria-hidden />
                Daily overview
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">
                {getGreeting()}, {firstName}!
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">
                <span className="italic text-primary-400">You&apos;re on your path.</span> Your application journey is{" "}
                <strong className="font-black text-white">{readiness}%</strong> complete.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-xs font-black text-emerald-400 backdrop-blur-md">
                  Readiness {readiness}%
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-xs font-black text-blue-400 backdrop-blur-md">
                  Saved colleges: {savedColleges.length}
                </div>
              </div>
            </div>
            <motion.div whileHover={reduceMotion ? undefined : { y: -4 }} whileTap={reduceMotion ? undefined : { scale: 0.96 }}>
              <Link
                href="/app/profile"
                className="inline-flex items-center gap-2.5 rounded-2xl bg-white px-7 py-4 text-sm font-black text-slate-900 shadow-2xl transition-all hover:bg-slate-50"
              >
                <User className="size-4" aria-hidden />
                View profile
                <ArrowRight className="size-4 opacity-70" aria-hidden />
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {activation.show && (
          <motion.section variants={item} className="rounded-3xl">
            <FirstTenActivationCard
              steps={activation.steps}
              done={activation.done}
              onDismiss={() => activation.persist(true)}
            />
          </motion.section>
        )}


        <motion.section variants={item} className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-lg sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <BarChart3 className="h-5 w-5 text-primary-600" aria-hidden />
              Overall application readiness
            </h2>
            <Link href="/app/myroad" className="text-sm font-bold text-primary-700 hover:text-primary-600 hover:underline">
              View roadmap
            </Link>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200 shadow-inner">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary-600 via-primary-500 to-amber-400"
              initial={false}
              animate={{ width: `${readiness}%` }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
              role="progressbar"
              aria-valuenow={readiness}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{readiness}% complete</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {readiness >= 70
              ? "You're on track. Keep building your list and essays."
              : "Readiness reflects your profile strength and saved colleges. Complete your profile and add schools to climb higher."}
          </p>
        </motion.section>

        <motion.section variants={item}>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <AlertCircle className="h-6 w-6 text-amber-500" aria-hidden />
            Today&apos;s top priorities
          </h2>
          <p className="mt-1 text-sm text-slate-600">High-impact actions — pick one and go.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {top3.map((p, i) => (
              <motion.div
                key={p.title + i}
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.08 + i * 0.06, type: "spring", stiffness: 300, damping: 26 }}
              >
                <Link
                  href={p.href}
                  className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary-900/10 hover:border-primary-200/50"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-slate-200">
                    {PRIORITY_IMAGES[p.title] ? (
                      <Image
                        src={PRIORITY_IMAGES[p.title]}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary-100 to-violet-100" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent opacity-60" />
                    <span
                      className={cn(
                        "absolute right-2 top-2 z-10 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase shadow-sm",
                        tagStyles(p.tag)
                      )}
                    >
                      {p.tag}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-bold text-slate-900">{p.title}</h3>
                    <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-600">{p.subtitle}</p>
                    <span className="mt-4 inline-flex items-center text-sm font-bold text-primary-700">
                      {p.cta}
                      <ChevronRight className="ml-0.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section variants={item} className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-lg sm:p-7">
          <h2 className="text-xl font-semibold text-slate-900">Application health</h2>
          <p className="mt-1 text-sm text-slate-600">Snapshot from your real activity.</p>
          <div className="mt-5 space-y-5">
            {[
              { name: "College list", value: health.collegeList, barClass: "from-emerald-600 to-emerald-400", tint: "border-emerald-200 bg-emerald-50/50" },
              { name: "Official documents", value: health.documents, barClass: "from-amber-500 to-amber-300", tint: "border-amber-200 bg-amber-50/50" },
            ].map(({ name, value, barClass, tint }) => (
              <div key={name} className={cn("rounded-2xl border p-4", tint)}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-800">{name}</span>
                  <span className="font-bold tabular-nums text-slate-600">{value}%</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/80 shadow-inner">
                  <motion.div
                    className={cn("h-full rounded-full bg-gradient-to-r", barClass)}
                    initial={false}
                    animate={{ width: `${value}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </motion.div>

      <aside className="hidden w-72 shrink-0 lg:block" aria-label="Quick actions and insights">
        <motion.div
          className="sticky top-24 space-y-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.section variants={item}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Quick actions</p>
            <div className="space-y-3">
              <motion.div whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                <Link
                  href="/app/colleges"
                  className="flex w-full items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3.5 text-left text-sm font-bold text-emerald-950 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <Plus className="h-5 w-5" aria-hidden />
                  </span>
                  Add new college
                </Link>
              </motion.div>
              <motion.div whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
                <Link
                  href="/app/chat"
                  className="flex w-full items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50/90 px-4 py-3.5 text-left text-sm font-bold text-violet-950 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                    <Upload className="h-5 w-5" aria-hidden />
                  </span>
                  Open consultant chat
                </Link>
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            variants={item}
            className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-primary-50/40 p-5 shadow-lg"
          >
            <div className="pointer-events-none absolute -right-8 top-0 h-24 w-24 rounded-full bg-primary-400/20 blur-2xl" />
            <h2 className="relative flex items-center gap-2 text-base font-bold text-slate-900">
              <Zap className="h-5 w-5 text-amber-500" aria-hidden />
              Daily insight
            </h2>
            <p className="relative mt-3 text-sm italic leading-relaxed text-slate-700">&ldquo;{aiTip}&rdquo;</p>
            <Link
              href="/app/matching"
              className="relative mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition-transform hover:scale-[1.02]"
            >
              Explore matches
            </Link>
          </motion.section>


          <motion.section variants={item} className="rounded-3xl border border-amber-200/90 bg-gradient-to-b from-amber-50/80 to-white p-5 shadow-md">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Trophy className="h-4 w-4 text-amber-600" aria-hidden />
              Profile score ranking
            </h3>
            <div className="mt-3 space-y-2">
              {aiLeaderboard.length === 0 ? (
                <p className="text-xs text-slate-600">No leaderboard data yet.</p>
              ) : (
                aiLeaderboard.slice(0, 8).map((u, i) => (
                  <div
                    key={`${u.uid}-${i}`}
                    className="flex items-center justify-between rounded-xl border border-amber-200/60 bg-white/80 px-3 py-2"
                  >
                    <p className="truncate text-xs font-semibold text-slate-800">
                      #{i + 1} {u.displayName || "Student"}
                    </p>
                    <p className="text-xs font-black tabular-nums text-primary-700">{u.score}</p>
                  </div>
                ))
              )}
            </div>
            <Link
              href="/app/ai-score"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-100/80 py-2.5 text-xs font-bold text-amber-950 hover:bg-amber-200/80"
            >
              My profile score
            </Link>
          </motion.section>
        </motion.div>
      </aside>
    </div>
  );
}
