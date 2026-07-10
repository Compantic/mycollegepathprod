import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import { getStripe, getStripeMode } from "@/lib/stripe/server";
import { stripeCheckoutBodySchema } from "@/lib/validation/api";
import { STRIPE_PRICE_IDS } from "@/lib/billing/plans";
import { changeExistingSubscription, getStoredSubscription } from "@/lib/billing/changePlan";
import { PAID_PLAN_TRIAL_DAYS } from "@/lib/billing/trial";
import { isPaidSubscriptionStatus } from "@/lib/billing/paidStatus";

function getOrigin(req: NextRequest): string {
  const envOrigin = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").trim();
  if (envOrigin.startsWith("http://") || envOrigin.startsWith("https://")) return envOrigin;
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "https://mycollegepath.ai";
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripe = getStripe();

  const body = await req.json().catch(() => null);
  const parsed = stripeCheckoutBodySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join("; ") || "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { plan, billingPeriod } = parsed.data;
  const mode = getStripeMode();
  const price = STRIPE_PRICE_IDS[mode][plan][billingPeriod];
  const origin = getOrigin(req);

  try {
    // Existing paid subscription → update in place (no second Checkout / no double charge).
    const changed = await changeExistingSubscription({
      stripe,
      uid: user.uid,
      plan,
      billingPeriod,
    });
    if (changed) {
      return NextResponse.json({
        updated: true,
        plan: changed.payload.plan,
        billingPeriod: changed.payload.billingPeriod,
        status: changed.payload.status,
      });
    }

    const stored = await getStoredSubscription(user.uid);
    // First-time paid checkout only — never re-grant trial on resubscribe/upgrade paths.
    const eligibleForTrial =
      !stored?.stripeSubscriptionId && !isPaidSubscriptionStatus(stored?.status);

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: "subscription",
      client_reference_id: user.uid,
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/app/billing`,
      metadata: {
        uid: user.uid,
        plan,
        billingPeriod,
      },
      subscription_data: {
        ...(eligibleForTrial ? { trial_period_days: PAID_PLAN_TRIAL_DAYS } : {}),
        metadata: {
          uid: user.uid,
          plan,
          billingPeriod,
        },
      },
      allow_promotion_codes: false,
    };

    if (stored?.stripeCustomerId?.trim()) {
      sessionParams.customer = stored.stripeCustomerId.trim();
    } else if (user.email) {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url, updated: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[stripe.checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
