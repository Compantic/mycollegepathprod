import type { BillingPlan } from "@/lib/billing/plans";

export type BillingFeature = "colleges" | "chat" | "essayAnalyze" | "matchingRun" | "roadmapGenerate" | "aiScore";

export interface PlanEntitlements {
  /** Feature is accessible at all (even if limited). */
  enabled: Record<BillingFeature, boolean>;
  /** Monthly limits for metered features. Omit/undefined means unlimited. */
  monthlyLimits: Partial<Record<Exclude<BillingFeature, "colleges" | "aiScore">, number>>;
}

export const PLAN_ENTITLEMENTS: Record<BillingPlan, PlanEntitlements> = {
  free: {
    enabled: {
      colleges: true,
      chat: false,
      essayAnalyze: false,
      matchingRun: false,
      roadmapGenerate: false,
      aiScore: false,
    },
    monthlyLimits: {},
  },
  starter: {
    enabled: {
      colleges: true,
      chat: true,
      essayAnalyze: true,
      matchingRun: true,
      roadmapGenerate: true,
      aiScore: true,
    },
    monthlyLimits: {
      chat: 20,
      essayAnalyze: 2,
      matchingRun: 2,
      roadmapGenerate: 2,
    },
  },
  growth: {
    enabled: {
      colleges: true,
      chat: true,
      essayAnalyze: true,
      matchingRun: true,
      roadmapGenerate: true,
      aiScore: true,
    },
    monthlyLimits: {
      chat: 40,
      essayAnalyze: 4,
      matchingRun: 10,
      roadmapGenerate: 10,
    },
  },
  elite: {
    enabled: {
      colleges: true,
      chat: true,
      essayAnalyze: true,
      matchingRun: true,
      roadmapGenerate: true,
      aiScore: true,
    },
    monthlyLimits: {
      // unlimited
    },
  },
};

