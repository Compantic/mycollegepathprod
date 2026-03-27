import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/firebase/serverAuth";
import { getDashboardUserData } from "@/lib/dashboard/getDashboardData";
import { ProfilePageContent } from "@/components/profile/ProfilePageContent";

export default async function ProfilePage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login?from=/app/profile");

  const data = await getDashboardUserData(user.uid, user.email ?? null);

  return (
    <ProfilePageContent
      onboardingAnswers={data?.onboardingAnswers ?? null}
      profilePhotoUrl={data?.profile?.profilePhotoUrl}
    />
  );
}
