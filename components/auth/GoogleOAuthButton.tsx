"use client";

import { GoogleGLogo } from "@/components/icons/GoogleGLogo";
import { cn } from "@/lib/utils";

export interface GoogleOAuthButtonProps {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  pending?: boolean;
  pendingLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

export function GoogleOAuthButton({
  onClick,
  disabled,
  pending,
  pendingLabel = "Please wait…",
  className,
  children = "Continue with Google",
}: GoogleOAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      className={cn(
        "flex w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white py-3.5 pl-4 pr-5 text-[15px] font-semibold text-slate-800 shadow-sm",
        "transition-all duration-200 hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/20",
        "disabled:pointer-events-none disabled:opacity-55",
        className
      )}
    >
      <GoogleGLogo className="h-5 w-5 shrink-0" />
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}
