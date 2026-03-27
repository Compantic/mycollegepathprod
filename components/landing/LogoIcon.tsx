"use client";

/**
 * Logo icon: four vertical bars, progressively taller, blue + golden-yellow.
 */
export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect x="3" y="14" width="3" height="6" rx="1" fill="#2B5FD9" />
      <rect x="8" y="10" width="3" height="10" rx="1" fill="#2B5FD9" />
      <rect x="13" y="6" width="3" height="14" rx="1" fill="#EAB308" />
      <rect x="18" y="2" width="3" height="18" rx="1" fill="#EAB308" />
    </svg>
  );
}
