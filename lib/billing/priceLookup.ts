import { STRIPE_PRICE_IDS, type BillingPeriod, type BillingPlan, type StripeCatalogMode } from "@/lib/billing/plans";
import { getStripeMode } from "@/lib/stripe/server";

export type PaidPlan = Exclude<BillingPlan, "free">;

export function resolvePlanFromPriceId(
  priceId: string,
  mode: StripeCatalogMode = getStripeMode()
): { plan: PaidPlan; billingPeriod: BillingPeriod } | null {
  const map = STRIPE_PRICE_IDS[mode];
  for (const plan of ["starter", "growth", "elite"] as const) {
    if (map[plan].monthly === priceId) return { plan, billingPeriod: "monthly" };
    if (map[plan].yearly === priceId) return { plan, billingPeriod: "yearly" };
  }
  // Fallback: check the other catalog in case mode flipped after a key change.
  const other: StripeCatalogMode = mode === "live" ? "test" : "live";
  const otherMap = STRIPE_PRICE_IDS[other];
  for (const plan of ["starter", "growth", "elite"] as const) {
    if (otherMap[plan].monthly === priceId) return { plan, billingPeriod: "monthly" };
    if (otherMap[plan].yearly === priceId) return { plan, billingPeriod: "yearly" };
  }
  return null;
}
