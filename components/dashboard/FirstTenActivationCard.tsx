"use client";

import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";

export function FirstTenActivationCard({
  steps,
  done,
  onPersist,
}: {
  steps: readonly { id: string; label: string; href: string }[];
  done: string[];
  onPersist: (nextDone: string[], dismissed?: boolean) => void;
}) {
  return (
    <section className="rounded-2xl border border-primary-200 bg-gradient-to-br from-white via-primary-50/40 to-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
            First 10 Minutes Activation
          </p>
          <h2 className="mt-1 text-lg font-bold text-text-primary">
            Welcome — let&apos;s knock out your first steps
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Finishing this mini checklist takes about 10 minutes on average and reduces first-session drop-off.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onPersist(done, true)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-text-muted hover:bg-slate-50"
        >
          <X className="h-3.5 w-3.5" />
          Dismiss
        </button>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-primary-500 transition-[width] duration-500"
          style={{ width: `${(done.length / steps.length) * 100}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-text-muted">
        {done.length}/{steps.length} complete
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((step) => {
          const checked = done.includes(step.id);
          return (
            <div
              key={step.id}
              className={`flex items-center justify-between rounded-xl border p-3 ${
                checked ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-white"
              }`}
            >
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked ? done.filter((x) => x !== step.id) : [...done, step.id];
                    onPersist(next);
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500/40"
                />
                <span className={checked ? "line-through text-text-muted" : ""}>{step.label}</span>
              </label>
              <Link href={step.href} className="text-xs font-semibold text-primary-600 hover:underline">
                Open
              </Link>
            </div>
          );
        })}
      </div>

      {done.length === steps.length && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Nice — activation checklist complete.
        </div>
      )}
    </section>
  );
}
