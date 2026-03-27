import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/firebase/serverAuth";
import {
  getDashboardUserData,
  computeApplicationReadiness,
  computeHealthMetrics,
} from "@/lib/dashboard/getDashboardData";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { getAiScoreLeaderboardForServer } from "@/lib/firebase/serverFirestore";

function getAICoachTip(data: Awaited<ReturnType<typeof getDashboardUserData>>): string {
  if (!data) return "Complete your profile in Settings to get better college matches and personalized coach advice.";
  const answers = data.onboardingAnswers as Record<string, unknown> | undefined;
  const gradYear = answers?.expectedGraduationYear ?? answers?.graduationYear;
  if (typeof gradYear === "number" && gradYear <= 2026) {
    return "Your timeline is tight—focus on finalizing your college list and requesting recommendations this month.";
  }
  const states = data.profile?.preferredStates ?? (answers?.preferredStates as string[] | undefined);
  if (Array.isArray(states) && states.length > 0) {
    return "You've set state preferences. Use Matching to find schools in those regions that fit your profile.";
  }
  if ((data.savedColleges?.length ?? 0) < 3) {
    return "Add at least 3 colleges to your list to see deadlines and get tailored advice.";
  }
  return "Complete your profile (GPA, test scores, preferences) to get better college matches and personalized coach advice.";
}

export default async function DashboardPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login?from=/app/dashboard");

  const data = await getDashboardUserData(user.uid, user.email);
  const readiness = computeApplicationReadiness(data);
  const health = computeHealthMetrics(data);
  const aiTip = getAICoachTip(data);
  const aiLeaderboard = await getAiScoreLeaderboardForServer(12);

  return (
    <DashboardContent
      data={data}
      readiness={readiness}
      health={health}
      aiTip={aiTip}
      aiLeaderboard={aiLeaderboard.map((x) => ({ uid: x.uid, displayName: x.displayName, score: x.score }))}
    />
  );
}
