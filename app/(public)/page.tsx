import dynamic from "next/dynamic";

/** Linux Docker + async RSC stream can omit `app/layout` shell and break hydration. Client-only subtree keeps document shell intact. */
const LandingPageClient = dynamic(() => import("@/components/marketing/LandingPageClient"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#f7f9fb]" aria-busy aria-label="Loading" />,
});

export default function LandingPage() {
  return <LandingPageClient />;
}
