import * as React from "react";

import { cn } from "@/utils/shadcn";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-md bg-transparent px-0 py-1 transition-colors",
          "focus-visible:ring-none disabled:text-foreground-disabled focus-visible:outline-none disabled:cursor-not-allowed",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
