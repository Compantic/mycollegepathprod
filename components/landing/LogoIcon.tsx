"use client";

export function LogoIcon({ className }: { className?: string }) {
  return (
    <img
      src="/icon.png"
      alt=""
      width={32}
      height={32}
      className={className}
      aria-hidden
    />
  );
}
