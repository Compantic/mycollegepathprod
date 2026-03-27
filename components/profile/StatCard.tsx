"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: React.ReactNode;
  helper?: string;
  className?: string;
  iconClassName?: string;
}

export function StatCard({ icon: Icon, title, value, helper, className, iconClassName }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border-l-4 p-5 shadow-md backdrop-blur-sm transition-all duration-200 hover:shadow-lg",
        iconClassName?.includes("amber") ? "border-l-amber-400 bg-amber-50/70 border border-amber-200/40" : "",
        iconClassName?.includes("emerald") ? "border-l-emerald-400 bg-emerald-50/70 border border-emerald-200/40" : "",
        iconClassName?.includes("violet") ? "border-l-violet-400 bg-violet-50/70 border border-violet-200/40" : "",
        iconClassName?.includes("sky") ? "border-l-sky-400 bg-sky-50/70 border border-sky-200/40" : "",
        iconClassName?.includes("indigo") ? "border-l-indigo-400 bg-indigo-50/70 border border-indigo-200/40" : "",
        !iconClassName?.match(/amber|emerald|violet|sky|indigo/) ? "border-l-primary-400 border border-primary-200/40 bg-white/80" : "",
        className
      )}
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconClassName ?? "bg-primary-100 text-primary-600")}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</p>
      <div className="mt-1 text-xl font-bold text-text-primary">{value}</div>
      {helper && <p className="mt-1 text-xs text-text-muted">{helper}</p>}
    </div>
  );
}
