"use client";

import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordRevealFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  disabled?: boolean;
  show: boolean;
  onToggleShow: () => void;
  minLength?: number;
  /** If omitted, no helper line is rendered under the field. */
  helperText?: string;
  required?: boolean;
  /** Optional slot next to label (e.g. “Forgot password?”). */
  labelEnd?: ReactNode;
}

export function PasswordRevealField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  show,
  onToggleShow,
  minLength,
  helperText,
  required = true,
  labelEnd,
}: PasswordRevealFieldProps) {
  const hintId = `${id}-hint`;
  const hasHint = helperText != null && helperText !== "";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
          {label}
        </label>
        {labelEnd}
      </div>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          minLength={minLength}
          required={required}
          className={cn(
            "onboarding-input w-full pr-11",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
          aria-describedby={hasHint ? hintId : undefined}
        />
        <button
          type="button"
          onClick={onToggleShow}
          disabled={disabled}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-50"
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
        >
          {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
      {hasHint ? (
        <p id={hintId} className="text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
