"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, ExternalLink, AlertTriangle } from "lucide-react";
import type { DeadlineItem, DeadlinesPayload } from "@/lib/deadlines/types";
import { splitDeadlinesByTime } from "@/lib/deadlines/buildStudentDeadlines";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<DeadlineItem["kind"], string> = {
  financial_aid: "Financial aid",
  application: "Application",
  recommendation: "Recommendations",
  college_verify: "College checklist",
  decision: "Decision",
};

function formatDue(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(iso: string, todayIso: string): number {
  const a = new Date(iso + "T12:00:00");
  const b = new Date(todayIso + "T12:00:00");
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export function DeadlinesPageContent({
  payload,
  userId,
}: {
  payload: DeadlinesPayload;
  userId: string;
}) {
  const storageKey = `mcp_deadline_done_${userId}`;
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  function toggleDone(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const { upcoming, past, today } = useMemo(
    () => splitDeadlinesByTime(payload.items),
    [payload.items]
  );

  const visible = filter === "upcoming" ? upcoming : filter === "past" ? past : payload.items;
  const nextThree = upcoming.filter((i) => !done[i.id]).slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <header className="overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#0f1b2d] via-[#162236] to-primary-900 p-6 text-white shadow-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/90">Deadlines</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Your admissions calendar</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
          {payload.cycleLabel}
          {payload.graduationYear ? ` · Class of ${payload.graduationYear}` : ""}. Dates below are typical US
          cycle milestones plus per-college verify tasks for your saved list. Always confirm on official college
          sites.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
            {payload.savedCollegeCount} saved college{payload.savedCollegeCount === 1 ? "" : "s"}
          </span>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
            {upcoming.length} upcoming
          </span>
        </div>
      </header>

      {nextThree.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-950">
            <CalendarClock className="h-4 w-4" aria-hidden />
            Next up
          </h2>
          <ul className="mt-3 space-y-2">
            {nextThree.map((item) => {
              const days = daysUntil(item.dueDate, today);
              return (
                <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-amber-950">
                  <span className="font-semibold">{item.title}</span>
                  <span className="text-amber-800/90">
                    {formatDue(item.dueDate)}
                    {days === 0 ? " · today" : days > 0 ? ` · in ${days} day${days === 1 ? "" : "s"}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["upcoming", `Upcoming (${upcoming.length})`],
            ["past", `Past (${past.length})`],
            ["all", `All (${payload.items.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              filter === key
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {payload.savedCollegeCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-700">
            Add colleges to your list to generate per-school verify deadlines.
          </p>
          <Link href="/app/colleges" className="mt-3 inline-block text-sm font-semibold text-primary-700 hover:underline">
            Go to College List →
          </Link>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          No deadlines in this view.
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => {
            const isDone = Boolean(done[item.id]);
            const days = daysUntil(item.dueDate, today);
            const urgent = !isDone && days >= 0 && days <= 14;
            return (
              <li
                key={item.id}
                className={cn(
                  "rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.03]",
                  isDone ? "border-slate-200 opacity-70" : urgent ? "border-amber-300" : "border-slate-200"
                )}
              >
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDone(item.id)}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-600"
                    aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                  >
                    <CheckCircle2
                      className={cn("h-6 w-6", isDone ? "text-emerald-600" : "text-slate-300")}
                      fill={isDone ? "currentColor" : "none"}
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={cn("font-semibold text-slate-900", isDone && "line-through")}>{item.title}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                        {KIND_LABEL[item.kind]}
                      </span>
                      {item.verifyRequired ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                          <AlertTriangle className="h-3 w-3" aria-hidden />
                          Verify
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">Due {formatDue(item.dueDate)}</span>
                      {item.href ? (
                        item.href.startsWith("http") ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-primary-700 hover:underline"
                          >
                            Open link <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
                        ) : (
                          <Link href={item.href} className="font-medium text-primary-700 hover:underline">
                            View college
                          </Link>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-xs text-slate-500">
        Completion checks are saved on this device. Official deadlines can change — always verify with each college.
      </p>
    </div>
  );
}
