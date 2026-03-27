import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/firebase/serverAuth";
import {
  getStudentProfileForServer,
  getLatestMatchRun,
  getFavoritesForServer,
} from "@/lib/firebase/serverFirestore";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [profile, latestMatchRun, favorites] = await Promise.all([
      getStudentProfileForServer(user.uid),
      getLatestMatchRun(user.uid),
      getFavoritesForServer(user.uid),
    ]);

    return NextResponse.json({
      profile,
      favorites,
      latestMatchRun,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load context" },
      { status: 500 }
    );
  }
}
