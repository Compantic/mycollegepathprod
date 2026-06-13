"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { BillingCatalogResponse } from "@/lib/billing/catalog-types";
import type { BillingPeriod, BillingPlan } from "@/lib/billing/plans";
import { ANNUAL_DISCOUNT, FREE_PLAN_UI, PAID_PLAN_UI } from "@/lib/billing/pricing-features";
import { planRank } from "@/lib/billing/plan-rank";
import { PLAN_ENTITLEMENTS } from "@/lib/billing/entitlements";
import { cn } from "@/lib/utils";

type PaidPlan = Exclude<BillingPlan, "free">;

const PAID_KEYS = ["starter", "growth", "elite"] as const satisfies readonly PaidPlan[];

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

function checkoutActionLabel(args: {
  target: PaidPlan;
  period: BillingPeriod;
  current: BillingPlan;
  currentPeriod: BillingPeriod | null;
  subscriptionActive: boolean;
}): { label: string; disabled: boolean } {
  const { target, period, current, currentPeriod, subscriptionActive } = args;
  const paidActive = subscriptionActive && current !== "free";

  if (!paidActive) {
    return { label: `Subscribe · ${period === "monthly" ? "Monthly" : "Yearly"}`, disabled: false };
  }

  if (current === target && currentPeriod === period) {
    return { label: "Current plan", disabled: true };
  }

  if (current === target && currentPeriod != null && currentPeriod !== period) {
    return {
      label: period === "yearly" ? "Switch to yearly billing" : "Switch to monthly billing",
      disabled: false,
    };
  }

  const delta = planRank(target) - planRank(current);
  if (delta > 0) {
    return { label: `Upgrade · ${period === "monthly" ? "Monthly" : "Yearly"}`, disabled: false };
  }
  if (delta < 0) {
    return { label: `Downgrade · ${period === "monthly" ? "Monthly" : "Yearly"}`, disabled: false };
  }

  return { label: "Continue", disabled: false };
}

export default function BillingPage() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<BillingCatalogResponse | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [viewPeriod, setViewPeriod] = useState<BillingPeriod>("monthly");
  const [me, setMe] = useState<{
    plan: BillingPlan;
    status: string | null;
    billingPeriod: BillingPeriod | null;
    currentPeriodEnd: string | null;
    month: string;
    limits: Record<string, number | undefined>;
    used: Record<string, number>;
  } | null>(null);

  async function refreshPlanFromStripe() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/refresh", { method: "POST", credentials: "include" });
      const data = (await res.json()) as { plan?: string; status?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not refresh plan");
      const meRes = await fetch("/api/billing/me", { credentials: "include" });
      if (meRes.ok) setMe(await meRes.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not refresh plan");
    } finally {
      setRefreshing(false);
    }
  }

  async function startCheckout(plan: PaidPlan, billingPeriod: BillingPeriod) {
    const key = `${plan}:${billingPeriod}`;
    setLoadingKey(key);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, billingPeriod }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoadingKey(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing/catalog")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("catalog"))))
      .then((data: BillingCatalogResponse) => {
        if (!cancelled) {
          setCatalog(data);
          setCatalogError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalog(null);
          setCatalogError("Prices are temporarily unavailable. Please refresh.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("billing"))))
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentPlan = me?.plan ?? "free";
  const ent = PLAN_ENTITLEMENTS[currentPlan];
  const subscriptionActive = Boolean(
    me?.status && (me.status === "active" || me.status === "trialing")
  );

  const usageRows: Array<{ key: "chat" | "essayAnalyze" | "matchingRun" | "roadmapGenerate"; label: string }> = [
    { key: "chat", label: "Consultant chat questions" },
    { key: "essayAnalyze", label: "Essay analyses" },
    { key: "matchingRun", label: "Matching runs" },
    { key: "roadmapGenerate", label: "Roadmaps" },
  ];

  const savingsPercent = Math.round(ANNUAL_DISCOUNT * 100);

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-12">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#0f1b2d] via-[#162236] to-primary-900 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/90">Billing</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Manage your plan & usage</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Subscription and limits stay in sync with Stripe. Usage resets every calendar month (UTC).
            </p>
          </div>
          {catalog ? (
            <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-200">
              Stripe {catalog.mode === "test" ? "test" : "live"} mode
            </span>
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-400/40 bg-rose-950/40 px-4 py-2 text-sm font-medium text-rose-100">
            {error}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.04]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Current plan</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {currentPlan === "free" ? FREE_PLAN_UI.name : PAID_PLAN_UI[currentPlan].name}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Status: <span className="font-semibold text-slate-900">{me?.status ?? "—"}</span>
            {me?.billingPeriod ? (
              <span className="text-slate-500"> · {me.billingPeriod === "monthly" ? "Monthly" : "Yearly"} billing</span>
            ) : null}
          </p>
          {me?.currentPeriodEnd ? (
            <p className="mt-2 text-xs text-slate-500">
              Renews:{" "}
              <span className="font-semibold text-slate-700">
                {new Date(me.currentPeriodEnd).toLocaleString()}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              {subscriptionActive ? "Renewal date will appear after your first invoice syncs." : "You are on the free tier."}
            </p>
          )}
          {!subscriptionActive ? (
            <button
              type="button"
              onClick={() => void refreshPlanFromStripe()}
              disabled={refreshing}
              className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
            >
              {refreshing ? "Syncing from Stripe…" : "I paid — refresh my plan"}
            </button>
          ) : null}
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.04]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">This month</p>
          <p className="mt-2 text-sm text-slate-600">
            Month (UTC): <span className="font-semibold text-slate-900">{me?.month ?? "—"}</span>
          </p>
          <div className="mt-4 space-y-3">
            {usageRows.map(({ key, label }) => {
              const limit = ent.monthlyLimits[key];
              const used = me?.used?.[String(key)] ?? 0;
              const enabled = Boolean((ent.enabled as Record<string, boolean>)[key]);
              const text = limit ? `${used} / ${limit}` : enabled ? "Unlimited" : "—";
              return (
                <div key={String(key)} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-semibold tabular-nums text-slate-900">{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200/80 bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Choose your plan</h2>
          <p className="mt-2 text-sm text-slate-600">
            Prices match the homepage and are loaded from Stripe ({catalogError ? "unavailable" : "live catalog"}).
          </p>
        </div>

        {catalogError ? (
          <p className="mx-auto mt-4 max-w-lg text-center text-sm text-amber-800">{catalogError}</p>
        ) : null}

        <div className="mx-auto mt-8 flex max-w-xl flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
          <span className="text-sm font-medium text-slate-500">Billing</span>
          <div
            className="inline-flex rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm ring-1 ring-slate-900/5"
            role="group"
            aria-label="Billing period"
          >
            <button
              type="button"
              onClick={() => setViewPeriod("monthly")}
              className={cn(
                "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
                viewPeriod === "monthly" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setViewPeriod("yearly")}
              className={cn(
                "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
                viewPeriod === "yearly" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              Yearly
              <span className="ml-2 inline-flex items-center rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                −{savingsPercent}%
              </span>
            </button>
          </div>
          <p className="max-w-md text-center text-xs leading-relaxed text-slate-500 sm:text-left">
            Yearly billing saves {savingsPercent}% versus paying the monthly rate for 12 months (where configured in Stripe).
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PAID_KEYS.map((planKey) => {
            const copy = PAID_PLAN_UI[planKey];
            const cat = catalog?.plans[planKey];
            const monthlyAmount = cat ? cat.monthlyCents / 100 : null;
            const yearlyAmount = cat ? cat.yearlyCents / 100 : null;
            const currency = cat?.currency ?? "usd";
            const fullYearAtMonthly = monthlyAmount != null ? monthlyAmount * 12 : null;
            const stripeSavingsPct =
              monthlyAmount != null && yearlyAmount != null && monthlyAmount > 0
                ? Math.max(0, Math.round((1 - yearlyAmount / (monthlyAmount * 12)) * 100))
                : savingsPercent;

            const isCurrentPlan = subscriptionActive && currentPlan === planKey;
            const { label, disabled } = checkoutActionLabel({
              target: planKey,
              period: viewPeriod,
              current: currentPlan,
              currentPeriod: me?.billingPeriod ?? null,
              subscriptionActive,
            });

            const loading = loadingKey === `${planKey}:${viewPeriod}`;

            return (
              <div
                key={planKey}
                className={cn(
                  "relative flex h-full flex-col overflow-visible rounded-3xl p-6 pt-9 shadow-sm transition-shadow",
                  "border border-slate-200/90 bg-white/95 shadow-slate-200/40 ring-1 ring-slate-900/[0.04]",
                  copy.featured && "z-[1] border-primary-300/60 shadow-xl shadow-primary-900/10 ring-2 ring-primary-500/15",
                  isCurrentPlan && "ring-2 ring-emerald-500/25"
                )}
              >
                {copy.featured ? (
                  <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-950 shadow-md">
                    Most popular
                  </div>
                ) : null}
                {isCurrentPlan ? (
                  <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                    Your plan
                  </div>
                ) : null}

                <div className="min-w-0">
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">{copy.name}</h3>
                  <div className="mt-3 min-h-[5.5rem]">
                    {viewPeriod === "monthly" ? (
                      <p className="text-3xl font-bold tabular-nums text-slate-900">
                        {monthlyAmount != null ? (
                          <>
                            {formatMoney(monthlyAmount, currency)}
                            <span className="ml-1.5 text-base font-semibold text-slate-500">/mo</span>
                          </>
                        ) : (
                          <span className="text-xl font-semibold text-slate-400">…</span>
                        )}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-3xl font-bold tabular-nums text-slate-900">
                          {yearlyAmount != null ? (
                            <>
                              {formatMoney(yearlyAmount, currency)}
                              <span className="ml-1.5 text-base font-semibold text-slate-500">/yr</span>
                            </>
                          ) : (
                            <span className="text-xl font-semibold text-slate-400">…</span>
                          )}
                        </p>
                        {yearlyAmount != null && fullYearAtMonthly != null ? (
                          <>
                            <span className="inline-flex w-fit rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold leading-tight text-white shadow-sm ring-1 ring-emerald-900/10">
                              {stripeSavingsPct}% off · billed once yearly
                            </span>
                            <p className="text-[11px] leading-snug text-slate-500 line-through opacity-80">
                              {formatMoney(fullYearAtMonthly, currency)}/yr at monthly rates
                            </p>
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                <ul className="mt-5 mb-6 flex-1 space-y-2.5 text-sm leading-snug">
                  {copy.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={disabled || loading}
                  onClick={() => startCheckout(planKey, viewPeriod)}
                  className={cn(
                    "mt-auto inline-flex w-full min-w-0 items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50",
                    copy.featured
                      ? "bg-primary-600 text-white shadow-md shadow-primary-600/25 hover:bg-primary-700"
                      : "border-2 border-slate-200 bg-white text-slate-800 hover:border-primary-300 hover:bg-primary-50/60",
                    disabled && "border-slate-200 bg-slate-100 text-slate-500 shadow-none hover:bg-slate-100"
                  )}
                >
                  {loading ? "Redirecting…" : label}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        Need help?{" "}
        <Link href="/pricing" className="font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800">
          Compare on the homepage
        </Link>
      </p>
    </div>
  );
}
