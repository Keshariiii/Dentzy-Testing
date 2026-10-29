import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ponytail: Lean shadcn/21st.dev badge matching Dentzy brand tokens
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary-dark",
        secondary: "border-border bg-accent text-accent-foreground hover:bg-muted",
        destructive:
          "border-transparent bg-[#dc2626] text-white hover:bg-[#b91c1c]",
        outline: "border-border text-foreground bg-card",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant = "default", style, ...props }) {
  const fallbackStyles =
    variant === "secondary"
      ? { backgroundColor: "var(--accent)", borderColor: "var(--border)", color: "var(--foreground)", ...style }
      : variant === "default"
      ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)", ...style }
      : style;

  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={fallbackStyles}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
