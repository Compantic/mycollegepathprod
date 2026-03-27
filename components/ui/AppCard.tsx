import { cn } from "@/lib/utils";

export interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article";
}

export function AppCard({
  as: Comp = "div",
  className,
  children,
  ...props
}: AppCardProps) {
  return (
    <Comp
      className={cn(
        "rounded-card bg-bg-card border border-bg-border shadow-soft",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
