import Link from "next/link";
import { getPublicMarketingMetrics, toPublicSignals } from "@/lib/marketing/publicMetrics";
import {
  ArrowRight,
  Shield,
  Sparkles,
  Building2,
  CheckCircle2,
  Brain,
  Target,
  CalendarClock,
  Quote,
  Trophy,
  BookOpen,
  Star,
  HeartHandshake,
  ChevronDown,
} from "lucide-react";

const trustCards = [
  {
    title: "Zero Data Selling",
    text: "Your personal data and essays are never sold or used for ad targeting.",
    icon: Shield,
    className: "bg-emerald-50 border-emerald-200 text-emerald-900",
  },
  {
    title: "FERPA & GDPR Aligned",
    text: "Built with student privacy and institutional-grade security principles.",
    icon: HeartHandshake,
    className: "bg-blue-50 border-blue-200 text-blue-900",
  },
  {
    title: "Verified Accuracy",
    text: "Scoring logic combines profile data, roadmap actions, and fit signals.",
    icon: Trophy,
    className: "bg-violet-50 border-violet-200 text-violet-900",
  },
  {
    title: "No Spam Calls",
    text: "You control communication preferences. No surprise outreach campaigns.",
    icon: Building2,
    className: "bg-emerald-50 border-emerald-200 text-emerald-900",
  },
  {
    title: "Free Roadmap",
    text: "Generate a phase-based plan with trackable tasks and milestones.",
    icon: CalendarClock,
    className: "bg-amber-50 border-amber-200 text-amber-900",
  },
  {
    title: "Essay Coaching",
    text: "Get structured feedback and iteration guidance without ghostwriting.",
    icon: BookOpen,
    className: "bg-rose-50 border-rose-200 text-rose-900",
  },
];

const features = [
  {
    title: "Deep Profile Analysis",
    description: "Upload your profile and preferences. AI builds your strategy baseline instantly.",
    icon: Brain,
  },
  {
    title: "Smart Matching",
    description: "Get Reach / Match / Safety balance with factor breakdown for each university.",
    icon: Target,
  },
  {
    title: "Roadmap + Deadlines",
    description: "Turn strategy into action with a timeline, checklist, and completion tracking.",
    icon: CalendarClock,
  },
];

export default async function LandingPage() {
  const metrics = await getPublicMarketingMetrics();
  const signals = toPublicSignals(metrics);
  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/20 bg-slate-50/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            MyCollegePath<span className="text-primary-600">.ai</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-primary-600">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-primary-600">How It Works</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-primary-600">Pricing</a>
            <span className="text-sm font-medium text-slate-600">For Parents</span>
            <a href="#trust" className="text-sm font-medium text-slate-600 hover:text-primary-600">Trust &amp; Privacy</a>
          </div>
          <Link
            href="/onboarding/step-1"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Start Free Trial
          </Link>
        </div>
      </nav>

      <main className="overflow-x-hidden pt-16">
        <header className="bg-gradient-to-b from-[#0f1b2d] to-[#162236] px-4 pb-20 pt-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Live platform activity
              </div>
              <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
                Your College Counselor. Available 24/7.
                <span className="block italic text-amber-300">Completely Private.</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-slate-300">
                Stop paying expensive counseling fees. Get personalized strategy, matching, roadmap,
                and AI coaching in one platform.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/onboarding/step-1"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-7 py-3.5 text-base font-bold text-white hover:opacity-90"
                >
                  Start Your Free Path
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-xl border border-white/30 px-7 py-3.5 text-base font-semibold text-white hover:bg-white/10"
                >
                  See Pricing
                </Link>
              </div>
              <p className="text-sm text-slate-400">
                {signals[0]?.value ?? "0"} active users, {signals[2]?.value ?? "0"} matching runs completed
              </p>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-white/10 bg-[#0b1320] p-4 shadow-2xl">
                <img
                  alt="Dashboard preview"
                  className="w-full rounded-xl"
                  src="/landing-hero-campus.jpg"
                />
              </div>
              <div className="absolute -bottom-5 -left-4 hidden rounded-xl border border-white/20 bg-white/85 p-3 text-xs text-slate-700 shadow-lg backdrop-blur md:block">
                <span className="font-semibold text-emerald-700">Matching Intelligence:</span> Reach / Match / Safety balanced
              </div>
              <div className="absolute -top-5 -right-4 hidden w-56 rounded-xl border border-white/20 bg-white/85 p-3 text-xs text-slate-700 shadow-lg backdrop-blur md:block">
                <p className="font-semibold text-slate-800">PathPal AI Active</p>
                <p className="mt-1 text-[11px]">Stanford CS is currently a high-match. Want a 30-day SAT plan?</p>
              </div>
            </div>
          </div>
        </header>

        <section id="trust" className="bg-white px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trustCards.map((card) => (
              <div key={card.title} className={`rounded-2xl border p-5 ${card.className}`}>
                <div className="mb-3 inline-flex rounded-lg bg-white/60 p-2">
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold">{card.title}</h3>
                <p className="mt-1.5 text-sm opacity-80">{card.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-100/80 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">As Featured In</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-xl font-semibold text-slate-500">
              <span>The New York Times</span>
              <span>TechCrunch</span>
              <span>Forbes</span>
              <span>Wired</span>
            </div>
            <div className="mx-auto mt-14 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {signals.slice(0, 3).map((s) => (
                <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
                  <Quote className="h-5 w-5 text-amber-500" />
                  <p className="mt-3 text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{s.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-white px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600">The Methodology</p>
              <h2 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">Three Steps to a Strong Application</h2>
            </div>
            <div id="features" className="grid gap-8 md:grid-cols-3">
              {features.map((feature, idx) => (
                <article key={feature.title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
                  <div className="relative mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-primary-700">
                    <feature.icon className="h-6 w-6" />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#0f1b2d] px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Honoring Those Who Serve</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
              Special Discounts for Service Members, First Responders, Veterans, and Foster Youth
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg text-slate-300">
              We provide exclusive pricing so high-quality college guidance stays accessible.
            </p>
            <Link
              href="/pricing"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-7 py-3.5 font-bold text-slate-900 hover:opacity-90"
            >
              Claim Service Discount
              <Star className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="bg-white px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 md:flex-row">
            <div className="flex-1">
              <div className="mb-8 inline-flex rounded-xl bg-slate-100 p-1">
                <button className="rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-primary-700 shadow-sm">
                  I&apos;m a Student
                </button>
                <button className="rounded-lg px-6 py-2.5 text-sm font-bold text-slate-500">
                  I&apos;m a Parent
                </button>
              </div>
              <h2 className="text-4xl font-semibold text-slate-900 sm:text-5xl">Take the Stress Out of Senior Year</h2>
              <ul className="mt-8 space-y-5 text-slate-600">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <p><strong className="text-slate-900">Stay Organized:</strong> All supplement deadlines synced to one dashboard.</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <p><strong className="text-slate-900">Beat Writer&apos;s Block:</strong> AI brainstorming prompts for every Common App prompt.</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <p><strong className="text-slate-900">Data-Backed Odds:</strong> Know your real chances before paying application fees.</p>
                </li>
              </ul>
              <Link
                href="/onboarding/step-1"
                className="mt-10 inline-flex rounded-xl bg-primary-600 px-8 py-3.5 font-bold text-white hover:opacity-90"
              >
                Start Building My Path
              </Link>
            </div>
            <div className="flex-1">
              <img
                alt="Students on campus"
                className="w-full rounded-3xl shadow-2xl"
                src="/landing-students-campus.jpg"
              />
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-slate-100/80 px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <h2 className="text-4xl font-semibold text-slate-900">Investment in Your Future</h2>
              <p className="mt-3 text-slate-600">Traditional counseling can exceed $6,500. Choose what fits you.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-4">
              {[
                { name: "Elite", price: "$149", cta: "Go Elite", featured: false },
                { name: "Pathfinder", price: "$49", cta: "Get Started", featured: true },
                { name: "Starter", price: "$19", cta: "Select Starter", featured: false },
                { name: "Explorer", price: "$0", cta: "Try Free", featured: false, dark: true },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={[
                    "rounded-2xl p-6",
                    plan.dark ? "bg-slate-900 text-white" : "bg-white border border-slate-200",
                    plan.featured ? "scale-[1.02] border-2 border-amber-300 shadow-xl" : "shadow-sm",
                  ].join(" ")}
                >
                  {plan.featured && (
                    <div className="mb-3 inline-flex rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="mt-2 text-3xl font-bold">{plan.price}<span className="ml-1 text-sm font-medium opacity-70">/cycle</span></p>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> Smart matching</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> Roadmap and checklist</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> AI consultant access</li>
                  </ul>
                  <Link
                    href="/onboarding/step-1"
                    className={[
                      "mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold",
                      plan.dark ? "bg-white/15 text-white hover:bg-white/25" : plan.featured ? "bg-primary-600 text-white hover:opacity-90" : "border border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-semibold text-slate-900">Frequently Asked Questions</h2>
            <div className="mt-8 space-y-3">
              {[
                {
                  q: "How is this different from generic AI tools?",
                  a: "MyCollegePath is built specifically for admissions strategy, matching, and roadmap execution with privacy-focused data handling.",
                },
                {
                  q: "Can AI write my essays for me?",
                  a: "No. It coaches structure, clarity, and narrative improvement while keeping your authentic voice.",
                },
                {
                  q: "Do you guarantee admission?",
                  a: "No platform can guarantee admission, but we optimize your profile quality, planning, and decision-making process.",
                },
              ].map((item) => (
                <details key={item.q} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-slate-900">
                    {item.q}
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-3xl bg-gradient-to-r from-primary-600 to-[#101c2e] px-8 py-14 text-center text-white sm:px-12">
            <h2 className="text-4xl font-semibold sm:text-5xl">Secure Your Spot. Save Thousands.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
              Start your 7-day free trial and build a complete strategy with AI guidance today.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/onboarding/step-1"
                className="rounded-xl bg-white px-8 py-3.5 font-bold text-[#0f2a5f] shadow-xl ring-2 ring-white/60 hover:bg-white/90"
              >
                Get Started for Free
              </Link>
              <a href="#pricing" className="rounded-xl border border-white/40 px-8 py-3.5 font-bold hover:bg-white/10">
                See Pricing
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0f1b2d] px-4 pb-10 pt-16 text-slate-200 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-4">
            <div>
              <p className="text-2xl font-bold text-white">MyCollegePath.ai</p>
              <p className="mt-3 text-sm text-slate-400">
                AI-powered admissions strategy that stays private, practical, and accessible.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-white">Product</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><Link href="/login" className="hover:text-white">PathPal Chat</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-white">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li><Link href="/honoring" className="hover:text-white">Our Mission</Link></li>
                <li><a href="#how-it-works" className="hover:text-white">How it works</a></li>
                <li><Link href="/pricing" className="hover:text-white">Contact</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Institutional Partners</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-white">Trust & Legal</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li><Link href="/pricing" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Security</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Cookie Settings</Link></li>
              </ul>
            </div>
          </div>
          <p className="pt-6 text-center text-xs text-slate-500">
            © 2026 MyCollegePath.ai. All rights reserved. AI recommendations should be reviewed for personal fit.
          </p>
        </div>
      </footer>
    </div>
  );
}
