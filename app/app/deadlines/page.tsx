import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/firebase/serverAuth";
import { getDashboardUserData } from "@/lib/dashboard/getDashboardData";
import { buildStudentDeadlines } from "@/lib/deadlines/buildStudentDeadlines";
import { DeadlinesPageContent } from "@/components/deadlines/DeadlinesPageContent";

export default async function DeadlinesPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/signin?from=/app/deadlines");

  const data = await getDashboardUserData(user.uid, user.email);
  const payload = buildStudentDeadlines({
    onboarding: data?.onboardingAnswers ?? null,
    savedColleges: data?.savedColleges ?? [],
  });

  return <DeadlinesPageContent payload={payload} userId={user.uid} />;
}
