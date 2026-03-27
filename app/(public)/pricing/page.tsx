import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard } from "@/components/ui/GlassCard";
import { LogoIcon } from "@/components/landing/LogoIcon";
import { cn } from "@/lib/utils";
import { getPublicMarketingMetrics, toPublicSignals } from "@/lib/marketing/publicMetrics";
import { Check, X, Star, AlertTriangle, Sparkles } from "lucide-react";

const traditionalLimits = [
  "Cost upwards of $10,000 to $15,000 per student.",
  "Limited availability — book months in advance.",
  "One-size-fits-all advice.",
];

const aiAdvantages = [
  "Best professional guidance for the price of a gym membership.",
  "Instant answers and personalized roadmaps.",
  "Data-driven matching to your dream schools.",
];

const plans = [
  {
    id: "free",
    name: "Free",
    label: "FREE PLAN",
    labelClass: "bg-secondary-100 text-text-primary",
    price: "$0",
    period: "/mo",
    features: ["Basic college search", "AI coach preview chat", "Sample My Path roadmap", "Up to 3 college matches"],
    cta: "Start for Free",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
  {
    id: "starter",
    name: "Starter",
    label: "STARTER PLAN",
    labelClass: "bg-status-successBg text-status-successText",
    price: "$29",
    period: "/mo",
    features: ["My Path Roadmap", "Monthly Progress Tracking", "Essay Proofreading (AI)", "Up to 5 college matches"],
    cta: "Choose Starter Plan",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
  {
    id: "premium",
    name: "Premium",
    label: "BEST VALUE",
    labelClass: "bg-[#EA580C] text-white",
    price: "$49",
    period: "/mo",
    features: ["Everything in Starter", "Human Strategy Reviews", "Advanced Matching", "Priority Support", "Unlimited college list"],
    cta: "GET ACCESS NOW",
    ctaVariant: "default" as const,
    highlighted: true,
  },
  {
    id: "elite",
    name: "Elite",
    label: "ELITE",
    labelClass: "bg-secondary-200 text-primary-600",
    price: "$149",
    period: "/mo",
    features: ["Everything in Premium", "1-on-1 Advisor Sessions", "Essay Deep Dives", "Interview Prep", "Dedicated Success Manager"],
    cta: "Choose Elite Plan",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
];

const comparisonRows = [
  { feature: "My Path Roadmap", free: true, starter: true, premium: true, elite: true },
  { feature: "Monthly Progress Tracking", free: false, starter: true, premium: true, elite: true },
  { feature: "Essay Proofreading (AI)", free: false, starter: true, premium: true, elite: true },
  { feature: "Human Strategy Reviews", free: false, starter: false, premium: true, elite: true },
  { feature: "Advanced Matching", free: "3 colleges", starter: "5 colleges", premium: "Unlimited", elite: "Unlimited" },
  { feature: "1-on-1 Advisor Sessions", free: false, starter: false, premium: false, elite: true },
];


function Tick({ inTable = false }: { inTable?: boolean }) {
  return <Check className={inTable ? "h-5 w-5 text-status-successText" : "h-5 w-5 text-status-successText shrink-0"} aria-hidden />;
}

export default async function PricingPage() {
  const metrics = await getPublicMarketingMetrics();
  const signals = toPublicSignals(metrics);
  const stats = [
    { value: signals[0]?.value ?? "0", label: "Active accounts" },
    { value: signals[1]?.value ?? "0", label: "Saved colleges" },
    { value: signals[2]?.value ?? "0", label: "Matching runs" },
    { value: "24/7", label: "AI Support" },
  ];

  const liveCards = [
    {
      title: "Current platform usage",
      quote: `${signals[0]?.value ?? "0"} users currently registered.`,
      note: "Live count from users collection",
    },
    {
      title: "Decision activity",
      quote: `${signals[2]?.value ?? "0"} matching runs completed.`,
      note: "Live count from matches subcollections",
    },
    {
      title: "Planning activity",
      quote: `${signals[3]?.value ?? "0"} roadmaps generated.`,
      note: "Live count from roadmaps subcollections",
    },
  ];

  return (
    <div className="min-h-screen bg-bg-main flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* ——— Hero (dark blue) ——— */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary-600 to-primary-500 pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
          <div className="absolute inset-0 bg-glow opacity-60 pointer-events-none" aria-hidden />
          <SectionContainer className="relative">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                College Counseling Just Got Smarter — and Fairer.
              </h1>
              <p className="mt-4 text-lg text-white/90">
                Get expert-level guidance without the expert-level price. AI-powered tools and optional human support.
              </p>
              <div className="mt-8">
                <Button asChild size="lg" className="bg-[#EA580C] hover:bg-[#C2410C] text-white border-0 shadow-soft rounded-button px-8">
                  <Link href="#plans">See Plans & Pricing</Link>
                </Button>
              </div>
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
                {stats.map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{value}</div>
                    <div className="mt-1 text-sm text-white/80">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </SectionContainer>
        </section>

        {/* ——— Why Choose ——— */}
        <SectionContainer id="why-choose" className="py-12 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary text-center">
            Why Choose MyCollegePath.ai?
          </h2>
          <div className="mt-2 h-1 w-16 bg-[#EA580C] rounded-full mx-auto" aria-hidden />
          <div className="mt-10 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <GlassCard variant="rose" className="p-6">
              <div className="flex items-center gap-2 text-status-dangerText font-semibold">
                <AlertTriangle className="h-5 w-5" aria-hidden />
                Traditional Counseling
              </div>
              <ul className="mt-4 space-y-3">
                {traditionalLimits.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-status-dangerText">
                    <X className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
            <GlassCard variant="emerald" className="p-6">
              <div className="flex items-center gap-2 text-status-successText font-semibold">
                <Sparkles className="h-5 w-5" aria-hidden />
                The AI Advantage
              </div>
              <ul className="mt-4 space-y-3">
                {aiAdvantages.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-status-successText">
                    <Check className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </SectionContainer>

        {/* ——— Pricing plans ——— */}
        <SectionContainer id="plans" className="py-12 sm:py-16 bg-bg-main">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted text-center">FLEXIBLE PRICING</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-text-primary text-center">Invest in Your Future</h2>
          <div className="mt-10 grid gap-6 max-w-6xl mx-auto md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <GlassCard
                key={plan.id}
                variant="default"
                className={cn(
                  "relative p-6 flex flex-col",
                  plan.highlighted && "ring-2 ring-primary-500 shadow-glow-lg bg-gradient-to-b from-primary-600/95 to-primary-500/95 border-primary-400 text-white"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden rounded-tr-card" aria-hidden>
                    <div className="absolute top-4 -right-10 w-32 bg-[#EA580C] text-white text-[10px] font-bold uppercase tracking-wider py-1 px-4 transform rotate-45 shadow">
                      Best Value
                    </div>
                  </div>
                )}
                <span className={cn("inline-flex self-start rounded-pill px-3 py-1 text-xs font-semibold", plan.labelClass)}>
                  {plan.label}
                </span>
                <div className="mt-4 flex items-baseline gap-0.5">
                  <span className={cn("text-3xl font-bold", plan.highlighted ? "text-white" : "text-text-primary")}>{plan.price}</span>
                  <span className={cn("text-sm", plan.highlighted ? "text-white/80" : "text-text-muted")}>{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      {plan.highlighted ? (
                        <Star className="h-5 w-5 text-[#EA580C] shrink-0 mt-0.5" aria-hidden />
                      ) : (
                        <Tick />
                      )}
                      <span className={plan.highlighted ? "text-white/95" : "text-text-secondary"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {plan.ctaVariant === "default" ? (
                    <Button asChild className="w-full rounded-button bg-[#EA580C] hover:bg-[#C2410C] text-white border-0">
                      <Link href="/onboarding/step-1">{plan.cta}</Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className={cn("w-full rounded-button", plan.highlighted && "border-white/50 text-white hover:bg-white/10")}>
                      <Link href="/onboarding/step-1">{plan.cta}</Link>
                    </Button>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </SectionContainer>

        {/* ——— Comparison table ——— */}
        <SectionContainer className="py-12 sm:py-16 border-t border-bg-border">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary text-center">Detailed Plan Comparison</h2>
          <div className="mt-10 overflow-x-auto rounded-card border border-bg-border bg-bg-card shadow-soft max-w-4xl mx-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-bg-border bg-secondary-100/50">
                  <th className="px-4 py-3 font-semibold text-text-primary">Feature</th>
                  <th className="px-4 py-3 font-semibold text-text-primary">Free</th>
                  <th className="px-4 py-3 font-semibold text-text-primary">Starter</th>
                  <th className="px-4 py-3 font-semibold text-text-primary">Premium</th>
                  <th className="px-4 py-3 font-semibold text-text-primary">Elite</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-bg-border last:border-0">
                    <td className="px-4 py-3 text-text-secondary">{row.feature}</td>
                    <td className="px-4 py-3">
                      {row.free === true ? <Tick inTable /> : row.free === false ? <X className="h-5 w-5 text-text-muted" aria-hidden /> : <span className="text-text-secondary">{row.free}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {row.starter === true ? <Tick inTable /> : row.starter === false ? <X className="h-5 w-5 text-text-muted" aria-hidden /> : <span className="text-text-secondary">{row.starter}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {row.premium === true ? <Tick inTable /> : row.premium === false ? <X className="h-5 w-5 text-text-muted" aria-hidden /> : <span className="text-text-secondary">{row.premium}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {row.elite === true ? <Tick inTable /> : row.elite === false ? <X className="h-5 w-5 text-text-muted" aria-hidden /> : <span className="text-text-secondary">{row.elite}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionContainer>

        {/* ——— Live platform signals ——— */}
        <SectionContainer className="py-12 sm:py-16 bg-bg-main">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary text-center">Live Platform Signals</h2>
          <div className="mt-10 grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {liveCards.map((t) => (
              <GlassCard key={t.title} className="p-6">
                <div className="flex gap-0.5 text-[#EA580C]" aria-hidden>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-text-primary font-medium">{t.quote}</p>
                <p className="mt-3 text-sm font-semibold text-text-primary">{t.title}</p>
                <p className="text-xs text-primary-600 font-medium uppercase tracking-wider">{t.note}</p>
              </GlassCard>
            ))}
          </div>
        </SectionContainer>

        {/* ——— Final CTA ——— */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 py-16 sm:py-20">
          <div className="absolute inset-0 bg-glow opacity-50 pointer-events-none" aria-hidden />
          <SectionContainer className="relative text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Stop Stressing, Start Strategizing.
            </h2>
            <p className="mt-4 text-white/90 max-w-xl mx-auto">
              Join thousands of students who found their path with AI-powered guidance. Start your free trial today.
            </p>
            <Button asChild size="lg" className="mt-8 bg-[#EA580C] hover:bg-[#C2410C] text-white border-0 rounded-button px-8 shadow-soft">
              <Link href="/onboarding/step-1">Start Your Free Trial Today</Link>
            </Button>
            <p className="mt-4 text-xs text-white/70">No credit card required. Cancel anytime.</p>
          </SectionContainer>
        </section>

        {/* ——— Footer ——— */}
        <footer className="border-t border-bg-border bg-bg-card py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 text-text-primary font-bold">
              <LogoIcon className="h-6 w-6 text-primary-600" />
              MyCollegePath.ai
            </Link>
            <nav className="flex items-center gap-6 text-sm text-text-secondary" aria-label="Footer">
              <Link href="#" className="hover:text-text-primary transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-text-primary transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-text-primary transition-colors">Contact Support</Link>
            </nav>
            <p className="text-xs text-text-muted">© {new Date().getFullYear()} MyCollegePath.ai</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
