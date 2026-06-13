/**
 * Client-side helpers for onboarding (display only).
 * Age is computed from birth year; do not store age as source of truth.
 */

export function birthYearFromDraft(d: { birthYear?: number; dateOfBirth?: string }): number | null {
  if (d.birthYear != null && d.birthYear >= 1900 && d.birthYear <= new Date().getFullYear()) {
    return d.birthYear;
  }
  const raw = (d.dateOfBirth ?? "").trim();
  if (!raw) return null;
  if (/^\d{4}$/.test(raw)) return Number(raw);
  if (raw.length >= 4) {
    const y = Number(raw.slice(0, 4));
    if (y >= 1900 && y <= new Date().getFullYear()) return y;
  }
  return null;
}

/** Approximate age from birth year (year-only; no month/day). */
export function ageFromBirthYear(year: number): number | null {
  const age = new Date().getFullYear() - year;
  return age >= 0 && age <= 120 ? age : null;
}

/** @deprecated Legacy ISO dates; prefer birthYear. */
export function ageFromDateOfBirth(dateStr: string): number | null {
  const y = birthYearFromDraft({ dateOfBirth: dateStr });
  return y != null ? ageFromBirthYear(y) : null;
}

export function formatBirthYear(year: number): string {
  return String(year);
}

/** @deprecated Legacy ISO dates; prefer formatBirthYear. */
export function formatDateOfBirth(dateStr: string): string {
  const y = birthYearFromDraft({ dateOfBirth: dateStr });
  if (y != null) return formatBirthYear(y);
  if (!dateStr || dateStr.length < 10) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
