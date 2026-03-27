import { cn } from "@/lib/utils";

export type GlassCardVariant = "default" | "amber" | "violet" | "emerald" | "sky" | "rose" | "indigo";

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
  variant?: GlassCardVariant;
}

/** Design system default: white glass + blur + border (E5EAF2) + shadow-soft */
const defaultGlass =
  "rounded-card border border-bg-border bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] shadow-soft transition-shadow duration-200 hover:shadow-glow";

const variantStyles: Record<GlassCardVariant, string> = {
  default: defaultGlass,
  amber: "rounded-card border border-amber-200/60 bg-amber-50/70 backdrop-blur-[var(--glass-blur)] shadow-soft border-l-4 border-l-amber-400",
  violet: "rounded-card border border-violet-200/60 bg-violet-50/70 backdrop-blur-[var(--glass-blur)] shadow-soft border-l-4 border-l-violet-400",
  emerald: "rounded-card border border-emerald-200/60 bg-emerald-50/70 backdrop-blur-[var(--glass-blur)] shadow-soft border-l-4 border-l-emerald-400",
  sky: "rounded-card border border-sky-200/60 bg-sky-50/70 backdrop-blur-[var(--glass-blur)] shadow-soft border-l-4 border-l-sky-400",
  rose: "rounded-card border border-rose-200/60 bg-rose-50/70 backdrop-blur-[var(--glass-blur)] shadow-soft border-l-4 border-l-rose-400",
  indigo: "rounded-card border border-indigo-200/60 bg-indigo-50/70 backdrop-blur-[var(--glass-blur)] shadow-soft border-l-4 border-l-indigo-400",
};

export function GlassCard({ children, className, as: Component = "div", variant = "default" }: GlassCardProps) {
  return (
    <Component className={cn(variantStyles[variant], "hover:shadow-glow", className)}>
      {children}
    </Component>
  );
}
