import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import { adminDb } from "@/lib/firebase/admin";
import { monthKeyUTC } from "@/lib/billing/enforce";
import { PLAN_ENTITLEMENTS } from "@/lib/billing/entitlements";
import type { BillingPlan } from "@/lib/billing/plans";

export async function GET(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subSnap = await adminDb.collection("users").doc(user.uid).collection("billing").doc("subscription").get();
  const sub = subSnap.exists ? (subSnap.data() as any) : null;

  const status = (sub?.status ?? null) as string | null;
  const rawPlan = (sub?.plan ?? "free") as string;
  const paid = status === "active" || status === "trialing";
  const plan: BillingPlan = paid && (rawPlan === "starter" || rawPlan === "growth" || rawPlan === "elite") ? rawPlan : "free";

  const month = monthKeyUTC();
  const usageRef = adminDb.collection("users").doc(user.uid).collection("billing").doc("usage").collection("months").doc(month);
  const usageSnap = await usageRef.get();
  const usage = usageSnap.exists ? usageSnap.data() : {};

  const ent = PLAN_ENTITLEMENTS[plan];
  return NextResponse.json({
    plan,
    status,
    billingPeriod: sub?.billingPeriod ?? null,
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    month,
    limits: ent.monthlyLimits,
    used: {
      chat: Number((usage as any)?.chatUsed ?? 0),
      essayAnalyze: Number((usage as any)?.essayAnalyzeUsed ?? 0),
      matchingRun: Number((usage as any)?.matchingRunUsed ?? 0),
      roadmapGenerate: Number((usage as any)?.roadmapGenerateUsed ?? 0),
    },
  });
}

