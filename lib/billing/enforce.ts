import { adminDb } from "@/lib/firebase/admin";
import type { BillingPlan } from "@/lib/billing/plans";
import { PLAN_ENTITLEMENTS, type BillingFeature } from "@/lib/billing/entitlements";

type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "incomplete_expired" | "unpaid" | "paused" | string;

export class BillingError extends Error {
  status: number;
  code: string;
  constructor(message: string, opts?: { status?: number; code?: string }) {
    super(message);
    this.name = "BillingError";
    this.status = opts?.status ?? 402;
    this.code = opts?.code ?? "billing_required";
  }
}

export function monthKeyUTC(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

async function getPlanForUser(uid: string): Promise<{ plan: BillingPlan; status: SubscriptionStatus | null }> {
  const snap = await adminDb.collection("users").doc(uid).collection("billing").doc("subscription").get();
  if (!snap.exists) return { plan: "free", status: null };
  const data = snap.data() as { plan?: string | null; status?: SubscriptionStatus | null } | undefined;
  const status = data?.status ?? null;
  const rawPlan = (data?.plan ?? "free") as string;
  const plan: BillingPlan = rawPlan === "starter" || rawPlan === "growth" || rawPlan === "elite" ? rawPlan : "free";

  // Only treat active/trialing as paid; everything else behaves like free.
  const paid = status === "active" || status === "trialing";
  return { plan: paid ? plan : "free", status };
}

type UsageDoc = Partial<Record<"chatUsed" | "essayAnalyzeUsed" | "matchingRunUsed" | "roadmapGenerateUsed", number>> & {
  month?: string;
  updatedAt?: string;
};

function usageFieldForFeature(feature: BillingFeature): keyof UsageDoc | null {
  switch (feature) {
    case "chat":
      return "chatUsed";
    case "essayAnalyze":
      return "essayAnalyzeUsed";
    case "matchingRun":
      return "matchingRunUsed";
    case "roadmapGenerate":
      return "roadmapGenerateUsed";
    default:
      return null;
  }
}

/**
 * Enforce plan + monthly usage limits and increment usage if allowed.
 *
 * - Reads plan from `users/{uid}/billing/subscription`
 * - Stores counters in `users/{uid}/billing/usage/{YYYY-MM}` (UTC month)
 */
export async function enforceAndIncrementUsage(uid: string, feature: BillingFeature): Promise<{ plan: BillingPlan; month: string; used: number; limit: number | null }> {
  const { plan } = await getPlanForUser(uid);
  const ent = PLAN_ENTITLEMENTS[plan];
  if (!ent.enabled[feature]) {
    throw new BillingError("Upgrade required to use this feature.", { code: "upgrade_required" });
  }

  const limit = (ent.monthlyLimits as any)[feature] as number | undefined;
  if (!limit) {
    return { plan, month: monthKeyUTC(), used: 0, limit: null };
  }

  const month = monthKeyUTC();
  const usageRef = adminDb.collection("users").doc(uid).collection("billing").doc("usage").collection("months").doc(month);
  // Using a subcollection keeps billing docs grouped but avoids hot-spotting a single doc.

  const field = usageFieldForFeature(feature);
  if (!field) return { plan, month, used: 0, limit };

  const result = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(usageRef);
    const data = (snap.exists ? (snap.data() as UsageDoc) : {}) ?? {};
    const used = Number((data as any)[field] ?? 0);
    if (used >= limit) {
      throw new BillingError("Monthly limit reached. Upgrade or wait for renewal.", { code: "limit_reached" });
    }
    const next = used + 1;
    tx.set(
      usageRef,
      {
        month,
        [field]: next,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { used: next };
  });

  return { plan, month, used: result.used, limit };
}

