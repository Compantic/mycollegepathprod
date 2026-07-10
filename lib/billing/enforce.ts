import { adminDb } from "@/lib/firebase/admin";
import type { BillingPlan } from "@/lib/billing/plans";
import { PLAN_ENTITLEMENTS, type BillingFeature } from "@/lib/billing/entitlements";
import { isPaidSubscriptionStatus } from "@/lib/billing/paidStatus";

type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused"
  | string;

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

export type UsageSnapshot = {
  plan: BillingPlan;
  month: string;
  used: number;
  limit: number | null;
};

async function getPlanForUser(uid: string): Promise<{ plan: BillingPlan; status: SubscriptionStatus | null }> {
  const snap = await adminDb.collection("users").doc(uid).collection("billing").doc("subscription").get();
  if (!snap.exists) return { plan: "free", status: null };
  const data = snap.data() as { plan?: string | null; status?: SubscriptionStatus | null } | undefined;
  const status = data?.status ?? null;
  const rawPlan = (data?.plan ?? "free") as string;
  const plan: BillingPlan = rawPlan === "starter" || rawPlan === "growth" || rawPlan === "elite" ? rawPlan : "free";

  // past_due keeps access while Stripe retries the card so users can open the portal and fix payment.
  const paid = isPaidSubscriptionStatus(status);
  return { plan: paid ? plan : "free", status };
}

type UsageDoc = Partial<
  Record<"chatUsed" | "essayAnalyzeUsed" | "matchingRunUsed" | "roadmapGenerateUsed", number>
> & {
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

function usageRefFor(uid: string, month: string) {
  return adminDb
    .collection("users")
    .doc(uid)
    .collection("billing")
    .doc("usage")
    .collection("months")
    .doc(month);
}

/**
 * Reserve one unit of monthly usage before expensive AI / Scorecard work.
 * Call `releaseFeatureUsage` if the operation fails or returns an empty/unusable result.
 */
export async function reserveFeatureUsage(uid: string, feature: BillingFeature): Promise<UsageSnapshot> {
  const { plan } = await getPlanForUser(uid);
  const ent = PLAN_ENTITLEMENTS[plan];
  if (!ent.enabled[feature]) {
    throw new BillingError("Upgrade required to use this feature.", { code: "upgrade_required" });
  }

  const limit = (ent.monthlyLimits as Partial<Record<BillingFeature, number>>)[feature];
  const month = monthKeyUTC();
  if (limit == null) {
    return { plan, month, used: 0, limit: null };
  }

  const field = usageFieldForFeature(feature);
  if (!field) return { plan, month, used: 0, limit };

  const usageRef = usageRefFor(uid, month);
  const result = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(usageRef);
    const data = (snap.exists ? (snap.data() as UsageDoc) : {}) ?? {};
    const used = Number(data[field] ?? 0);
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

/**
 * Refund a previously reserved usage unit after a failed or empty operation.
 * No-op for unlimited plans. Never throws to callers (best-effort).
 */
export async function releaseFeatureUsage(uid: string, feature: BillingFeature): Promise<void> {
  try {
    const { plan } = await getPlanForUser(uid);
    const ent = PLAN_ENTITLEMENTS[plan];
    const limit = (ent.monthlyLimits as Partial<Record<BillingFeature, number>>)[feature];
    if (limit == null) return;

    const field = usageFieldForFeature(feature);
    if (!field) return;

    const month = monthKeyUTC();
    const usageRef = usageRefFor(uid, month);

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(usageRef);
      const data = (snap.exists ? (snap.data() as UsageDoc) : {}) ?? {};
      const used = Number(data[field] ?? 0);
      const next = Math.max(0, used - 1);
      tx.set(
        usageRef,
        {
          month,
          [field]: next,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    });
  } catch (err) {
    console.error("[billing.releaseFeatureUsage]", feature, err);
  }
}

/**
 * @deprecated Prefer `reserveFeatureUsage` + `releaseFeatureUsage` so failed AI work does not burn quota.
 * Kept as an alias of reserve for any remaining call sites.
 */
export async function enforceAndIncrementUsage(
  uid: string,
  feature: BillingFeature
): Promise<UsageSnapshot> {
  return reserveFeatureUsage(uid, feature);
}
