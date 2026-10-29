import * as React from "react";
import { cn } from "@/lib/utils";

// ponytail: 21st.dev empty state primitive with built-in Dentzy brand fallbacks
const Empty = React.forwardRef(({ className, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex min-h-[400px] flex-col items-center justify-center rounded-2xl p-6 text-center animate-in fade-in-50",
      className
    )}
    style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", ...style }}
    {...props}
  />
));
Empty.displayName = "Empty";

const EmptyHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex max-w-[540px] flex-col items-center gap-2", className)}
    {...props}
  />
));
EmptyHeader.displayName = "EmptyHeader";

const EmptyMedia = React.forwardRef(({ className, variant = "default", style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mb-4 flex items-center justify-center rounded-2xl",
      variant === "default" && "size-16 bg-accent border border-border text-foreground",
      className
    )}
    style={style}
    {...props}
  />
));
EmptyMedia.displayName = "EmptyMedia";

const EmptyTitle = React.forwardRef(({ className, style, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-2xl font-bold tracking-tight text-foreground", className)}
    style={{ color: "var(--foreground)", ...style }}
    {...props}
  />
));
EmptyTitle.displayName = "EmptyTitle";

const EmptyDescription = React.forwardRef(({ className, style, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed max-w-[420px]", className)}
    style={{ color: "var(--muted-foreground)", ...style }}
    {...props}
  />
));
EmptyDescription.displayName = "EmptyDescription";

const EmptyContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-6 flex flex-wrap items-center justify-center gap-3", className)}
    {...props}
  />
));
EmptyContent.displayName = "EmptyContent";

export {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
};
