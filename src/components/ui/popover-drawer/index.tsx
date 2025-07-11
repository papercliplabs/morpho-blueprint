"use client";

import { useState } from "react";

import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useResponsiveContext } from "@/providers/ResponsiveProvider";
import { cn } from "@/utils/shadcn";

type PopoverDrawerProps = React.ComponentProps<typeof Popover>;

function PopoverDrawer({ children, ...props }: PopoverDrawerProps) {
  const { isDesktop } = useResponsiveContext();
  const [isOpen, setIsOpen] = useState(false);

  return isDesktop ? (
    <Popover open={isOpen} onOpenChange={setIsOpen} {...props}>
      {children}
    </Popover>
  ) : (
    <Drawer open={isOpen} onOpenChange={setIsOpen} {...props}>
      {children}
    </Drawer>
  );
}

function PopoverDrawerTrigger({ className, ...props }: React.ComponentProps<typeof PopoverTrigger>) {
  const { isDesktop } = useResponsiveContext();
  return isDesktop ? (
    <PopoverTrigger type="button" className={cn("cursor-pointer", className)} {...props} />
  ) : (
    <DrawerTrigger type="button" className={className} {...props} />
  );
}

function PopoverDrawerContent(props: React.ComponentProps<typeof PopoverContent>) {
  const { isDesktop } = useResponsiveContext();
  return isDesktop ? <PopoverContent {...props} /> : <DrawerContent {...props} />;
}

export { PopoverDrawer, PopoverDrawerTrigger, PopoverDrawerContent };
export type { PopoverDrawerProps };
