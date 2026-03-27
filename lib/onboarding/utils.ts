/**
 * Client-side helpers for onboarding (display only).
 * Age is computed from dateOfBirth; do not store age as source of truth.
 */

/** Compute age from YYYY-MM-DD for display only. */
export function ageFromDateOfBirth(dateStr: string): number | null {
  if (!dateStr || dateStr.length < 10) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 && age <= 120 ? age : null;
}

/** Format YYYY-MM-DD as mm/dd/yyyy for display. */
export function formatDateOfBirth(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
