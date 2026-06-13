import type { BillingPlan } from "@/lib/billing/plans";

const ORDER: Record<BillingPlan, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  elite: 3,
};

export function planRank(plan: BillingPlan): number {
  return ORDER[plan] ?? 0;
}
