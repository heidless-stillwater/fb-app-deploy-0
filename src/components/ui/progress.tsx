"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { asCircle?: boolean }
>(({ className, value, asCircle = false, ...props }, ref) => {
  if (asCircle) {
    const r = 40;
    const circ = 2 * Math.PI * r;
    const strokePct = ((100 - (value || 0)) * circ) / 100;
    return (
       <div className="relative h-20 w-20">
        <svg className="h-full w-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="transparent"
            stroke="hsl(var(--secondary))"
            strokeWidth="8px"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="transparent"
            stroke="hsl(var(--primary))"
            strokeWidth="8px"
            transform="rotate(-90 50 50)"
            strokeDasharray={circ}
            strokeDashoffset={strokePct}
            strokeLinecap="round"
           />
        </svg>
      </div>
    )
  }

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
