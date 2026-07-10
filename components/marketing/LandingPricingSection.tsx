"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { BillingCatalogResponse } from "@/lib/billing/catalog-types";
import { ANNUAL_DISCOUNT, FREE_PLAN_UI, PAID_PLAN_UI } from "@/lib/billing/pricing-features";
import { cn } from "@/lib/utils";

const pricingDisplayPlans = [
  { kind: "free" as const, ...FREE_PLAN_UI },
  { kind: "starter" as const, ...PAID_PLAN_UI.starter },
  { kind: "growth" as const, ...PAID_PLAN_UI.growth },
  { kind: "elite" as const, ...PAID_PLAN_UI.elite },
];

type Props = {
  /** When embedded on the home page, keep anchor id for in-page scroll from hero (optional). */
  showSectionId?: boolean;
  className?: string;
};

export function LandingPricingSection({ showSectionId = false, className }: Props) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [catalog, setCatalog] = useState<BillingCatalogResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing/catalog")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("catalog"))))
      .then((data: BillingCatalogResponse) => {
        if (!cancelled) setCatalog(data);
      })
      .catch(() => {
        if (!cancelled) setCatalog(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      {...(showSectionId ? { id: "pricing" } : {})}
      className={cn(
        "scroll-mt-24 bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-50 px-4 py-24 sm:px-6 lg:px-8",
        className
      )}
    >
      <div className="mx-auto max-w-7xl xl:max-w-[92rem]">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Investment in Your Future</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Traditional counseling can exceed $6,500. Free includes one roadmap; paid plans start with a 7-day free trial.
          </p>
        </div>
        <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
          <span className="text-sm font-medium text-slate-500">Billing</span>
          <div
            className="inline-flex rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm ring-1 ring-slate-900/5"
            role="group"
            aria-label="Billing period"
          >
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
                billingPeriod === "monthly"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("annual")}
              className={cn(
                "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
                billingPeriod === "annual"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              Annual
              <span className="ml-2 inline-flex items-center rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                −20%
              </span>
            </button>
          </div>
          <p className="max-w-md text-center text-xs leading-relaxed text-slate-500 sm:text-left">
            Yearly billing saves 20% on Starter, Growth, and Elite vs paying monthly for 12 months.
          </p>
        </div>

        <div
          className={cn(
            "auto-rows-fr gap-5",
            "max-md:grid max-md:grid-cols-1",
            "md:max-lg:flex md:max-lg:snap-x md:max-lg:snap-mandatory md:max-lg:gap-4 md:max-lg:overflow-x-auto md:max-lg:px-4 md:max-lg:pb-3 md:max-lg:scroll-px-4 md:max-lg:[-webkit-overflow-scrolling:touch]",
            "lg:mx-0 lg:grid lg:auto-rows-fr lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0"
          )}
        >
          {pricingDisplayPlans.map((plan) => {
            const monthlyAmount =
              plan.kind === "free" ? 0 : catalog ? catalog.plans[plan.kind].monthlyCents / 100 : null;
            const annualTotal =
              plan.kind === "free" ? 0 : catalog ? catalog.plans[plan.kind].yearlyCents / 100 : null;
            const fullYearAtMonthly = monthlyAmount != null ? monthlyAmount * 12 : null;
            const savingsPct =
              monthlyAmount != null && annualTotal != null && monthlyAmount > 0
                ? Math.max(0, Math.round((1 - annualTotal / (monthlyAmount * 12)) * 100))
                : Math.round(ANNUAL_DISCOUNT * 100);
            return (
              <div
                key={plan.name}
                className={cn(
                  "relative flex h-full min-h-0 min-w-0 flex-col overflow-visible rounded-3xl p-6 pt-9 shadow-sm transition-shadow",
                  "md:max-lg:min-w-[260px] md:max-lg:max-w-[min(85vw,300px)] md:max-lg:flex-shrink-0 md:max-lg:snap-center",
                  "lg:min-w-0 lg:max-w-none",
                  plan.kind === "free"
                    ? "border border-slate-700/60 bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-slate-900/20"
                    : "border border-slate-200/90 bg-white/95 shadow-slate-200/40 ring-1 ring-slate-900/[0.04]",
                  plan.featured &&
                    "z-[1] border-primary-300/60 shadow-xl shadow-primary-900/10 ring-2 ring-primary-500/15"
                )}
              >
                {plan.featured ? (
                  <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-950 shadow-md">
                    Most popular
                  </div>
                ) : null}

                <div className="min-w-0">
                  <h3 className="text-lg font-bold tracking-tight">{plan.name}</h3>
                  <div
                    className={cn(
                      "mt-3",
                      plan.kind === "free" && billingPeriod === "annual" && "min-h-[6rem]",
                      plan.kind !== "free" && billingPeriod === "annual" && "min-h-[7.25rem]"
                    )}
                  >
                    {plan.kind === "free" ? (
                      <>
                        <p className="text-3xl font-bold tabular-nums">
                          $0
                          <span className="ml-1.5 text-base font-semibold opacity-80">
                            {billingPeriod === "annual" ? "forever" : "/mo"}
                          </span>
                        </p>
                        <p className="mt-2 text-xs leading-snug text-slate-400">
                          {billingPeriod === "annual"
                            ? "Free tier stays free — annual savings apply to paid plans."
                            : "No credit card required to explore."}
                        </p>
                      </>
                    ) : billingPeriod === "monthly" ? (
                      <p className="text-3xl font-bold tabular-nums">
                        {monthlyAmount != null ? (
                          <>
                            ${monthlyAmount.toFixed(2)}
                            <span className="ml-1.5 text-base font-semibold text-slate-500">/mo</span>
                          </>
                        ) : (
                          <span className="text-2xl font-semibold text-slate-400">Loading…</span>
                        )}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-3xl font-bold tabular-nums">
                          {annualTotal != null ? (
                            <>
                              ${annualTotal.toFixed(2)}
                              <span className="ml-1.5 text-base font-semibold text-slate-500">/yr</span>
                            </>
                          ) : (
                            <span className="text-2xl font-semibold text-slate-400">Loading…</span>
                          )}
                        </p>
                        <span className="inline-flex w-fit max-w-full rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold leading-tight text-white shadow-sm ring-1 ring-emerald-900/10">
                          {savingsPct}% off · billed once yearly
                        </span>
                        {fullYearAtMonthly != null ? (
                          <p className="text-[11px] leading-snug text-slate-500 line-through opacity-75">
                            ${fullYearAtMonthly.toFixed(2)}/yr at monthly rates
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                <ul className="mt-5 mb-6 shrink-0 space-y-2.5 text-sm leading-snug text-slate-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5">
                      <CheckCircle2
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          plan.kind === "free" ? "text-emerald-400" : "text-emerald-600"
                        )}
                        aria-hidden
                      />
                      <span className={plan.kind === "free" ? "text-slate-200" : "text-slate-700"}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/onboarding/step-1"
                  className={cn(
                    "mt-auto inline-flex w-full min-w-0 items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold transition-all",
                    plan.kind === "free" &&
                      "bg-white/12 text-white hover:bg-white/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40",
                    plan.kind !== "free" &&
                      plan.featured &&
                      "bg-primary-600 text-white shadow-md shadow-primary-600/25 hover:bg-primary-700",
                    plan.kind !== "free" &&
                      !plan.featured &&
                      "border-2 border-slate-200 bg-white text-slate-800 hover:border-primary-300 hover:bg-primary-50/60"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
