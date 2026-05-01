import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

function getEnglishValidationMessage(input: HTMLInputElement): string {
  const { validity } = input;
  const label = (input.getAttribute("aria-label") || input.name || input.placeholder || "This field").trim();

  if (validity.valueMissing) return `${label} is required.`;
  if (validity.typeMismatch) {
    if (input.type === "email") return "Please enter a valid email address.";
    if (input.type === "url") return "Please enter a valid URL.";
    return "Please enter a valid value.";
  }
  if (validity.rangeUnderflow) {
    const min = input.min || "the minimum";
    return `Value must be greater than or equal to ${min}.`;
  }
  if (validity.rangeOverflow) {
    const max = input.max || "the maximum";
    return `Value must be less than or equal to ${max}.`;
  }
  if (validity.stepMismatch) return "Please enter a valid increment.";
  if (validity.tooShort) return `Please lengthen this text to at least ${input.minLength} characters.`;
  if (validity.tooLong) return `Please shorten this text to no more than ${input.maxLength} characters.`;
  if (validity.patternMismatch) return "Please match the requested format.";
  if (validity.badInput) return "Please enter a valid number.";
  return "Please enter a valid value.";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onInvalid, onInput, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-button border border-bg-border bg-bg-main px-4 py-2 text-[#0F172A] placeholder:text-[#94A3B8] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        ref={ref}
        onInvalid={(event) => {
          const input = event.currentTarget;
          input.setCustomValidity(getEnglishValidationMessage(input));
          onInvalid?.(event);
        }}
        onInput={(event) => {
          event.currentTarget.setCustomValidity("");
          onInput?.(event);
        }}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
