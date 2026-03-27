"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface TraitCardProps {
  icon?: LucideIcon;
  label: string;
  value: string;
  className?: string;
}

export function TraitCard({ icon: Icon, label, value, className }: TraitCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-violet-200/60 bg-violet-50/50 px-4 py-3 backdrop-blur-sm transition-shadow hover:shadow-sm",
        className
      )}
    >
      {Icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        <p className="font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}
