import type Stripe from "stripe";
import { adminDb } from "@/lib/firebase/admin";
import { STRIPE_PRICE_IDS, type BillingPeriod } from "@/lib/billing/plans";
import { getStripeMode } from "@/lib/stripe/server";
import { isPaidSubscriptionStatus } from "@/lib/billing/paidStatus";
import type { PaidPlan } from "@/lib/billing/priceLookup";
import { writeSubscriptionFromStripe } from "@/lib/billing/syncStripeSubscription";

export type StoredSubscription = {
  plan?: string | null;
  status?: string | null;
  billingPeriod?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
};

export async function getStoredSubscription(uid: string): Promise<StoredSubscription | null> {
  const snap = await adminDb.collection("users").doc(uid).collection("billing").doc("subscription").get();
  if (!snap.exists) return null;
  return (snap.data() as StoredSubscription) ?? null;
}

/** Cancel other active/trialing/past_due subscriptions for this uid (prevents double billing). */
export async function cancelOtherSubscriptionsForUid(
  stripe: Stripe,
  uid: string,
  keepSubscriptionId: string
): Promise<number> {
  let canceled = 0;
  try {
    const result = await stripe.subscriptions.search({
      query: `metadata['uid']:'${uid}'`,
      limit: 20,
    });
    for (const sub of result.data) {
      if (sub.id === keepSubscriptionId) continue;
      if (!isPaidSubscriptionStatus(sub.status) && sub.status !== "incomplete") continue;
      try {
        await stripe.subscriptions.cancel(sub.id);
        canceled += 1;
      } catch (err) {
        console.error("[billing] failed to cancel duplicate subscription", sub.id, err);
      }
    }
  } catch (err) {
    console.error("[billing] duplicate subscription search failed", err);
  }
  return canceled;
}

/**
 * Update an existing Stripe subscription to a new price in place (no second Checkout).
 * Returns null when the user should go through Checkout instead.
 */
export async function changeExistingSubscription(args: {
  stripe: Stripe;
  uid: string;
  plan: PaidPlan;
  billingPeriod: BillingPeriod;
}): Promise<{ payload: Awaited<ReturnType<typeof writeSubscriptionFromStripe>> } | null> {
  const { stripe, uid, plan, billingPeriod } = args;
  const stored = await getStoredSubscription(uid);
  const subId = stored?.stripeSubscriptionId?.trim();
  if (!subId || !isPaidSubscriptionStatus(stored?.status)) {
    return null;
  }

  const existing = await stripe.subscriptions.retrieve(subId);
  if (!isPaidSubscriptionStatus(existing.status)) {
    return null;
  }

  const item = existing.items.data[0];
  if (!item?.id) {
    throw new Error("Subscription has no billable item to update");
  }

  const mode = getStripeMode();
  const priceId = STRIPE_PRICE_IDS[mode][plan][billingPeriod];
  if (item.price?.id === priceId) {
    const payload = await writeSubscriptionFromStripe(existing, { uid, plan, billingPeriod });
    return { payload };
  }

  const updated = await stripe.subscriptions.update(subId, {
    items: [{ id: item.id, price: priceId }],
    metadata: {
      ...(existing.metadata ?? {}),
      uid,
      plan,
      billingPeriod,
    },
    proration_behavior: "create_prorations",
    cancel_at_period_end: false,
  });

  await cancelOtherSubscriptionsForUid(stripe, uid, updated.id);
  const payload = await writeSubscriptionFromStripe(updated, { uid, plan, billingPeriod });
  return { payload };
}

export async function resolveStripeCustomerId(
  stripe: Stripe,
  uid: string,
  stored: StoredSubscription | null
): Promise<string | null> {
  if (stored?.stripeCustomerId?.trim()) return stored.stripeCustomerId.trim();

  if (stored?.stripeSubscriptionId?.trim()) {
    try {
      const sub = await stripe.subscriptions.retrieve(stored.stripeSubscriptionId.trim());
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
      if (customerId) {
        await adminDb
          .collection("users")
          .doc(uid)
          .collection("billing")
          .doc("subscription")
          .set({ stripeCustomerId: customerId, updatedAt: new Date().toISOString() }, { merge: true });
        return customerId;
      }
    } catch {
      /* fall through */
    }
  }

  return null;
}
