import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/landing/LogoIcon";
import { Medal, Shield, Heart, Check, Star, ArrowRight } from "lucide-react";

const discountCards = [
  {
    icon: Medal,
    title: "Active Duty & Veterans",
    borderClass: "border-primary-400",
    iconBg: "bg-primary-100 text-primary-600",
    items: ["Active Duty Members", "Military Veterans", "National Guard & Reserves", "Military Spouses"],
  },
  {
    icon: Shield,
    title: "Law Enforcement & First Responders",
    borderClass: "border-status-dangerText/40",
    iconBg: "bg-status-dangerBg text-status-dangerText",
    items: ["Police Officers", "Firefighters", "EMTs & Paramedics", "Federal Agents"],
  },
  {
    icon: Heart,
    title: "Foster Care & Orphaned Students",
    borderClass: "border-amber-400",
    iconBg: "bg-amber-100 text-amber-700",
    items: ["Current Foster Youth", "Adopted Students", "Orphaned Students", "Transitioning Youth"],
  },
];

const trustItems = [
  "No credit card required",
  "Auto-applied",
  "Privacy protected",
];

export default function HonoringPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        <section className="section-padding py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <div
                className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600 mb-6"
                aria-hidden
              >
                <Medal className="h-8 w-8" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary">
                Honoring Those Who Serve
              </h1>
              <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
                Special Discount for Military, Law Enforcement & Foster Care Families. We are committed to
                supporting those who build and protect our communities.
              </p>
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-6 sm:gap-8">
              {discountCards.map(({ icon: Icon, title, borderClass, iconBg, items }) => (
                <div
                  key={title}
                  className={`rounded-card bg-bg-card border-2 ${borderClass} shadow-soft p-6 flex flex-col hover:shadow-glow transition-shadow`}
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-button ${iconBg}`}>
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h2 className="mt-4 font-bold text-lg text-text-primary">{title}</h2>
                  <ul className="mt-4 space-y-2 flex-1">
                    {items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                        <Check className="h-5 w-5 shrink-0 text-status-successText" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="mt-6 w-full rounded-button bg-primary-600 hover:bg-primary-500 text-white"
                  >
                    <Link href="/onboarding/step-1" className="inline-flex items-center justify-center gap-2">
                      Claim Your 25% Discount
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-8 sm:gap-12">
              {trustItems.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Check className="h-5 w-5 shrink-0 text-status-successText" aria-hidden />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-16 rounded-card bg-secondary-100/60 border border-bg-border shadow-soft p-8 sm:p-10 text-center max-w-3xl mx-auto">
              <div className="flex justify-center gap-0.5 text-amber-500 mb-4" aria-hidden>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-6 w-6 fill-current" />
                ))}
              </div>
              <blockquote className="text-lg sm:text-xl font-medium text-text-primary italic">
                &ldquo;As a military family, we often feel the strain of constant transitions. MyCollegePath.ai
                made my daughter&apos;s college application process seamless and the discount was a true
                blessing. Their empathy for service families shows in everything they do.&rdquo;
              </blockquote>
              <div className="mt-6 flex flex-col items-center gap-1">
                <div
                  className="h-12 w-12 rounded-full bg-bg-border flex items-center justify-center"
                  aria-hidden
                >
                  <span className="text-text-muted text-lg font-semibold">S</span>
                </div>
                <p className="font-bold text-text-primary">Sarah Jenkins</p>
                <p className="text-sm text-text-secondary">Military Parent & Veteran Spouse</p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Button asChild size="lg" className="rounded-button">
                <Link href="/onboarding/step-1" className="inline-flex items-center gap-2">
                  Claim Your 25% Discount
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-bg-border bg-bg-card py-6 section-padding">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-5 w-5 text-text-primary shrink-0" />
            <span className="text-sm font-semibold text-text-primary">MyCollegePath</span>
          </div>
          <p className="text-xs text-text-muted text-center sm:text-left order-last sm:order-none">
            © 2024 MyCollegePath.ai. All rights reserved. Built for future leaders.
          </p>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <Link href="/" className="hover:text-text-secondary transition-colors">
              Home
            </Link>
            <Link href="/pricing" className="hover:text-text-secondary transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
