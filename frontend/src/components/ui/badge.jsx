import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ponytail: Lean shadcn/21st.dev badge matching Dentzy brand tokens
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#1e5038] text-white hover:bg-[#143525]",
        secondary:
          "border-[#c5ddd3] bg-[#eef6f2] text-[#1e5038] hover:bg-[#e2f0e9]",
        destructive:
          "border-transparent bg-[#dc2626] text-white hover:bg-[#b91c1c]",
        outline:
          "border-[#e0ebe5] text-[#1e2824] bg-white",
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
      ? { backgroundColor: "#eef6f2", borderColor: "#c5ddd3", color: "#1e5038", ...style }
      : variant === "default"
      ? { backgroundColor: "#1e5038", color: "#ffffff", ...style }
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
