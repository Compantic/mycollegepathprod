"use client";

import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional actions (e.g. buttons) on the right */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-body text-text-secondary">{subtitle}</p>
        )}
      </div>
      {actions && <div className="mt-3 sm:mt-0 flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
