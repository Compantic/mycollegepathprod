import { NextResponse } from "next/server";
import { getStripe, getStripeMode } from "@/lib/stripe/server";
import { ANNUAL_DISCOUNT } from "@/lib/billing/pricing-features";
import type { BillingCatalogResponse } from "@/lib/billing/catalog-types";
import { STRIPE_PRICE_IDS } from "@/lib/billing/plans";

export async function GET() {
  try {
    const stripe = getStripe();
    const mode = getStripeMode();
    const ids = STRIPE_PRICE_IDS[mode];
    const keys = ["starter", "growth", "elite"] as const;

    const entries = await Promise.all(
      keys.map(async (key) => {
        const [monthly, yearly] = await Promise.all([
          stripe.prices.retrieve(ids[key].monthly),
          stripe.prices.retrieve(ids[key].yearly),
        ]);
        const mc = monthly.unit_amount;
        const yc = yearly.unit_amount;
        if (mc == null || yc == null) {
          throw new Error(`Stripe price missing unit_amount for ${key}`);
        }
        const currency = (monthly.currency || yearly.currency || "usd").toLowerCase();
        return [key, { monthlyCents: mc, yearlyCents: yc, currency }] as const;
      })
    );

    const plans = Object.fromEntries(entries) as BillingCatalogResponse["plans"];

    const body: BillingCatalogResponse = {
      mode,
      annualDiscount: ANNUAL_DISCOUNT,
      plans,
    };

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Catalog unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
