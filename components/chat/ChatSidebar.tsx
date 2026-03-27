"use client";

import Link from "next/link";
import { User, Building2, BookOpen } from "lucide-react";

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
  },
  {
    title: "Work on your essays",
    description: "Draft or refine essays with the Essay Coach.",
    href: "/app/essays",
  },
  {
    title: "Run college matching",
    description: "Get AI-powered recommendations based on your profile.",
    href: "/app/matching",
  },
];

export function ChatSidebar({ data }: { data: ChatContextData | null }) {
  if (!data) {
    return (
      <aside className="hidden lg:flex w-72 shrink-0 flex-col gap-4 border-l border-bg-border bg-slate-50/80 p-4">
        <div className="h-28 rounded-xl bg-slate-200/60 animate-pulse" />
        <div className="h-36 rounded-xl bg-slate-200/60 animate-pulse" />
        <div className="h-24 rounded-xl bg-slate-200/60 animate-pulse" />
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

  return (
    <aside
      className="hidden lg:flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-bg-border bg-slate-50/80 p-4"
      aria-label="Chat context"
    >
      <section aria-labelledby="sidebar-profile-heading" className="animate-in fade-in slide-in-from-right-2 duration-300">
        <h2 id="sidebar-profile-heading" className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <User className="h-4 w-4" />
          Student Profile
        </h2>
        <div className="rounded-xl border border-bg-border bg-white p-4 shadow-sm">
          {profile ? (
            <ul className="space-y-2 text-sm text-text-secondary">
              {profile.gpa != null && <li><span className="font-medium text-text-primary">GPA</span> {profile.gpa}</li>}
              {profile.satScore != null && <li><span className="font-medium text-text-primary">SAT</span> {profile.satScore}</li>}
              {profile.actScore != null && <li><span className="font-medium text-text-primary">ACT</span> {profile.actScore}</li>}
              {profile.preferredStates?.length ? <li><span className="font-medium text-text-primary">States</span> {profile.preferredStates.join(", ")}</li> : null}
              {profile.preferredSize && <li><span className="font-medium text-text-primary">Size</span> {profile.preferredSize}</li>}
              {profile.preferredMajors?.length ? <li><span className="font-medium text-text-primary">Majors</span> {profile.preferredMajors.slice(0, 3).join(", ")}</li> : null}
              {!profile.gpa && !profile.satScore && !profile.actScore && (
                <li className="text-text-muted">Complete your profile in Settings.</li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">Complete your profile in Settings.</p>
          )}
        </div>
      </section>

      <section aria-labelledby="sidebar-schools-heading" className="animate-in fade-in slide-in-from-right-2 duration-300 delay-100">
        <h2 id="sidebar-schools-heading" className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Building2 className="h-4 w-4" />
          Target Schools
        </h2>
        <div className="rounded-xl border border-bg-border bg-white p-4 shadow-sm">
          {targetSchools.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {targetSchools.map((s) => (
                <li key={s.collegeId}>
                  <Link
                    href={`/app/colleges/${s.collegeId}`}
                    className="font-medium text-primary-500 transition-colors hover:text-primary-600 hover:underline"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted">Run Matching or add favorites to see schools.</p>
          )}
        </div>
      </section>

      <section aria-labelledby="sidebar-resources-heading" className="animate-in fade-in slide-in-from-right-2 duration-300 delay-150">
        <h2 id="sidebar-resources-heading" className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <BookOpen className="h-4 w-4" />
          Resources
        </h2>
        <div className="rounded-xl border border-bg-border bg-white p-4 shadow-sm">
          <ul className="space-y-3 text-sm">
            {RESOURCES.map((r) => (
              <li key={r.title}>
                <Link
                  href={r.href}
                  className="block rounded-lg px-2 py-1.5 hover:bg-secondary-100/70 transition-colors"
                >
                  <span className="font-medium text-text-primary">{r.title}</span>
                  <p className="mt-0.5 text-xs text-text-muted">{r.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </aside>
  );
}
