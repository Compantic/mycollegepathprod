import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/firebase/serverAuth";
import { getStudentProfileForServer, getOnboardingAnswersForServer } from "@/lib/firebase/serverFirestore";
import { CollegeMatchingView } from "@/components/matching/CollegeMatchingView";

export default async function DocumentsPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/signin?from=/app/documents");

  const [profile, onboarding] = await Promise.all([
    getStudentProfileForServer(user.uid),
    getOnboardingAnswersForServer(user.uid)
  ]);

  // Merge onboarding data into profile to fix the missing data issue
  const mergedProfile = {
    ...profile,
    preferredStates: profile?.preferredStates?.length 
      ? profile.preferredStates 
      : (onboarding?.locationPreferenceStates?.length ? onboarding.locationPreferenceStates : (onboarding?.preferredStates || [])),
    preferredSize: profile?.preferredSize 
      || onboarding?.preferredSize 
      || (onboarding?.campusUrbanSuburbanRural?.length ? onboarding.campusUrbanSuburbanRural[0] : undefined),
    preferredMajors: profile?.preferredMajors?.length 
      ? profile.preferredMajors 
      : (onboarding?.areasOfInterest || []),
    gpa: profile?.gpa || onboarding?.gpa,
    satScore: profile?.satScore || onboarding?.satTotal || onboarding?.satScore,
    actScore: profile?.actScore || onboarding?.actComposite || onboarding?.actScore,
  };

  return <CollegeMatchingView profile={mergedProfile} />;
}
