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
        "glass-card rounded-card p-5 transition-shadow duration-200 hover:shadow-glow",
        className
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-button bg-secondary-100 text-primary-600",
          iconClassName
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className="mt-3 text-helper font-semibold uppercase tracking-wider text-text-muted">{title}</p>
      <div className="mt-1 text-xl font-bold text-text-primary">{value}</div>
      {helper && <p className="mt-1 text-helper text-text-muted">{helper}</p>}
    </div>
  );
}
