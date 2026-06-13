import Stripe from "stripe";

export type StripeMode = "test" | "live";

export function getStripeMode(): StripeMode {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_test_") ? "test" : "live";
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing env var: STRIPE_SECRET_KEY");
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
}

export function getStripeWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET ?? "";
}

