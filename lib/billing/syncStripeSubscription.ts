import type Stripe from "stripe";
import { adminDb } from "@/lib/firebase/admin";
import { resolvePlanFromPriceId } from "@/lib/billing/priceLookup";
import { isPaidSubscriptionStatus } from "@/lib/billing/paidStatus";

function isoFromUnixSeconds(sec: number | null | undefined): string | null {
  if (!sec) return null;
  return new Date(sec * 1000).toISOString();
}

export type SubscriptionWriteOverrides = {
  uid?: string;
  plan?: string | null;
  billingPeriod?: string | null;
};

function resolvePlanFields(
  sub: Stripe.Subscription,
  overrides: SubscriptionWriteOverrides
): { plan: string | null; billingPeriod: string | null } {
  const fromOverridePlan = overrides.plan ?? null;
  const fromOverridePeriod = overrides.billingPeriod ?? null;
  if (fromOverridePlan && fromOverridePeriod) {
    return { plan: fromOverridePlan, billingPeriod: fromOverridePeriod };
  }

  const fromMetaPlan = (sub.metadata?.plan ?? null) as string | null;
  const fromMetaPeriod = (sub.metadata?.billingPeriod ?? null) as string | null;
  if (fromMetaPlan && fromMetaPeriod) {
    return {
      plan: fromOverridePlan ?? fromMetaPlan,
      billingPeriod: fromOverridePeriod ?? fromMetaPeriod,
    };
  }

  const priceId = sub.items.data[0]?.price?.id;
  const fromPrice = priceId ? resolvePlanFromPriceId(priceId) : null;
  return {
    plan: fromOverridePlan ?? fromMetaPlan ?? fromPrice?.plan ?? null,
    billingPeriod: fromOverridePeriod ?? fromMetaPeriod ?? fromPrice?.billingPeriod ?? null,
  };
}

export async function writeSubscriptionFromStripe(
  sub: Stripe.Subscription,
  overrides: SubscriptionWriteOverrides = {}
) {
  const uid = (overrides.uid || sub.metadata?.uid || "").trim();
  if (!uid) {
    throw new Error("Missing user id on Stripe subscription");
  }

  const { plan, billingPeriod } = resolvePlanFields(sub, overrides);

  const payload = {
    uid,
    plan,
    billingPeriod,
    status: sub.status,
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
    stripeSubscriptionId: sub.id,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    currentPeriodStart: isoFromUnixSeconds(
      (sub as Stripe.Subscription & { current_period_start?: number }).current_period_start
    ),
    currentPeriodEnd: isoFromUnixSeconds(
      (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end
    ),
    updatedAt: new Date().toISOString(),
  };

  await adminDb.collection("users").doc(uid).collection("billing").doc("subscription").set(payload, { merge: true });
  return payload;
}

export async function syncCheckoutSessionToFirestore(
  stripe: Stripe,
  sessionId: string,
  expectedUid?: string
) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  const uid = (session.client_reference_id || session.metadata?.uid || "").trim();
  if (!uid) throw new Error("Checkout session missing user id");
  if (expectedUid && uid !== expectedUid) {
    throw new Error("Checkout session does not belong to this user");
  }

  if (session.mode !== "subscription" || !session.subscription) {
    throw new Error("Checkout session is not a subscription");
  }

  const sub =
    typeof session.subscription === "string"
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription;

  const payload = await writeSubscriptionFromStripe(sub, {
    uid,
    plan: session.metadata?.plan ?? null,
    billingPeriod: session.metadata?.billingPeriod ?? null,
  });

  const { cancelOtherSubscriptionsForUid } = await import("@/lib/billing/changePlan");
  await cancelOtherSubscriptionsForUid(stripe, uid, sub.id);

  return payload;
}

/** Pull latest paid Stripe subscription for this Firebase uid (recovery after missed webhooks). */
export async function refreshSubscriptionFromStripeByUid(stripe: Stripe, uid: string) {
  const result = await stripe.subscriptions.search({
    query: `metadata['uid']:'${uid}'`,
    limit: 10,
  });

  const subs = result.data.filter((s) => isPaidSubscriptionStatus(s.status));
  if (!subs.length) {
    throw new Error("No active subscription found in Stripe for your account");
  }

  subs.sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
  const primary = subs[0]!;
  const payload = await writeSubscriptionFromStripe(primary, { uid });

  const { cancelOtherSubscriptionsForUid } = await import("@/lib/billing/changePlan");
  await cancelOtherSubscriptionsForUid(stripe, uid, primary.id);

  return payload;
}
