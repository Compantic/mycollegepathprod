"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { User, Building2, BookOpen, Sparkles } from "lucide-react";

export interface ChatContextData {
  profile: {
    gpa?: number;
    satScore?: number;
    actScore?: number;
    preferredMajors?: string[];
    preferredStates?: string[];
    preferredSize?: "small" | "medium" | "large";
  } | null;
  favorites: { collegeId: number; name: string }[];
  latestMatchRun: {
    runId: string;
    matches: { id: number; name: string }[];
  } | null;
}

const RESOURCES = [
  {
    title: "Build your college list",
    description: "Search and add schools you’re interested in.",
    href: "/app/colleges",
    tint: "from-emerald-50 to-white border-emerald-200",
  },
  {
    title: "Work on your essays",
    description: "Draft or refine essays with the Essay Coach.",
    href: "/app/essays",
    tint: "from-violet-50 to-white border-violet-200",
  },
  {
    title: "Run college matching",
    description: "Get recommendations based on your profile.",
    href: "/app/matching",
    tint: "from-blue-50 to-white border-blue-200",
  },
];

export function ChatSidebar({ data }: { data: ChatContextData | null }) {
  const reduceMotion = useReducedMotion();

  if (!data) {
    return (
      <aside className="hidden w-72 shrink-0 flex-col gap-4 border-l border-slate-200/80 bg-gradient-to-b from-slate-50/95 to-white p-4 lg:flex">
        <div className="h-32 rounded-2xl bg-slate-200/50 animate-pulse" />
        <div className="h-40 rounded-2xl bg-slate-200/50 animate-pulse" />
        <div className="h-28 rounded-2xl bg-slate-200/50 animate-pulse" />
      </aside>
    );
  }

  const { profile, favorites, latestMatchRun } = data;
  const targetSchools = [
    ...favorites,
    ...(latestMatchRun?.matches ?? [])
      .filter((m) => !favorites.some((f) => f.collegeId === m.id))
      .slice(0, 5)
      .map((m) => ({ collegeId: m.id, name: m.name })),
  ].slice(0, 10);

  const sectionMotion = {
    initial: reduceMotion ? false : { opacity: 0, x: 12 },
    animate: { opacity: 1, x: 0 },
    transition: { type: "spring" as const, stiffness: 320, damping: 28 },
  };

  return (
    <aside
      className="hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-slate-200/80 bg-gradient-to-b from-slate-50/90 via-white to-primary-50/20 p-4 lg:flex"
      aria-label="Chat context"
    >
      <motion.section aria-labelledby="sidebar-profile-heading" {...sectionMotion} transition={{ ...sectionMotion.transition, delay: reduceMotion ? 0 : 0.05 }}>
        <h2 id="sidebar-profile-heading" className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-primary-700">
            <User className="h-3.5 w-3.5" aria-hidden />
          </span>
          Student profile
        </h2>
        <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/90 to-white p-4 shadow-md">
          {profile ? (
            <ul className="space-y-2 text-sm text-slate-700">
              {profile.gpa != null && (
                <li>
                  <span className="font-bold text-slate-900">GPA</span> {profile.gpa}
                </li>
              )}
              {profile.satScore != null && (
                <li>
                  <span className="font-bold text-slate-900">SAT</span> {profile.satScore}
                </li>
              )}
              {profile.actScore != null && (
                <li>
                  <span className="font-bold text-slate-900">ACT</span> {profile.actScore}
                </li>
              )}
              {profile.preferredStates?.length ? (
                <li>
                  <span className="font-bold text-slate-900">States</span> {profile.preferredStates.join(", ")}
                </li>
              ) : null}
              {profile.preferredSize && (
                <li>
                  <span className="font-bold text-slate-900">Size</span> {profile.preferredSize}
                </li>
              )}
              {profile.preferredMajors?.length ? (
                <li>
                  <span className="font-bold text-slate-900">Majors</span> {profile.preferredMajors.slice(0, 3).join(", ")}
                </li>
              ) : null}
              {!profile.gpa && !profile.satScore && !profile.actScore && (
                <li className="text-slate-500">Complete your profile in Settings.</li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">Complete your profile in Settings.</p>
          )}
        </div>
      </motion.section>

      <motion.section
        aria-labelledby="sidebar-schools-heading"
        initial={reduceMotion ? false : { opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: reduceMotion ? 0 : 0.1, type: "spring", stiffness: 320, damping: 28 }}
      >
        <h2 id="sidebar-schools-heading" className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
          </span>
          Target schools
        </h2>
        <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/80 to-white p-4 shadow-md">
          {targetSchools.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {targetSchools.map((s) => (
                <li key={s.collegeId}>
                  <Link
                    href={`/app/colleges/${s.collegeId}`}
                    className="font-semibold text-primary-700 transition-colors hover:text-primary-600 hover:underline"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-start gap-2 text-sm text-slate-600">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
              Run matching or add favorites to see schools here.
            </p>
          )}
        </div>
      </motion.section>

      <motion.section
        aria-labelledby="sidebar-resources-heading"
        initial={reduceMotion ? false : { opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: reduceMotion ? 0 : 0.15, type: "spring", stiffness: 320, damping: 28 }}
      >
        <h2 id="sidebar-resources-heading" className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-800">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
          </span>
          Resources
        </h2>
        <ul className="space-y-3">
          {RESOURCES.map((r) => (
            <li key={r.title}>
              <Link
                href={r.href}
                className={`block rounded-2xl border bg-gradient-to-br p-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${r.tint}`}
              >
                <span className="font-bold text-slate-900">{r.title}</span>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{r.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </motion.section>
    </aside>
  );
}
