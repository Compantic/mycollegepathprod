"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional primary CTA (e.g. Button) */
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-bg-border bg-bg-card/50 py-12 px-6 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-100 text-primary-500 mb-4">
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="text-card-title text-text-primary">{title}</h3>
      {description && <p className="mt-2 text-body text-text-secondary max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
