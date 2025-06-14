"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/utils/shadcn";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none items-center py-3 select-none not-data-disabled:cursor-pointer data-disabled:opacity-50",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="bg-input relative h-1 w-full grow overflow-hidden rounded-full">
      <SliderPrimitive.Range className="bg-primary absolute h-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="bg-background focus-visible:ring-ring hover:not-data-disabled:ring-primary/50 block h-4 w-4 rounded-full shadow-md transition hover:not-data-disabled:ring-4 focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
