"use client";

import Image from "next/image";

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo_college.png"
      alt="MyCollegePath"
      width={320}
      height={64}
      className={className}
      priority
    />
  );
}
