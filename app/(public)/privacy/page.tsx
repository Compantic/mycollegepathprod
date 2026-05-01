import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Info } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | MyCollegePath",
  description: "Our commitment to your data privacy and security.",
};

export default function PrivacyPolicy() {
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
            <Lock className="h-3.5 w-3.5" />
            Legal Document
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Privacy Policy</h1>
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
            MyCollegePath helps students get into college using personalized digital guidance. We collect your academic info and essays to do that job. We <strong>DO NOT</strong> use your data to train external models — ever. We also <strong>NEVER</strong> sell your data to advertisers, data brokers, or anyone else. If you are under 13, you cannot use this platform. If you are 13–17, a parent or guardian must consent on your behalf. You can access, correct, or delete your data anytime. This policy explains everything in plain English.
          </p>
        </section>

        <div className="prose prose-slate max-w-none space-y-12 text-slate-700 leading-relaxed">
          <section>
            <p>
              MyCollegePath (the “Platform”) is owned and operated by DEVIX Corporation LLC, d/b/a COMPANTIC (“Company,” “we,” “us,” or “our”), a limited liability company organized under the laws of the State of Texas, United States of America.
            </p>
            <p>
              This Privacy Policy (“Policy”) describes how we collect, use, disclose, retain, and protect information obtained from and about users (“you” or “your”) of MyCollegePath, including students, parents, legal guardians, mentors, and educational professionals. This Policy applies to all interactions with the Platform, including our website, mobile applications, application programming interfaces (APIs), and any related services.
            </p>
            <p>
              By accessing or using the Platform, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with any provision herein, you must discontinue use of the Platform immediately.
            </p>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="m-0 font-semibold italic text-sm">
                ⚠️ Important Legal Disclaimer: This Privacy Policy is provided as a comprehensive legal document prepared with regulatory guidance across COPPA, FERPA, CCPA/CPRA, TDPSA, VCDPA, CPA, CTDPA, and other applicable US state privacy laws. However, this document should be reviewed by a licensed attorney specializing in EdTech and data privacy law prior to publication. This constitutes regulatory guidance, not legal advice.
              </p>
            </div>
          </section>

          <section id="eligibility">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm">1</span>
              Eligibility, Age Restrictions & COPPA Compliance
            </h2>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-sm italic">
              ℹ️ TL;DR Summary: You must be at least 13 years old to use MyCollegePath. We do NOT collect data from children under 13. If you are 13–17, a parent or guardian must review and consent to this policy on your behalf before you create an account.
            </div>
            
            <h3 className="mt-6 text-lg font-bold text-slate-900">1.1 Minimum Age Requirement</h3>
            <p>
              MyCollegePath is strictly designed for users aged thirteen (13) and older. The Platform is intended for use by high school students, parents and legal guardians, mentors, college counselors, and educational professionals.
            </p>

            <h3 className="mt-6 text-lg font-bold text-slate-900">1.2 COPPA Compliance — Children Under 13</h3>
            <p>
              In full compliance with the Children’s Online Privacy Protection Act (“COPPA”), 15 U.S.C. §§ 6501–6506, and the Federal Trade Commission’s implementing rules at 16 C.F.R. Part 312 (including the 2024–2025 amendments):
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We do not knowingly collect, use, store, process, maintain, disclose, or sell personal information from children under the age of thirteen (13).</li>
              <li>We do not knowingly allow children under 13 to create accounts, submit information, or interact with any feature of the Platform.</li>
              <li>We do not target, direct, or market the Platform to children under the age of 13.</li>
            </ul>
            <p>
              If we learn or have reason to believe that we have collected personal information from a child under 13 without verified parental consent, we will take immediate steps to delete such information from our systems within seventy-two (72) hours of discovery and will notify the parent or guardian if contact information is available.
            </p>

            <h3 className="mt-6 text-lg font-bold text-slate-900">1.3 Users Aged 13–17: Parental/Guardian Consent</h3>
            <p>For users between the ages of thirteen (13) and seventeen (17), the following requirements apply:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Verifiable Parental or Guardian Consent:</strong> Before a minor user aged 13–17 may create an account or submit personal information to the Platform, a parent or legal guardian must provide verifiable consent through electronic signature, credit card verification, video call, or signed form.</li>
              <li><strong>Parental Dashboard:</strong> Parents and legal guardians of minor users will have access to a parental dashboard allowing them to review, correct, or delete their child's data.</li>
              <li><strong>Sensitive Data Restrictions:</strong> For users aged 13–17, we apply heightened data minimization standards. We do not serve behavioral or targeted advertising to minor users.</li>
            </ul>

            <h3 className="mt-6 text-lg font-bold text-slate-900">1.4 Age Verification Mechanism</h3>
            <p>
              At the time of account creation, the Platform employs a neutral, non-incentivizing age-screening mechanism. Users who indicate an age below thirteen (13) will be immediately blocked from registration.
            </p>
            
            <h3 className="mt-6 text-lg font-bold text-slate-900">1.5 California Minors (CCPA/CPRA Supplemental)</h3>
            <p>
              We do not sell or share personal information of consumers under the age of sixteen (16) without affirmative opt-in consent. Violations involving minors’ data may carry treble statutory penalties of up to $7,500 per intentional violation.
            </p>

            <h3 className="mt-6 text-lg font-bold text-slate-900">1.6 Texas TDPSA Supplemental</h3>
            <p>
              Under the Texas Data Privacy and Security Act, data from a known child is classified as “sensitive data” requiring affirmative opt-in consent. We maintain Data Protection Assessments as required by the TDPSA.
            </p>
          </section>

          <section id="collection">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm">2</span>
              What Information Do We Collect?
            </h2>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-sm italic">
              ℹ️ TL;DR Summary: We collect the basics (name, email) plus the academic information you give us to help with college admissions: grades, essays, transcripts, extracurriculars, and how you use the platform. We also collect device and browser info automatically.
            </div>

            <h3 className="mt-6 text-lg font-bold text-slate-900">2.1 Information You Provide Directly</h3>
            <p><strong>A. Account Registration Information:</strong> Full legal name, email, password (hashed), date of birth, account type, phone number (optional).</p>
            <p><strong>B. Academic & College Counseling Data:</strong> GPAs, transcripts, standardized test scores (SAT/ACT/AP), essays, extracurriculars, scholarship info, and demographic info (voluntary).</p>
            <p><strong>C. User-Generated Content:</strong> Journal submissions, messages, notes, and support requests.</p>
            
            <h3 className="mt-6 text-lg font-bold text-slate-900">2.2 Information Collected Automatically</h3>
            <p><strong>D. Device & Technical Data:</strong> IP address (anonymized after 30 days), browser type, OS, referring URLs.</p>
            <p><strong>E. Behavioral & Usage Data:</strong> Pages visited, features used, assistant interaction logs, search queries, session timestamps.</p>
          </section>

          <section id="usage">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm">3</span>
              How Do We Use Your Information?
            </h2>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200 text-sm italic">
              ℹ️ TL;DR Summary: We use your data for two main things: (1) giving you personalized college guidance and (2) running and improving the platform. We DO NOT use your data to train external models.
            </div>
            <p>We use your information for core service delivery, platform operations, analytics, and essential communications. We do not use personal information for behavioral advertising or targeted profiling.</p>
          </section>

          {/* Automated processing section with guarantee */}
          <section id="ai-usage" className="rounded-2xl border-2 border-emerald-100 bg-emerald-50/30 p-8 shadow-sm">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 text-sm text-center">4</span>
              Artificial Intelligence, Machine Learning & Data Usage
            </h2>
            <div className="mt-4 rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-sm italic">
              ℹ️ TL;DR Summary: Our automated analysis reads your essays and academic data to give you personalized feedback. We DO NOT use your data to train external models.
            </div>

            <div className="my-8 rounded-xl bg-emerald-600 p-6 text-white shadow-lg">
              <div className="mb-2 flex items-center gap-2 font-bold uppercase tracking-[0.1em] text-emerald-100 text-xs">
                <ShieldCheck className="h-4 w-4" />
                OUR IRONCLAD GUARANTEE
              </div>
              <p className="m-0 text-xl font-bold leading-tight">
                MyCollegePath DOES NOT use your personal information, essays, academic records, or any user-generated content to train, fine-tune, retrain, or otherwise develop artificial intelligence or machine learning models.
              </p>
            </div>

            <p>Your data is processed solely to deliver services to you and is never fed into any model training pipeline. We use enterprise-grade DPAs with third-party providers (like Anthropic or OpenAI) that contractually prohibit them from using your data for their own training.</p>
          </section>

          <section id="journal">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm">5</span>
              Academic Journal & Publishing Rights
            </h2>
            <p>All student submissions will be published anonymously by default. You retain full intellectual property ownership. MyCollegePath will NEVER sell or commercially distribute your content without explicit written consent.</p>
          </section>

          <section id="sharing" className="rounded-2xl border-2 border-rose-100 bg-rose-50/20 p-8 shadow-sm">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 text-sm">6</span>
              Who Do We Share Your Data With?
            </h2>
            
            <div className="my-6 border-l-4 border-rose-500 bg-rose-50 p-5">
              <div className="mb-2 font-bold uppercase tracking-wider text-rose-700 text-xs">Anti-Sale Guarantee</div>
              <p className="m-0 font-bold text-rose-950">
                MyCollegePath absolutely DOES NOT and WILL NOT sell, rent, lease, trade, or license your user data to advertising companies, data brokers, or marketing firms — for any price, at any time.
              </p>
            </div>

            <p>We share data only with essential operational partners (model providers, payment processors) and universities (only when YOU choose to apply). All sharing is protected by strict contractual safeguards.</p>
          </section>

          <section id="retention">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm">7</span>
              How Long Do We Keep Your Data?
            </h2>
            <p>We keep your data as long as you have an active account. After account deletion, most data is permanently erased within 30 days. Billing records are kept for 7 years as required by law.</p>
          </section>

          <section id="rights">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm">8</span>
              Your Privacy Rights
            </h2>
            <p>We extend core privacy rights to all US users: the right to access, correct, delete, and port your data. We honor state-specific laws like CCPA/CPRA (California) and TDPSA (Texas).</p>
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
