import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import { getStripe, getStripeMode } from "@/lib/stripe/server";
import { stripeCheckoutBodySchema } from "@/lib/validation/api";
import { STRIPE_PRICE_IDS } from "@/lib/billing/plans";

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

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: user.uid,
    customer_email: user.email ?? undefined,
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/app/billing`,
    metadata: {
      uid: user.uid,
      plan,
      billingPeriod,
    },
    subscription_data: {
      metadata: {
        uid: user.uid,
        plan,
        billingPeriod,
      },
    },
    allow_promotion_codes: false,
  });

  return NextResponse.json({ url: session.url });
}

