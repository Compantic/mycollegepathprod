import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/firebase/serverAuth";
import { getDashboardUserData } from "@/lib/dashboard/getDashboardData";
import { MyRoadPageContent } from "@/components/roadmap/MyRoadPageContent";

export default async function MyRoadPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login?from=/app/myroad");

  const data = await getDashboardUserData(user.uid, user.email ?? null);

  return (
    <MyRoadPageContent
      onboardingAnswers={data?.onboardingAnswers ?? null}
      profilePhotoUrl={data?.profile?.profilePhotoUrl}
    />
  );
}
