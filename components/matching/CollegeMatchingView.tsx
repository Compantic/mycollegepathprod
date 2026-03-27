"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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

const STEP_CARDS = [
  {
    step: 1,
    title: "Your profile",
    description: "We use your GPA, SAT/ACT, preferred states, and campus size from Settings.",
    icon: User,
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-500",
    textAccent: "text-blue-700",
  },
  {
    step: 2,
    title: "Run matching",
    description: "Click the button below. Our algorithm finds schools that fit your profile.",
    icon: Zap,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-500",
    textAccent: "text-amber-800",
  },
  {
    step: 3,
    title: "Explore & save",
    description: "View match scores, add favorites to your list, and read improvement tips.",
    icon: Search,
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-500",
    textAccent: "text-emerald-800",
  },
] as const;

type ParamId = "gpa" | "sat" | "act" | "states" | "size" | "majors";

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
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    iconClass: "text-indigo-600",
    getValue: (p) => (p.gpa != null ? String(p.gpa) : null),
  },
  {
    id: "sat",
    label: "SAT",
    description: "SAT composite or section scores are matched against college score ranges for fit scoring.",
    icon: Gauge,
    bg: "bg-violet-50",
    border: "border-violet-200",
    iconClass: "text-violet-600",
    getValue: (p) => (p.satScore != null ? String(p.satScore) : null),
  },
  {
    id: "act",
    label: "ACT",
    description: "ACT composite is used alongside or instead of SAT when available for the same fit logic.",
    icon: Gauge,
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconClass: "text-purple-600",
    getValue: (p) => (p.actScore != null ? String(p.actScore) : null),
  },
  {
    id: "states",
    label: "Preferred states",
    description: "We prioritize schools in your chosen states and boost their match score when location matters.",
    icon: MapPin,
    bg: "bg-sky-50",
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
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    iconClass: "text-cyan-600",
    getValue: (p) => p.preferredSize ?? null,
  },
  {
    id: "majors",
    label: "Majors",
    description: "Programs you’re interested in help surface schools that offer strong options in those fields.",
    icon: BookOpen,
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    iconClass: "text-fuchsia-600",
    getValue: (p) =>
      (p.preferredMajors?.length ?? 0) > 0
        ? p.preferredMajors!.slice(0, 2).join(", ") + ((p.preferredMajors?.length ?? 0) > 2 ? "…" : "")
        : null,
  },
];

const PROFILE_METRIC_STYLES: Record<string, { bg: string; border: string; iconClass: string }> = {
  gpa: { bg: "bg-indigo-50", border: "border-indigo-200", iconClass: "text-indigo-600" },
  sat: { bg: "bg-violet-50", border: "border-violet-200", iconClass: "text-violet-600" },
  act: { bg: "bg-purple-50", border: "border-purple-200", iconClass: "text-purple-600" },
  states: { bg: "bg-sky-50", border: "border-sky-200", iconClass: "text-sky-600" },
  size: { bg: "bg-cyan-50", border: "border-cyan-200", iconClass: "text-cyan-600" },
  majors: { bg: "bg-fuchsia-50", border: "border-fuchsia-200", iconClass: "text-fuchsia-600" },
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
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Breadcrumb */}
      <motion.nav
        className="text-sm text-text-muted"
        aria-label="Breadcrumb"
        variants={itemVariants}
      >
        <Link href="/app" className="hover:text-primary-500 transition-colors">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-text-primary">College Matching</span>
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
              <Target className="h-7 w-7" aria-hidden />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                College Matching
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
                Get personalized college recommendations based on your GPA, test scores, activities,
                preferences, and full onboarding questionnaire. We use your saved profile to find
                reach, match, and safety schools.
              </p>
            </div>
          </div>
          <Link
            href="/app/profile"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-bg-border bg-white px-4 py-2.5 text-sm font-medium text-text-primary transition-all hover:border-primary-500 hover:bg-primary-50/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <Settings className="h-4 w-4" />
            Update profile
          </Link>
        </div>
      </motion.section>

      {/* How it works */}
      <motion.section aria-labelledby="how-it-works-heading" variants={itemVariants}>
        <h2 id="how-it-works-heading" className="mb-6 text-lg font-bold text-text-primary">
          How it works
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {STEP_CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.step}
                className={`group relative overflow-hidden rounded-2xl border-2 ${card.border} ${card.bg} p-5 transition-shadow hover:shadow-lg`}
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="flex gap-4">
                  <motion.div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconBg} text-white shadow-sm`}
                    whileHover={{ scale: 1.08 }}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-text-primary shadow-sm mb-1">
                      {card.step}
                    </span>
                    <h3 className={`font-semibold ${card.textAccent}`}>{card.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-text-muted">{card.description}</p>
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
        className="rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-slate-50/80 to-white p-6 shadow-sm"
        variants={itemVariants}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="params-heading"
            className="flex items-center gap-2 text-lg font-bold text-text-primary"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            How we match you
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full border border-bg-border bg-slate-100 text-text-muted"
              title="These parameters are used by our algorithm to find and rank schools."
            >
              <HelpCircle className="h-3 w-3" aria-hidden />
            </span>
          </h2>
          {hasProfile && (
            <span className="text-sm text-text-muted">
              <span className="font-semibold text-primary-600">{paramsSet}</span> of {totalParams} parameters set
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
                className={`rounded-xl border-2 ${param.border} ${param.bg} p-4 transition-shadow hover:shadow-md`}
                variants={itemVariants}
              >
                <div className="flex items-start gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${param.iconClass} bg-white/80`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-primary">{param.label}</h3>
                      {isSet ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                      )}
                    </div>
                    {isSet && (
                      <p className="mt-0.5 text-sm font-medium text-text-primary">{value}</p>
                    )}
                    <p className="mt-2 text-xs leading-relaxed text-text-muted">
                      {param.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      {/* Profile used for matching */}
      <motion.section
        aria-labelledby="profile-heading"
        className="rounded-2xl border-2 border-bg-border bg-white p-6 shadow-sm"
        variants={itemVariants}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="profile-heading"
            className="flex items-center gap-2 text-lg font-bold text-text-primary"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Gauge className="h-4 w-4" aria-hidden />
            </span>
            Profile used for matching
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full border border-bg-border bg-slate-100 text-text-muted"
              title="We use your profile, questionnaire, and preferences together to find schools that fit you."
            >
              <HelpCircle className="h-3 w-3" aria-hidden />
            </span>
          </h2>
          <Link
            href="/app/profile"
            className="text-sm font-medium text-primary-500 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500/30 rounded"
          >
            Edit profile →
          </Link>
        </div>
        {hasProfile ? (
          <motion.div
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {profile!.gpa != null && (
              <motion.div
                className={`flex items-center gap-3 rounded-xl border ${PROFILE_METRIC_STYLES.gpa.border} ${PROFILE_METRIC_STYLES.gpa.bg} px-4 py-3 transition-shadow hover:shadow-md`}
                variants={itemVariants}
              >
                <BookOpen className={`h-5 w-5 shrink-0 ${PROFILE_METRIC_STYLES.gpa.iconClass}`} aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-muted">GPA</p>
                  <p className="font-semibold text-text-primary">{profile!.gpa}</p>
                </div>
              </motion.div>
            )}
            {profile!.satScore != null && (
              <motion.div
                className={`flex items-center gap-3 rounded-xl border ${PROFILE_METRIC_STYLES.sat.border} ${PROFILE_METRIC_STYLES.sat.bg} px-4 py-3 transition-shadow hover:shadow-md`}
                variants={itemVariants}
              >
                <Gauge className={`h-5 w-5 shrink-0 ${PROFILE_METRIC_STYLES.sat.iconClass}`} aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-muted">SAT</p>
                  <p className="font-semibold text-text-primary">{profile!.satScore}</p>
                </div>
              </motion.div>
            )}
            {profile!.actScore != null && (
              <motion.div
                className={`flex items-center gap-3 rounded-xl border ${PROFILE_METRIC_STYLES.act.border} ${PROFILE_METRIC_STYLES.act.bg} px-4 py-3 transition-shadow hover:shadow-md`}
                variants={itemVariants}
              >
                <Gauge className={`h-5 w-5 shrink-0 ${PROFILE_METRIC_STYLES.act.iconClass}`} aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-muted">ACT</p>
                  <p className="font-semibold text-text-primary">{profile!.actScore}</p>
                </div>
              </motion.div>
            )}
            {(profile!.preferredStates?.length ?? 0) > 0 && (
              <motion.div
                className={`flex items-center gap-3 rounded-xl border ${PROFILE_METRIC_STYLES.states.border} ${PROFILE_METRIC_STYLES.states.bg} px-4 py-3 transition-shadow hover:shadow-md`}
                variants={itemVariants}
              >
                <MapPin className={`h-5 w-5 shrink-0 ${PROFILE_METRIC_STYLES.states.iconClass}`} aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-muted">States</p>
                  <p
                    className="font-semibold text-text-primary truncate"
                    title={profile!.preferredStates?.join(", ") ?? ""}
                  >
                    {profile!.preferredStates?.slice(0, 3).join(", ") ?? ""}
                    {(profile!.preferredStates?.length ?? 0) > 3 ? "…" : ""}
                  </p>
                </div>
              </motion.div>
            )}
            {profile!.preferredSize && (
              <motion.div
                className={`flex items-center gap-3 rounded-xl border ${PROFILE_METRIC_STYLES.size.border} ${PROFILE_METRIC_STYLES.size.bg} px-4 py-3 transition-shadow hover:shadow-md`}
                variants={itemVariants}
              >
                <Target className={`h-5 w-5 shrink-0 ${PROFILE_METRIC_STYLES.size.iconClass}`} aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Size</p>
                  <p className="font-semibold text-text-primary capitalize">{profile!.preferredSize}</p>
                </div>
              </motion.div>
            )}
            {(profile!.preferredMajors?.length ?? 0) > 0 && (
              <motion.div
                className={`flex items-center gap-3 rounded-xl border ${PROFILE_METRIC_STYLES.majors.border} ${PROFILE_METRIC_STYLES.majors.bg} px-4 py-3 transition-shadow hover:shadow-md`}
                variants={itemVariants}
              >
                <BookOpen className={`h-5 w-5 shrink-0 ${PROFILE_METRIC_STYLES.majors.iconClass}`} aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Majors</p>
                  <p
                    className="font-semibold text-text-primary truncate"
                    title={profile!.preferredMajors?.join(", ") ?? ""}
                  >
                    {profile!.preferredMajors?.slice(0, 2).join(", ") ?? ""}
                    {(profile!.preferredMajors?.length ?? 0) > 2 ? "…" : ""}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="rounded-xl border-2 border-dashed border-bg-border bg-slate-50/80 p-8 text-center"
            variants={itemVariants}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-500">
              <User className="h-7 w-7" aria-hidden />
            </div>
            <p className="mt-4 text-sm text-text-muted">
              No profile data yet. Add your GPA and test scores in your profile for better matches.
            </p>
            <Link
              href="/app/profile"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              Go to profile →
            </Link>
          </motion.div>
        )}
      </motion.section>

      {/* Run matching + results */}
      <motion.section variants={itemVariants}>
        {hasProfile && (!profile?.preferredStates || profile.preferredStates.length === 0) && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Recommendations are only from your preferred states. Add at least one state in your profile to get up to 20 personalized matches.
          </div>
        )}
        <MatchingRun basePath="/app/colleges" />
      </motion.section>

      {/* Reality check band */}
      {hasProfile && (
        <motion.section
          className="rounded-2xl border-2 border-bg-border bg-white p-6 shadow-sm"
          variants={itemVariants}
        >
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Shield className="h-4 w-4" aria-hidden />
            </span>
            Reality check overview
          </h2>
          <p className="text-xs text-text-muted mb-4">
            This is a rough, data-informed band using your GPA and test scores. It is not an admissions decision.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <motion.div
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                State flagships
              </p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {profile!.gpa != null && profile!.gpa >= 3.7
                  ? "High chance"
                  : profile!.gpa != null && profile!.gpa >= 3.3
                    ? "Solid match"
                    : "Depends on test scores"}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">
                Strong academics plus in-state advantage often help here.
              </p>
            </motion.div>
            <motion.div
              className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700">
                Top‑50 universities
              </p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {profile!.gpa != null && profile!.gpa >= 3.8 ? "Competitive range" : "Reach"}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">
                Selective but realistic for strong transcripts and testing.
              </p>
            </motion.div>
            <motion.div
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                Ivy / ultra‑selective
              </p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {profile!.gpa != null && profile!.gpa >= 3.9 ? "Reach (possible)" : "Very low probability"}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">
                Admission is highly competitive even for top students.
              </p>
            </motion.div>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
