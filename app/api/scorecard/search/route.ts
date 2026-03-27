import { NextRequest, NextResponse } from "next/server";
import { searchSchools } from "@/lib/scorecard/client";
import { getApiErrorStatus } from "@/lib/errors/api";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query") ?? req.nextUrl.searchParams.get("schoolname") ?? undefined;
  const state = req.nextUrl.searchParams.get("state") ?? undefined;
  const per_page = req.nextUrl.searchParams.get("per_page");
  const page = req.nextUrl.searchParams.get("page");
  try {
    const res = await searchSchools({
      schoolname: query,
      "school.state": state || undefined,
      per_page: per_page ? parseInt(per_page, 10) : 20,
      page: page ? parseInt(page, 10) : undefined,
    });
    return NextResponse.json(res);
  } catch (err) {
    const status = getApiErrorStatus(err);
    if (status === 429) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Too many requests. Try again in a few minutes." },
        { status: 429 }
      );
    }
    if (status === 503) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "College search temporarily unavailable." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    );
  }
}
