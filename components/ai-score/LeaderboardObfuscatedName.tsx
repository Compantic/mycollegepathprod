"use client";

import { cn } from "@/lib/utils";

type LeaderboardObfuscatedNameProps = {
  displayName: string;
  isSelf: boolean;
  className?: string;
};

/** Shows the viewer's name clearly; other students' names are glass-blurred for privacy. */
export function LeaderboardObfuscatedName({ displayName, isSelf, className }: LeaderboardObfuscatedNameProps) {
  const name = displayName.trim() || "Student";

  if (isSelf) {
    return (
      <span className={cn("truncate", className)} title={name}>
        {name}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative inline-flex min-w-[5rem] max-w-full items-center overflow-hidden rounded-md px-0.5",
        className
      )}
      title="Anonymous student"
      aria-label="Anonymous student"
    >
      <span className="truncate blur-[6px] brightness-110 contrast-75 select-none" aria-hidden>
        {name}
      </span>
      <span
        className="pointer-events-none absolute inset-0 rounded-md bg-gradient-to-r from-white/45 via-white/75 to-white/45 backdrop-blur-md ring-1 ring-white/60"
        aria-hidden
      />
    </span>
  );
}
