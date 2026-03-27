"use client";

import { type ReactNode } from "react";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard, type GlassCardVariant } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface ProfileSectionProps {
  id?: string;
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  /** If true, section is wrapped in a single GlassCard (e.g. Career & Goals). */
  singleCard?: boolean;
  /** Card color variant when singleCard is true. */
  cardVariant?: GlassCardVariant;
}

export function ProfileSection({ id, title, icon: Icon, children, className, singleCard, cardVariant }: ProfileSectionProps) {
  return (
    <SectionContainer id={id} as="section" className={cn("space-y-4", className)}>
      <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-text-primary">
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        )}
        {title}
      </h2>
      {singleCard ? (
        <GlassCard as="div" className="p-6" variant={cardVariant}>
          {children}
        </GlassCard>
      ) : (
        children
      )}
    </SectionContainer>
  );
}
