import type { StripeCatalogMode } from "@/lib/billing/plans";

export type BillingCatalogPlan = {
  monthlyCents: number;
  yearlyCents: number;
  currency: string;
};

export type BillingCatalogResponse = {
  mode: StripeCatalogMode;
  annualDiscount: number;
  plans: Record<"starter" | "growth" | "elite", BillingCatalogPlan>;
};
