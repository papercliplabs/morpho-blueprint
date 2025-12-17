import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/common/utils/shadcn";

const inputVariants = cva(
  [
    "bg-card border-input flex w-full rounded-md border px-3 py-2 shadow transition",
    "focus:ring-primary focus-visible:ring-none focus:ring-2 focus:ring-offset-2 focus-visible:outline-none",
    "disabled:opacity-50",
  ],
  {
    variants: {
      variantSize: {
        default: "body-large",
        sm: "body-small",
      },
    },
    defaultVariants: {
      variantSize: "default",
    },
  },
);

type InputProps = React.ComponentProps<"input"> & VariantProps<typeof inputVariants>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, variantSize, type, ...props }, ref) => {
  return <input type={type} className={cn(inputVariants({ variantSize, className }))} ref={ref} {...props} />;
});
Input.displayName = "Input";

export { Input };
