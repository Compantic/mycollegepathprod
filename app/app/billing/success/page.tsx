import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/firebase/serverAuth";
import { getStripe } from "@/lib/stripe/server";
import { syncCheckoutSessionToFirestore } from "@/lib/billing/syncStripeSubscription";

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ session_id?: string }>;
}) {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/signin?from=/app/billing");

  const sp = (await searchParams) ?? {};
  const sessionId = sp.session_id ?? null;

  let syncError: string | null = null;
  let syncedPlan: string | null = null;

  if (sessionId) {
    try {
      const stripe = getStripe();
      const payload = await syncCheckoutSessionToFirestore(stripe, sessionId, user.uid);
      syncedPlan = payload.plan;
    } catch (e) {
      syncError = e instanceof Error ? e.message : "Could not activate subscription yet";
      console.error("[billing.success] sync failed:", e);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-emerald-900">Payment successful</h1>
        {syncedPlan ? (
          <p className="mt-2 text-sm text-emerald-800">
            Your <span className="font-semibold capitalize">{syncedPlan}</span> plan is active. You can use paid
            features now.
          </p>
        ) : syncError ? (
          <p className="mt-2 text-sm text-amber-800">
            Payment received. Plan activation is still processing ({syncError}). Refresh Billing in a minute or
            contact support if it stays on Free.
          </p>
        ) : (
          <p className="mt-2 text-sm text-emerald-800">
            Your subscription is being activated. Open Billing to confirm your plan.
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/app/billing"
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
        >
          View billing
        </Link>
        <Link
          href="/app/dashboard"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
