import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/firebase/serverAuth";
import { ApplyNowPageContent } from "@/components/apply-now/ApplyNowPageContent";

export default async function ApplyNowPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/signin?from=/app/apply-now");

  return <ApplyNowPageContent />;
}
