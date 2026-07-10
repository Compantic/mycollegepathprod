import Link from "next/link";
import { Building2, GraduationCap, ArrowRight } from "lucide-react";

type PartnerKind = "institution" | "advisor";

const COPY: Record<
  PartnerKind,
  { title: string; eyebrow: string; body: string; icon: typeof Building2 }
> = {
  institution: {
    eyebrow: "Institutional partners",
    title: "School & district access is not available in-app yet",
    body: "MyCollegePath currently serves students directly. Institutional dashboards, roster tools, and SSO for schools are planned with Compantic — they are not live on this login path.",
    icon: Building2,
  },
  advisor: {
    eyebrow: "Advisors & counselors",
    title: "Advisor login is not available in-app yet",
    body: "Independent counselor and mentor workspaces are not shipped in this product build. Students can sign in today; advisor tooling will be offered through Compantic partnerships.",
    icon: GraduationCap,
  },
};

export function PartnerLoginUnavailable({ kind }: { kind: PartnerKind }) {
  const copy = COPY[kind];
  const Icon = copy.icon;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600">{copy.eyebrow}</p>
        <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{copy.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{copy.body}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signin"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            Student sign in
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <a
            href="https://compantic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Contact Compantic
          </a>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Stack note: this product runs on Firebase, OpenAI, College Scorecard, and Stripe — not Azure AI.
        </p>
      </div>
    </div>
  );
}
