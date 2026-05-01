import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Info, Users, CreditCard, AlertTriangle, Scale } from "lucide-react";

export const metadata = {
  title: "Terms of Service | MyCollegePath",
  description: "The terms and conditions governing your use of MyCollegePath.",
};

export default function TermsOfService() {
  const lastUpdated = "April 17, 2026";
  const currentYear = "2026";

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      {/* Navigation */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            MyCollegePath
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-700">
            <Scale className="h-3.5 w-3.5" />
            Legal Agreement
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Terms of Service</h1>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <p>Effective Date: {lastUpdated}</p>
            <p>Last Updated: {lastUpdated}</p>
            <p>Version 1.0</p>
          </div>
        </div>

        {/* TL;DR Summary Card */}
        <section className="mb-12 rounded-2xl border border-primary-100 bg-primary-50/50 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md">
              <Info className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">TL;DR — Plain-English Summary</h2>
          </div>
          <p className="text-lg leading-relaxed text-slate-700">
            By using MyCollegePath, you agree to these Terms. The platform provides personalized college guidance plus optional human mentor sessions on premium tiers. You must be at least 13 to use it, and if you’re under 18, a parent or guardian must agree on your behalf. If you don’t agree, don’t use the platform.
          </p>
        </section>

        <div className="prose prose-slate max-w-none space-y-12 text-slate-700 leading-relaxed">
          <section id="acceptance">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm">1</span>
              Acceptance of Terms & Overview
            </h2>
            <p>
              These Terms of Service (“Terms” or “Agreement”) constitute a legally binding contract between you (“User,” “you,” or “your”) and DEVIX Corporation LLC, d/b/a COMPANTIC (“Company,” “we,” “us,” or “our”), a Texas limited liability company, governing your access to and use of the MyCollegePath platform.
            </p>
            <p className="font-bold uppercase text-slate-900">
              BY ACCESSING, REGISTERING FOR, OR USING THE PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS AND OUR PRIVACY POLICY.
            </p>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="m-0 font-semibold italic text-sm">
                ⚠️ Legal Disclaimer: This document is prepared with regulatory guidance across applicable US federal and state laws. It should be reviewed by a licensed attorney prior to publication. This constitutes regulatory guidance, not legal advice.
              </p>
            </div>
          </section>

          <section id="eligibility">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm">2</span>
              Eligibility & Age Requirements
            </h2>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-sm italic">
              ℹ️ TL;DR Summary: You must be 13 or older. Under 18? A parent or guardian must consent. Under 13? You cannot use this platform at all.
            </div>
            
            <h3 className="mt-6 text-lg font-bold text-slate-900">2.1 Minimum Age</h3>
            <p>
              The Platform is available exclusively to individuals aged thirteen (13) and older. By creating an account, you represent and warrant that you are at least thirteen (13) years of age.
            </p>

            <h3 className="mt-6 text-lg font-bold text-slate-900">2.2 Minor Users (Ages 13–17)</h3>
            <p>
              If you are between thirteen (13) and seventeen (17) years of age, a parent or legal guardian must review and affirmatively consent to these Terms and our Privacy Policy through our verifiable consent mechanism.
            </p>
          </section>

          <section id="security">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm">3</span>
              Account Registration & Security
            </h2>
            <p>You are solely responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at security@mycollegepath.ai of any unauthorized access.</p>
          </section>

          <section id="services">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm">4</span>
              Description of Platform Services
            </h2>
            <p>
              MyCollegePath offers digital college guidance (essay feedback, college matching, application tracking) on all tiers, plus live human mentor sessions on premium tiers.
            </p>
            
            <div className="my-8 rounded-2xl border-2 border-primary-100 bg-primary-50/30 p-8 shadow-sm">
              <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <Users className="h-5 w-5 text-primary-600" />
                Minor Safety — Critical
              </h3>
              <p className="mt-4 text-slate-700">
                For users under 18: All mentor video sessions are recorded and retained for safety and quality purposes. Parents/guardians may request review of any session recording. Mentors are prohibited from private off-platform contact with minor users.
              </p>
            </div>
          </section>

          <section id="pricing">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm">5</span>
              Subscription Tiers, Pricing & Payment
            </h2>
            <p>We offer multiple subscription tiers: Explorer (Free), Pathfinder, Navigator, and Titan. Payments are processed through a secure PCI DSS Level 1 compliant provider. Subscriptions automatically renew unless cancelled.</p>
          </section>

          <section id="conduct">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm">6</span>
              User Conduct & Acceptable Use
            </h2>
            <p>You agree not to use the platform for academic dishonesty, plagiarism, harassment, or technical abuse. Violations may result in immediate account termination.</p>
          </section>

          {/* Automated guidance disclaimer */}
          <section id="ai-disclaimer" className="rounded-2xl border-2 border-amber-100 bg-amber-50/30 p-8 shadow-sm">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 text-sm">7</span>
              Automated Guidance Disclaimer & Limitations
            </h2>
            
            <div className="my-6 border-l-4 border-amber-500 bg-amber-50 p-5">
              <div className="mb-2 font-bold uppercase tracking-wider text-amber-700 text-xs">Critical Disclaimer</div>
              <p className="m-0 font-bold text-amber-950">
                Automated features provide informational guidance only. They do not constitute professional admissions counseling or any guarantee of outcomes.
              </p>
            </div>

            <p>Platform outputs may contain inaccuracies and should be independently verified. THE COMPANY MAKES NO REPRESENTATION THAT USE OF THE PLATFORM WILL RESULT IN ADMISSION TO ANY INSTITUTION.</p>
          </section>

          <section id="property">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm">8</span>
              Intellectual Property & Content Rights
            </h2>
            <p>You retain full ownership of Your Content (essays, etc.). You grant us a limited license to process and display it for service delivery. Company property remains exclusive to us.</p>
          </section>

          <section id="liability">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm">10</span>
              Limitation of Liability
            </h2>
            <p>To the maximum extent permitted by law, our aggregate liability is limited to the amount you paid us in the 12 months preceding the claim, or $100.</p>
          </section>

          <section id="dispute">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm">12</span>
              Dispute Resolution
            </h2>
            <p>Any disputes will be resolved through binding individual arbitration in Williamson County, Texas. You waive the right to participate in class actions or jury trials.</p>
          </section>

          <section id="contact" className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
            <h2 className="text-2xl font-bold text-slate-900">Contact Us</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Company</p>
                <p className="mt-1 font-semibold text-slate-900">DEVIX Corporation LLC, d/b/a COMPANTIC</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Email</p>
                <a href="mailto:contac@mycollegepath.com" className="mt-1 block font-semibold text-primary-600 hover:underline">
                  contac@mycollegepath.com
                </a>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Mailing Address</p>
                <p className="mt-1 text-slate-900 leading-tight">
                  Leander, Texas, United States
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">General Support</p>
                <a href="mailto:contact@compantic.com" className="mt-1 block font-semibold text-slate-900">
                  contact@compantic.com
                </a>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-24 border-t border-slate-200 pt-8 text-center text-xs text-slate-500">
          <p>© {currentYear} DEVIX Corporation LLC, d/b/a COMPANTIC. All Rights Reserved.</p>
          <p className="mt-2">MyCollegePath — Personalized College Admissions Guidance</p>
          <p className="mt-1">Leander, Texas, United States</p>
        </footer>
      </main>
    </div>
  );
}
