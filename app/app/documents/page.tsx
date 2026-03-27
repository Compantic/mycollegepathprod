import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/firebase/serverAuth";
import { getStudentProfileForServer } from "@/lib/firebase/serverFirestore";
import { CollegeMatchingView } from "@/components/matching/CollegeMatchingView";

export default async function DocumentsPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login?from=/app/documents");

  const profile = await getStudentProfileForServer(user.uid);

  return <CollegeMatchingView profile={profile} />;
}
