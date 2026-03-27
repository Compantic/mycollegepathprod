"use client";

import React from "react";
import Link from "next/link";
import { Target, User, Zap, Search, Gauge, MapPin, BookOpen } from "lucide-react";
import { MatchingRun } from "@/components/matching/MatchingRun";

const e = React.createElement;

interface ProfileShape {
  gpa?: number;
  satScore?: number;
  actScore?: number;
  preferredStates?: string[];
  preferredSize?: string;
  preferredMajors?: string[];
}

export function CollegeMatchingContent(props: { profile: ProfileShape | null }) {
  const { profile } = props;

  const hasProfile = profile && (
    profile.gpa != null ||
    profile.satScore != null ||
    profile.actScore != null ||
    (profile.preferredStates?.length ?? 0) > 0 ||
    !!profile.preferredSize ||
    (profile.preferredMajors?.length ?? 0) > 0
  );

  return e(
    "div",
    { className: "space-y-10 animate-in fade-in duration-500" },
    e(
      "section",
      { className: "flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between" },
      e(
        "div",
        { className: "flex items-center gap-4" },
        e(
          "div",
          {
            className:
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg",
          },
          e(Target, { className: "h-7 w-7" })
        ),
        e("div", null, e("h1", { className: "text-2xl font-bold text-text-primary sm:text-3xl" }, "College Matching"), e("p", { className: "mt-1 max-w-xl text-sm text-text-muted" }, "Get personalized college recommendations based on your GPA, test scores, and preferences. We use your saved profile to find reach, match, and safety schools."))
      ),
      e(
        Link,
        {
          href: "/app/settings",
          className:
            "shrink-0 rounded-xl border-2 border-bg-border bg-white px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-primary-500 hover:bg-primary-50/50",
        },
        "Update profile"
      )
    ),
    e(
      "section",
      { className: "rounded-2xl border-2 border-bg-border bg-white p-6 shadow-sm" },
      e("h2", { className: "mb-6 text-lg font-bold text-text-primary" }, "How it works"),
      e(
        "div",
        { className: "grid gap-6 sm:grid-cols-3" },
        e(
          "div",
          { className: "flex gap-4 rounded-xl border border-bg-border bg-slate-50/50 p-4 transition-colors hover:border-primary-500/40 hover:bg-primary-50/30" },
          e("div", { className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600" }, e(User, { className: "h-6 w-6" })),
          e(
            "div",
            null,
            e("h3", { className: "font-semibold text-text-primary" }, "1. Your profile"),
            e("p", { className: "mt-1 text-sm text-text-muted" }, "We use your GPA, SAT/ACT, preferred states, and size from Settings.")
          )
        ),
        e(
          "div",
          { className: "flex gap-4 rounded-xl border border-bg-border bg-slate-50/50 p-4 transition-colors hover:border-primary-500/40 hover:bg-primary-50/30" },
          e("div", { className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600" }, e(Zap, { className: "h-6 w-6" })),
          e(
            "div",
            null,
            e("h3", { className: "font-semibold text-text-primary" }, "2. Run matching"),
            e("p", { className: "mt-1 text-sm text-text-muted" }, "Click the button below. Our algorithm finds schools that fit your profile.")
          )
        ),
        e(
          "div",
          { className: "flex gap-4 rounded-xl border border-bg-border bg-slate-50/50 p-4 transition-colors hover:border-primary-500/40 hover:bg-primary-50/30" },
          e("div", { className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600" }, e(Search, { className: "h-6 w-6" })),
          e(
            "div",
            null,
            e("h3", { className: "font-semibold text-text-primary" }, "3. Explore & save"),
            e("p", { className: "mt-1 text-sm text-text-muted" }, "View match scores, add favorites to your list, and read improvement tips.")
          )
        )
      )
    ),
    e(
      "section",
      { className: "rounded-2xl border-2 border-bg-border bg-white p-6 shadow-sm" },
      e(
        "h2",
        { className: "mb-4 flex items-center gap-2 text-lg font-bold text-text-primary" },
        e(Gauge, { className: "h-5 w-5 text-primary-500" }),
        " Profile used for matching"
      ),
      hasProfile
        ? e(
            "div",
            { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" },
            profile!.gpa != null &&
              e(
                "div",
                { className: "flex items-center gap-3 rounded-xl border border-bg-border bg-slate-50/80 px-4 py-3" },
                e(BookOpen, { className: "h-5 w-5 text-primary-500" }),
                e("div", null, e("p", { className: "text-xs font-medium text-text-muted" }, "GPA"), e("p", { className: "font-semibold text-text-primary" }, String(profile!.gpa)))
              ),
            profile!.satScore != null &&
              e(
                "div",
                { className: "flex items-center gap-3 rounded-xl border border-bg-border bg-slate-50/80 px-4 py-3" },
                e(Gauge, { className: "h-5 w-5 text-primary-500" }),
                e("div", null, e("p", { className: "text-xs font-medium text-text-muted" }, "SAT"), e("p", { className: "font-semibold text-text-primary" }, String(profile!.satScore)))
              ),
            profile!.actScore != null &&
              e(
                "div",
                { className: "flex items-center gap-3 rounded-xl border border-bg-border bg-slate-50/80 px-4 py-3" },
                e(Gauge, { className: "h-5 w-5 text-primary-500" }),
                e("div", null, e("p", { className: "text-xs font-medium text-text-muted" }, "ACT"), e("p", { className: "font-semibold text-text-primary" }, String(profile!.actScore)))
              ),
            (profile!.preferredStates?.length ?? 0) > 0 &&
              e(
                "div",
                { className: "flex items-center gap-3 rounded-xl border border-bg-border bg-slate-50/80 px-4 py-3" },
                e(MapPin, { className: "h-5 w-5 text-primary-500" }),
                e(
                  "div",
                  null,
                  e("p", { className: "text-xs font-medium text-text-muted" }, "States"),
                  e("p", { className: "font-semibold text-text-primary" }, profile!.preferredStates!.slice(0, 3).join(", ") + (profile!.preferredStates!.length > 3 ? "…" : ""))
                )
              ),
            profile!.preferredSize &&
              e(
                "div",
                { className: "flex items-center gap-3 rounded-xl border border-bg-border bg-slate-50/80 px-4 py-3" },
                e(Target, { className: "h-5 w-5 text-primary-500" }),
                e("div", null, e("p", { className: "text-xs font-medium text-text-muted" }, "Size"), e("p", { className: "font-semibold text-text-primary capitalize" }, profile!.preferredSize))
              ),
            (profile!.preferredMajors?.length ?? 0) > 0 &&
              e(
                "div",
                { className: "flex items-center gap-3 rounded-xl border border-bg-border bg-slate-50/80 px-4 py-3" },
                e(BookOpen, { className: "h-5 w-5 text-primary-500" }),
                e(
                  "div",
                  null,
                  e("p", { className: "text-xs font-medium text-text-muted" }, "Majors"),
                  e("p", { className: "font-semibold text-text-primary" }, profile!.preferredMajors!.slice(0, 2).join(", ") + (profile!.preferredMajors!.length > 2 ? "…" : ""))
                )
              )
          )
        : e(
            "div",
            { className: "rounded-xl border-2 border-dashed border-bg-border bg-slate-50/50 p-6 text-center" },
            e("p", { className: "text-sm text-text-muted" }, "No profile data yet. Add your GPA and test scores in Settings for better matches."),
            e(
              Link,
              { href: "/app/settings", className: "mt-3 inline-block text-sm font-medium text-primary-500 hover:underline" },
              "Go to Settings →"
            )
          )
    ),
    e(
      "section",
      null,
      e(MatchingRun, { basePath: "/app/colleges" })
    )
  );
}
