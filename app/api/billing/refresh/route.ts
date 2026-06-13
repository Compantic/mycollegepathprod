import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import { getStripe } from "@/lib/stripe/server";
import { refreshSubscriptionFromStripeByUid } from "@/lib/billing/syncStripeSubscription";

/** Re-sync plan from Stripe when payment succeeded but Firestore is still on free. */
export async function POST(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const stripe = getStripe();
    const payload = await refreshSubscriptionFromStripeByUid(stripe, user.uid);
    return NextResponse.json({ ok: true, plan: payload.plan, status: payload.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refresh failed";
    console.error("[billing.refresh]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
