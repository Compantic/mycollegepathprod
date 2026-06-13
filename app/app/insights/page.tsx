import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/firebase/serverAuth";
import { InsightsTimelineContent } from "@/components/insights/InsightsTimelineContent";

export default async function InsightsPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/signin?from=/app/insights");

  return <InsightsTimelineContent />;
}

