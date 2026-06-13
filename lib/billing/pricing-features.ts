/** Shared marketing copy for pricing cards (amounts come from Stripe via `/api/billing/catalog`). */

export const ANNUAL_DISCOUNT = 0.2;

export type PaidPlanUiKey = "starter" | "growth" | "elite";

export const FREE_PLAN_UI = {
  name: "Free Plan",
  dark: true,
  featured: false as const,
  cta: "Try Free",
  features: [
    "Creating your portfolio",
    "Identifying College List",
    "Monthly College Admission Webinar",
  ],
} as const;

export const PAID_PLAN_UI: Record<
  PaidPlanUiKey,
  { name: string; featured?: boolean; cta: string; features: string[] }
> = {
  starter: {
    name: "Starter",
    featured: true,
    cta: "Select Starter",
    features: [
      "Creating your portfolio",
      "Identifying College List",
      "Monthly College Admission Webinar",
      "Using Consultant Chat up to 20 times",
      "2 Essay Review with feedback",
      "Revising your college list twice",
      "Revising your Road Map twice",
      "Unlimited use of AI Scoring",
    ],
  },
  growth: {
    name: "Growth",
    cta: "Select Growth",
    features: [
      "Creating your portfolio",
      "Identifying College List",
      "Monthly College Admission Webinar",
      "Using Consultant Chat up to 40 times",
      "4 Essay Review with feedback",
      "Revising your college list up to ten times",
      "Revising your Road Map up to ten times",
      "Unlimited use of AI Scoring",
    ],
  },
  elite: {
    name: "Elite",
    cta: "Go Elite",
    features: [
      "Creating your portfolio",
      "Identifying College List",
      "Monthly College Admission Webinar",
      "Unlimited use of Consultant Chat",
      "Unlimited Essay Review with feedback",
      "Revising your college list unlimited",
      "Revising your Road Map unlimited",
      "Unlimited use of AI Scoring",
    ],
  },
};
