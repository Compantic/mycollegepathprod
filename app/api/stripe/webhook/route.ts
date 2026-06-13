import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe/server";
import { writeSubscriptionFromStripe, syncCheckoutSessionToFirestore } from "@/lib/billing/syncStripeSubscription";

export const runtime = "nodejs";

async function markSubscriptionCanceled(uid: string, stripeSubscriptionId: string) {
  const { adminDb } = await import("@/lib/firebase/admin");
  if (!uid) return;
  await adminDb
    .collection("users")
    .doc(uid)
    .collection("billing")
    .doc("subscription")
    .set(
      {
        uid,
        stripeSubscriptionId,
        status: "canceled",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}

export async function POST(req: NextRequest) {
  const STRIPE_WEBHOOK_SECRET = getStripeWebhookSecret();
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook secret not configured" }, { status: 500 });
  }

  const stripe = getStripe();

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe.webhook] invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.id) {
          await syncCheckoutSessionToFirestore(stripe, session.id);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await writeSubscriptionFromStripe(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const uid = (sub.metadata?.uid || "") as string;
        await markSubscriptionCanceled(uid, sub.id);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe.webhook] handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
