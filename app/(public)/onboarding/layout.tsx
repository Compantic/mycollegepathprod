import Link from "next/link";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { LogoIcon } from "@/components/landing/LogoIcon";
import { Settings, ShieldCheck, Lock } from "lucide-react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="fixed inset-0 -z-10 bg-[#F7F9FC]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/[0.04] via-transparent to-secondary-100/50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-onboarding-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-onboarding-pulse-soft" style={{ animationDelay: "1s" }} />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0' fill='%232B5FD9'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <header className="shrink-0 sticky top-0 z-40 animate-in fade-in duration-500">
        <div
          className="border-b border-white/20 bg-white/75 backdrop-blur-xl shadow-sm"
          style={{ boxShadow: "0 1px 0 0 rgba(43, 95, 217, 0.06)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-primary-600 hover:text-primary-500 transition-all duration-300 hover:opacity-90 group"
              aria-label="MyCollegePath home"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md transition-transform duration-300 group-hover:scale-105">
                <LogoIcon className="h-5 w-5 shrink-0" />
              </span>
              <span className="text-lg font-bold text-text-primary tracking-tight">
                MyCollegePath<span className="text-primary-500">.ai</span>
              </span>
            </Link>
            <button
              type="button"
              className="rounded-xl p-2.5 text-text-muted hover:bg-primary-500/10 hover:text-primary-600 transition-all duration-300 hover:scale-105"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
          <OnboardingProgress />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6 sm:py-8 space-y-5">
        {/* Privacy strip - animated entrance */}
        <div
          className="rounded-2xl border border-primary-500/20 bg-white/90 backdrop-blur-sm px-4 py-3.5 text-xs text-text-secondary shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500"
          style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
        >
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-600">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[11px] uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Lock className="h-3 w-3" aria-hidden />
              Your data & privacy
            </p>
            <p className="mt-1.5 leading-relaxed">
              Your answers are used only to personalize your college guidance. We never sell your data, and you can request deletion at any time.
            </p>
            <Link
              href="/#privacy"
              className="mt-2 inline-flex text-[11px] font-semibold text-primary-500 hover:text-primary-600 hover:underline transition-colors"
            >
              Learn more in our privacy policy
            </Link>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>{children}</div>
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-4">
              <div className="rounded-2xl border border-primary-200 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-600">Real-time personalization</p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  As you answer each question, we improve your matching, roadmap, and AI coaching outputs.
                </p>
              </div>
              <div className="rounded-2xl border border-bg-border bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">What unlocks next?</p>
                <ul className="mt-2 space-y-2 text-xs text-text-secondary">
                  <li className="rounded-lg bg-primary-50 px-2.5 py-2">Better reach/match/safety balance</li>
                  <li className="rounded-lg bg-emerald-50 px-2.5 py-2">More specific AI guidance</li>
                  <li className="rounded-lg bg-indigo-50 px-2.5 py-2">Stronger roadmap priorities</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
