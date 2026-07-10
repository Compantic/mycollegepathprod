import type { BillingPlan } from "@/lib/billing/plans";

/** Statuses that keep paid entitlements (Stripe may still be retrying payment on past_due). */
export const PAID_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
]);

export function isPaidSubscriptionStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return PAID_SUBSCRIPTION_STATUSES.has(status);
}

export function normalizePaidPlan(raw: string | null | undefined): Exclude<BillingPlan, "free"> | null {
  if (raw === "starter" || raw === "growth" || raw === "elite") return raw;
  return null;
}
