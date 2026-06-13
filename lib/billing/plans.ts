export type BillingPlan = "free" | "starter" | "growth" | "elite";
export type BillingPeriod = "monthly" | "yearly";

export type StripeCatalogMode = "test" | "live";

type PriceMap = Record<Exclude<BillingPlan, "free">, Record<BillingPeriod, string>>;

export const STRIPE_PRICE_IDS: Record<StripeCatalogMode, PriceMap> = {
  live: {
    starter: {
      monthly: "price_1TTmzA64ty3o4oNOIc5vIyXK",
      yearly: "price_1TTmzA64ty3o4oNOgILuC4v8",
    },
    growth: {
      monthly: "price_1TTmzs64ty3o4oNOkEzZoB5h",
      yearly: "price_1TTmzs64ty3o4oNOt5PoV9Mh",
    },
    elite: {
      monthly: "price_1TTn0L64ty3o4oNOxMqAcyEv",
      yearly: "price_1TTn0L64ty3o4oNOYBsfasVx",
    },
  },
  test: {
    starter: {
      monthly: "price_1TTnZJ64ty3o4oNOlhvq5nq1",
      yearly: "price_1TTnZJ64ty3o4oNOhntPsGGc",
    },
    growth: {
      monthly: "price_1TTnZi64ty3o4oNOuG7aqVtQ",
      yearly: "price_1TTnZi64ty3o4oNOuWS4Jjo2",
    },
    elite: {
      monthly: "price_1TTnZr64ty3o4oNOhp5okivX",
      yearly: "price_1TTna764ty3o4oNOoAL611To",
    },
  },
};

export function isPaidPlan(plan: BillingPlan): plan is Exclude<BillingPlan, "free"> {
  return plan === "starter" || plan === "growth" || plan === "elite";
}

