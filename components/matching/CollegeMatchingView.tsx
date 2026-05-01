"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Target,
  User,
  Zap,
  Search,
  Gauge,
  MapPin,
  BookOpen,
  HelpCircle,
  Settings,
  Shield,
  CheckCircle2,
  Circle,
  Sparkles,
} from "lucide-react";
import { MatchingRun } from "./MatchingRun";
import { type ProfileSnapshot } from "./types";

const STEP_CARDS = [
  {
    step: 1,
    title: "Your profile",
    description: "We use your GPA, SAT/ACT, preferred states, and campus size from Settings.",
    icon: User,
    bg: "bg-blue-50/80",
    border: "border-blue-200",
    iconBg: "bg-gradient-to-br from-blue-500 to-primary-600 shadow-md shadow-blue-500/25",
    textAccent: "text-blue-900",
  },
  {
    step: 2,
    title: "Run matching",
    description: "Click the button below. Our algorithm finds schools that fit your profile.",
    icon: Zap,
    bg: "bg-amber-50/80",
    border: "border-amber-200",
    iconBg: "bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20",
    textAccent: "text-amber-900",
  },
  {
    step: 3,
    title: "Explore & save",
    description: "View match scores, add favorites to your list, and read improvement tips.",
    icon: Search,
    bg: "bg-emerald-50/80",
    border: "border-emerald-200",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/20",
    textAccent: "text-emerald-900",
  },
] as const;

type ParamId = "gpa" | "exams" | "states" | "size" | "majors";

const ANALYSIS_PARAMS: {
  id: ParamId;
  label: string;
  description: string;
  icon: typeof BookOpen;
  bg: string;
  border: string;
  iconClass: string;
  getValue: (p: ProfileSnapshot) => string | null;
}[] = [
  {
    id: "gpa",
    label: "GPA",
    description: "Used to compare your academic strength with each school’s middle 50% and assign reach/match/safety.",
    icon: BookOpen,
    bg: "bg-blue-50/70",
    border: "border-blue-200",
    iconClass: "text-primary-600",
    getValue: (p) => (p.gpa != null ? String(p.gpa) : null),
  },
  {
    id: "exams",
    label: "Test Scores",
    description: "Your SAT and ACT scores are matched against college acceptance ranges to calculate your fit score.",
    icon: Gauge,
    bg: "bg-violet-50/70",
    border: "border-violet-200",
    iconClass: "text-violet-600",
    getValue: (p) => {
      const parts = [];
      if (p.satScore != null) parts.push(`SAT: ${p.satScore}`);
      if (p.actScore != null) parts.push(`ACT: ${p.actScore}`);
      return parts.length > 0 ? parts.join(", ") : null;
    },
  },
  {
    id: "states",
    label: "Preferred states",
    description: "We prioritize schools in your chosen states and boost their match score when location matters.",
    icon: MapPin,
    bg: "bg-sky-50/70",
    border: "border-sky-200",
    iconClass: "text-sky-600",
    getValue: (p) =>
      (p.preferredStates?.length ?? 0) > 0
        ? p.preferredStates!.slice(0, 3).join(", ") + ((p.preferredStates?.length ?? 0) > 3 ? "…" : "")
        : null,
  },
  {
    id: "size",
    label: "Campus size",
    description: "Small, medium, or large preference filters and ranks schools by enrollment size.",
    icon: Target,
    bg: "bg-cyan-50/70",
    border: "border-cyan-200",
    iconClass: "text-cyan-600",
    getValue: (p) => p.preferredSize ?? null,
  },
  {
    id: "majors",
    label: "Majors",
    description: "Programs you’re interested in help surface schools that offer strong options in those fields.",
    icon: BookOpen,
    bg: "bg-amber-50/70",
    border: "border-amber-200",
    iconClass: "text-amber-700",
    getValue: (p) =>
      (p.preferredMajors?.length ?? 0) > 0
        ? p.preferredMajors!.slice(0, 2).join(", ") + ((p.preferredMajors?.length ?? 0) > 2 ? "…" : "")
        : null,
  },
];

const PROFILE_METRIC_STYLES: Record<string, { bg: string; border: string; iconClass: string }> = {
  gpa: { bg: "bg-blue-50/80", border: "border-blue-200", iconClass: "text-primary-600" },
  exams: { bg: "bg-violet-50/80", border: "border-violet-200", iconClass: "text-violet-600" },
  states: { bg: "bg-sky-50/80", border: "border-sky-200", iconClass: "text-sky-600" },
  size: { bg: "bg-cyan-50/80", border: "border-cyan-200", iconClass: "text-cyan-600" },
  majors: { bg: "bg-amber-50/80", border: "border-amber-200", iconClass: "text-amber-700" },
};

function countSetParams(profile: ProfileSnapshot | null): number {
  if (!profile) return 0;
  let n = 0;
  if (profile.gpa != null) n++;
  if (profile.satScore != null) n++;
  if (profile.actScore != null) n++;
  if ((profile.preferredStates?.length ?? 0) > 0) n++;
  if (profile.preferredSize) n++;
  if ((profile.preferredMajors?.length ?? 0) > 0) n++;
  return n;
}

export function CollegeMatchingView({ profile }: { profile: ProfileSnapshot | null }) {
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

  const hasProfile =
    profile &&
    (profile.gpa != null ||
      profile.satScore != null ||
      profile.actScore != null ||
      (profile.preferredStates?.length ?? 0) > 0 ||
      !!profile.preferredSize ||
      (profile.preferredMajors?.length ?? 0) > 0);

  const paramsSet = countSetParams(profile);
  const totalParams = ANALYSIS_PARAMS.length;

  return (
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      <motion.div
        className="space-y-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
      {/* Breadcrumb */}
      <motion.nav
        className="text-sm text-slate-500"
        aria-label="Breadcrumb"
        variants={itemVariants}
      >
        <Link href="/app" className="font-medium transition-colors hover:text-primary-600">
          Dashboard
        </Link>
        <span className="mx-2 text-slate-400">/</span>
        <span className="font-semibold text-slate-900">College Matching</span>
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
              <Target className="h-10 w-10 text-amber-400" strokeWidth={1.5} aria-hidden />
            </motion.div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 backdrop-blur-md">
                <Sparkles className="size-3.5" aria-hidden />
                Matching intelligence
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">College Matching</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
                <span className="italic text-primary-400 font-medium">Reach, match, and safety — personalized.</span> Recommendations use your profile to surface schools that fit you.
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

      {/* How it works */}
      <motion.section aria-labelledby="how-it-works-heading" variants={itemVariants}>
        <h2
          id="how-it-works-heading"
          className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-primary-600"
        >
          How it works
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {STEP_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.step}
                className={`group relative overflow-hidden rounded-2xl border ${card.border} ${card.bg} p-5 shadow-md transition-shadow hover:shadow-lg`}
                variants={itemVariants}
                whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.22 } }}
              >
                <div className="flex gap-4">
                  <motion.div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconBg} text-white`}
                    whileHover={reduceMotion ? undefined : { scale: 1.06 }}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <span className="mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-slate-900 shadow-sm ring-1 ring-slate-200/80">
                      {card.step}
                    </span>
                    <h3 className={`font-bold ${card.textAccent}`}>{card.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{card.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Analysis parameters – info cards */}
      <motion.section
        aria-labelledby="params-heading"
        className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-onboarding-card backdrop-blur-sm sm:p-8"
        variants={itemVariants}
      >
        <div className="pointer-events-none absolute inset-0 bg-pattern opacity-[0.25]" aria-hidden />
        <div className="relative z-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="params-heading"
            className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-slate-900"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary-600 ring-1 ring-blue-100">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            How we match you
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500"
              title="These parameters are used by our algorithm to find and rank schools."
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden />
            </span>
          </h2>
          {hasProfile && (
            <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700 ring-1 ring-primary-200/60">
              <span className="tabular-nums">{paramsSet}</span> of {totalParams} parameters set
            </span>
          )}
        </div>
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {ANALYSIS_PARAMS.map((param) => {
            const value = profile ? param.getValue(profile) : null;
            const isSet = !!value;
            const Icon = param.icon;
            return (
              <motion.div
                key={param.id}
                className={`rounded-2xl border ${param.border} ${param.bg} p-4 shadow-sm transition-shadow hover:shadow-md`}
                variants={itemVariants}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 ${param.iconClass} ring-1 ring-slate-100 shadow-sm`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{param.label}</h3>
                      {isSet ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                      )}
                    </div>
                    {isSet && (
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
                    )}
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      {param.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        </div>
      </motion.section>


      {/* Run matching + results */}
      <motion.section variants={itemVariants}>
        {hasProfile && (!profile?.preferredStates || profile.preferredStates.length === 0) && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm font-medium text-amber-900 shadow-sm ring-1 ring-amber-100">
            Recommendations are only from your preferred states. Add at least one state in your profile to get up to 20 personalized matches.
          </div>
        )}
        <MatchingRun basePath="/app/colleges" />
      </motion.section>

      </motion.div>
    </motion.div>
  );
}
