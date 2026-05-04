import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/firebase/serverAuth";
import { isOnboardingCompleted } from "@/lib/firebase/onboardingCheck";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUserFromCookies();
  if (!user) {
    // Middleware handles unauthenticated redirects for /app/* routes.
    // Avoid forcing a global redirect here to prevent public-route loops.
    return children;
  }
  const completed = await isOnboardingCompleted(user.uid);
  if (!completed) {
    redirect("/onboarding/step-1");
  }
  return <AppShell>{children}</AppShell>;
}
