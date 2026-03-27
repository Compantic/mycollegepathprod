import { cn } from "@/lib/utils";

export interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Optional id for anchor / aria */
  id?: string;
  as?: "section" | "div";
  /** Use section-padding (responsive py-8–12, px-4–8) */
  withPadding?: boolean;
}

export function SectionContainer({
  children,
  className,
  id,
  as: Component = "section",
  withPadding = true,
}: SectionContainerProps) {
  return (
    <Component
      id={id}
      className={cn(
        "scroll-mt-6 max-w-6xl mx-auto w-full",
        withPadding && "section-padding",
        className
      )}
    >
      {children}
    </Component>
  );
}
