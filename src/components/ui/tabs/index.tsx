"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/utils/shadcn";

type Variant = "default" | "underline" | "filled";

const TabVariantContext = React.createContext<Variant>("default");

export const useTabVariantContext = () => {
  const context = React.useContext(TabVariantContext);
  if (context === undefined) {
    throw new Error("useTabVariantContext must be used within a Tabs component");
  }
  return context;
};

type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root> & { variant: Variant };

function Tabs({ className, variant = "default", ...props }: TabsProps) {
  return (
    <TabVariantContext.Provider value={variant}>
      <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />
    </TabVariantContext.Provider>
  );
}

const tabsListVariants = cva("flex items-center", {
  variants: {
    variant: {
      default: "bg-muted rounded-md p-1",
      underline: "bg-transparent",
      filled: "bg-background gap-0.5",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  const variant = useTabVariantContext();
  return <TabsPrimitive.List data-slot="tabs-list" className={tabsListVariants({ className, variant })} {...props} />;
}

const tabsTriggerVariants = cva(
  "flex h-8 flex-grow items-center justify-center transition cursor-pointer disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "data-[state=active]:bg-card data-[state=active]:body-medium-plus body-medium text-foreground bg-transparent rounded-sm data-[state=active]:shadow px-4",
        underline:
          "bg-transparent border-b-2 border-transparent hover:border-muted-foreground hover:bg-accent px-3 data-[state=active]:border-primary data-[state=active]:text-primary",
        filled:
          "bg-background rounded-sm hover:bg-accent px-4 body-medium data-[state=active]:body-medium-plus data-[state=active]:bg-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = useTabVariantContext();
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={tabsTriggerVariants({ className, variant })}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
