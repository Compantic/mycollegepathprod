import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import { getStripe } from "@/lib/stripe/server";
import { getStoredSubscription, resolveStripeCustomerId } from "@/lib/billing/changePlan";

function getOrigin(req: NextRequest): string {
  const envOrigin = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").trim();
  if (envOrigin.startsWith("http://") || envOrigin.startsWith("https://")) return envOrigin;
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "https://mycollegepath.ai";
  return `${proto}://${host}`;
}

/**
 * Opens Stripe Customer Portal for cancel, payment method update, and invoices.
 * Requires Customer Portal to be enabled in the Stripe Dashboard.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const stripe = getStripe();
    const stored = await getStoredSubscription(user.uid);
    const customerId = await resolveStripeCustomerId(stripe, user.uid, stored);

    if (!customerId) {
      return NextResponse.json(
        {
          error:
            "No Stripe customer found yet. Subscribe to a plan first, then you can manage billing here.",
        },
        { status: 400 }
      );
    }

    const origin = getOrigin(req);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/app/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not open billing portal";
    console.error("[stripe.portal]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
