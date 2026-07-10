import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import { adminDb } from "@/lib/firebase/admin";
import { monthKeyUTC } from "@/lib/billing/enforce";
import { PLAN_ENTITLEMENTS } from "@/lib/billing/entitlements";
import type { BillingPlan } from "@/lib/billing/plans";
import { isPaidSubscriptionStatus, normalizePaidPlan } from "@/lib/billing/paidStatus";

export async function GET(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subSnap = await adminDb.collection("users").doc(user.uid).collection("billing").doc("subscription").get();
  const sub = subSnap.exists ? (subSnap.data() as Record<string, unknown>) : null;

  const status = (sub?.status ?? null) as string | null;
  const rawPlan = (sub?.plan ?? "free") as string;
  const paidPlan = normalizePaidPlan(rawPlan);
  const paid = isPaidSubscriptionStatus(status);
  const plan: BillingPlan = paid && paidPlan ? paidPlan : "free";

  const month = monthKeyUTC();
  const usageRef = adminDb
    .collection("users")
    .doc(user.uid)
    .collection("billing")
    .doc("usage")
    .collection("months")
    .doc(month);
  const usageSnap = await usageRef.get();
  const usage = usageSnap.exists ? usageSnap.data() : {};

  const ent = PLAN_ENTITLEMENTS[plan];
  const hasBillingCustomer = Boolean(
    (typeof sub?.stripeCustomerId === "string" && sub.stripeCustomerId) ||
      (typeof sub?.stripeSubscriptionId === "string" && sub.stripeSubscriptionId)
  );

  return NextResponse.json({
    plan,
    status,
    billingPeriod: sub?.billingPeriod ?? null,
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: Boolean(sub?.cancelAtPeriodEnd),
    hasBillingCustomer,
    month,
    limits: ent.monthlyLimits,
    used: {
      chat: Number((usage as { chatUsed?: number })?.chatUsed ?? 0),
      essayAnalyze: Number((usage as { essayAnalyzeUsed?: number })?.essayAnalyzeUsed ?? 0),
      matchingRun: Number((usage as { matchingRunUsed?: number })?.matchingRunUsed ?? 0),
      roadmapGenerate: Number((usage as { roadmapGenerateUsed?: number })?.roadmapGenerateUsed ?? 0),
    },
  });
}
