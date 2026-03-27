import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/firebase/serverAuth";
import { getAiScoreForServer } from "@/lib/firebase/serverFirestore";
import { AIScorePageContent } from "@/components/ai-score/AIScorePageContent";

export default async function AiScorePage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login?from=/app/ai-score");

  const current = await getAiScoreForServer(user.uid);

  return (
    <AIScorePageContent
      initialScore={current}
      currentUserId={user.uid}
    />
  );
}
