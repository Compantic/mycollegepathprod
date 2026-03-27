import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white",
        secondary: "bg-secondary-100 text-text-primary",
        outline: "border border-bg-border bg-transparent text-text-secondary",
        success: "bg-status-successBg text-status-successText",
        danger: "bg-status-dangerBg text-status-dangerText",
        warning: "bg-status-warningBg text-status-warningText",
        muted: "bg-secondary-200 text-text-muted",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
