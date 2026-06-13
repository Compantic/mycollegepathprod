import { LandingMarketingNav } from "@/components/marketing/LandingMarketingNav";
import { LandingPricingSection } from "@/components/marketing/LandingPricingSection";
import Link from "next/link";

export const metadata = {
  title: "Pricing | MyCollegePath",
  description: "Plans and pricing for MyCollegePath college admissions guidance.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      <LandingMarketingNav active="pricing" />
      <main className="overflow-x-hidden pt-[3.75rem] sm:pt-16 lg:pt-[4.5rem]">
        <LandingPricingSection className="pt-12" />
        <div className="mx-auto max-w-7xl px-4 pb-16 text-center sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-sm font-semibold text-primary-700 hover:text-primary-800"
          >
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
