/** Shared onboarding types for app use. */
import type { OnboardingAnswers as OnboardingAnswersSchema } from "./schema";

/** Full normalized answers object as stored in Firestore. */
export type OnboardingAnswers = OnboardingAnswersSchema;

/** Read‑only projection used by downstream consumers (matching, roadmap, dashboard, etc.). */
export type OnboardingSnapshot = Readonly<OnboardingAnswersSchema>;

/** Mutable draft used by onboarding wizard and profile editing. */
export type OnboardingDraft = OnboardingAnswersSchema;

export const ONBOARDING_STORAGE_KEY = "onboardingAnswers";
