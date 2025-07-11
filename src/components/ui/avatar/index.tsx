"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/shadcn";

const AvatarRoot = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
AvatarRoot.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full", className)} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full text-background", className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

const avatarVariants = cva("transition-colors", {
  variants: {
    size: {
      xl: "w-12 h-12 body-large",
      lg: "w-10 h-10 body-large",
      md: "w-8 h-8",
      sm: "w-6 h-6 body-small",
      xs: "w-4 h-4 text-[8px] leading-[8px]",
      "2xs": "w-3 h-3 text-[6px] leading-[6px]",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

type AvatarProps = {
  src?: string | Blob | null;
  alt?: string;
  sub?: React.ReactNode;
} & VariantProps<typeof avatarVariants> &
  React.ComponentProps<"span">;

function Avatar({ className, src, alt, sub, size }: AvatarProps) {
  return (
    <span className="relative flex h-fit w-fit">
      <AvatarRoot className={cn(avatarVariants({ className, size }))}>
        <AvatarImage src={src ?? undefined} alt={alt} />
        <AvatarFallback className="bg-card">
          <Skeleton className="h-full w-full" />
        </AvatarFallback>
      </AvatarRoot>
      {!!sub && (
        <span className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 items-center justify-center overflow-hidden">
          {sub}
        </span>
      )}
    </span>
  );
}

export { Avatar };
export type { AvatarProps };
