"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/** Intrinsic size of public/logo_college.png (icon + wordmark in one asset). */
const LOGO_COLLEGE_WIDTH = 3426;
const LOGO_COLLEGE_HEIGHT = 825;

type LogoWordmarkProps = {
  className?: string;
  /** Show only the left emblem; wordmark text in the PNG is clipped (still one file). */
  iconOnly?: boolean;
};

export function LogoWordmark({ className, iconOnly }: LogoWordmarkProps) {
  if (iconOnly) {
    return (
      <span
        className={cn(
          "relative inline-block shrink-0 overflow-hidden aspect-square",
          className
        )}
      >
        <Image
          src="/logo_college.png"
          alt=""
          width={LOGO_COLLEGE_WIDTH}
          height={LOGO_COLLEGE_HEIGHT}
          className="block h-full w-auto max-w-none select-none"
          priority
          aria-hidden
        />
      </span>
    );
  }

  return (
    <Image
      src="/logo_college.png"
      alt="MyCollegePath"
      width={LOGO_COLLEGE_WIDTH}
      height={LOGO_COLLEGE_HEIGHT}
      className={className}
      priority
    />
  );
}
