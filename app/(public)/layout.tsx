/** Prefer static HTML shell + CSS links on `/`, `/login`, onboarding, etc. (avoids RSC stream without <!DOCTYPE>). */
export const dynamic = "force-static";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
