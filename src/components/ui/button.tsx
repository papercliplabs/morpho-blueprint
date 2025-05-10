"use client";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import * as React from "react";

import { cn } from "@/utils/shadcn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm select-none transition-all active:not-disabled:scale-98 disabled:opacity-50 shrink-0 outline-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:not-disabled:bg-primary/90 shadow",
        secondary: "bg-secondary text-secondary-foreground hover:not-disabled:bg-secondary/90",
        outline: "bg-card border hover:not-disabled:bg-accent",
        ghost: "bg-card hover:not-disabled:bg-accent",
        accent: "bg-accent hover:not-disabled:bg-accent/90",
        destructive: "bg-destructive text-primary-foreground hover:not-disabled:bg-destructive/90",
      },
      size: {
        lg: "body-large-plus px-4 h-12",
        default: "body-medium-plus px-3 h-10",
        sm: "body-medium-plus px-[10px] h-9",
        xs: "body-small-plus px-1 h-6",
      },
      icon: {
        false: null,
        true: "aspect-square p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = {
  asChild?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
} & React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

function Button({
  children,
  className,
  variant,
  icon,
  isLoading = false,
  loadingMessage = "Loading",
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp data-slot="button" className={cn(buttonVariants({ variant, size, icon, className }))} {...props}>
      {isLoading ? (
        <span className="flex items-center gap-1">
          <LoaderCircle className="size-[1.25em] animate-spin" />
          {loadingMessage}
        </span>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
