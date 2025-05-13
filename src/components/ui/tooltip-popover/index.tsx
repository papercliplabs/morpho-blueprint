"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useResponsiveContext } from "@/providers/ResponsiveProvider";

export function TooltipPopover({ children }: { children: React.ReactNode }) {
  const { isDesktop } = useResponsiveContext();

  return isDesktop ? (
    <TooltipProvider>
      <Tooltip>{children}</Tooltip>
    </TooltipProvider>
  ) : (
    <Popover>{children}</Popover>
  );
}

export function TooltipPopoverTrigger(props: React.ComponentProps<typeof TooltipTrigger>) {
  const { isDesktop } = useResponsiveContext();
  return isDesktop ? <TooltipTrigger type="button" {...props} /> : <PopoverTrigger type="button" {...props} />;
}

export function TooltipPopoverContent(props: React.ComponentProps<typeof TooltipContent>) {
  const { isDesktop } = useResponsiveContext();
  return isDesktop ? <TooltipContent {...props} /> : <PopoverContent {...props} />;
}
