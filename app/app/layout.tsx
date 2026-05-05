import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/firebase/serverAuth";
import { isOnboardingCompleted } from "@/lib/firebase/onboardingCheck";
import { AppShell } from "@/components/layout/AppShell";
import { StylesheetLinks } from "@/components/StylesheetLinks";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUserFromCookies();
  if (!user) {
    // Middleware handles unauthenticated redirects for /app/* routes.
    // Keep layout tolerant here to avoid standalone redirect loops leaking into public routes.
    return children;
  }
  const completed = await isOnboardingCompleted(user.uid);
  if (!completed) {
    redirect("/onboarding/step-1");
  }
  return (
    <>
      <StylesheetLinks />
      <AppShell>{children}</AppShell>
    </>
  );
}
