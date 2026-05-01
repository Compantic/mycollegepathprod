import { NextResponse } from "next/server";
import { getPublicMarketingMetrics, toPublicSignals } from "@/lib/marketing/publicMetrics";

export const revalidate = 60;

export async function GET() {
  const metrics = await getPublicMarketingMetrics();
  return NextResponse.json({ signals: toPublicSignals(metrics) });
}
