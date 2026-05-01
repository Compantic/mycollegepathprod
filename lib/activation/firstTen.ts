"use client";

export type FirstTenStepId = "colleges" | "matching" | "roadmap" | "chat";

export function firstTenFlagKey(uid: string | undefined, stepId: FirstTenStepId): string {
  return `activation_first10_flag_${uid ?? "anon"}_${stepId}`;
}

export function markFirstTenStepDone(uid: string | undefined, stepId: FirstTenStepId): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(firstTenFlagKey(uid, stepId), "1");
  } catch {
    // noop
  }
}

export function isFirstTenStepDone(uid: string | undefined, stepId: FirstTenStepId): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(firstTenFlagKey(uid, stepId)) === "1";
  } catch {
    return false;
  }
}
