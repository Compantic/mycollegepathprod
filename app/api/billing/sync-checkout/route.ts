import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import { getStripe } from "@/lib/stripe/server";
import { syncCheckoutSessionToFirestore } from "@/lib/billing/syncStripeSubscription";

const bodySchema = z.object({
  sessionId: z.string().min(1),
});

/** After checkout, activate plan in Firestore if webhook was delayed or failed. */
export async function POST(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const payload = await syncCheckoutSessionToFirestore(stripe, parsed.data.sessionId, user.uid);
    return NextResponse.json({ ok: true, plan: payload.plan, status: payload.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    console.error("[billing.sync-checkout]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
