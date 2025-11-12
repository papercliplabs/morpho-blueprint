import type { ReactNode } from "react";

import { TooltipPopover, TooltipPopoverContent, TooltipPopoverTrigger } from "@/components/ui/tooltip-popover";
import { cn } from "@/utils/shadcn";

export type MetricProps = {
  label: ReactNode;
  children: ReactNode;
} & React.ComponentProps<"div">;

export type MetricWithTooltipProps = {
  tooltip: ReactNode;
} & MetricProps;

export function MetricWithTooltip({ label, children, tooltip, className, ...props }: MetricWithTooltipProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)} {...props}>
      <TooltipPopover>
        <TooltipPopoverTrigger className="w-fit max-w-full">
          <Metric label={label} className={className}>
            {children}
          </Metric>
        </TooltipPopoverTrigger>
        <TooltipPopoverContent>{tooltip}</TooltipPopoverContent>
      </TooltipPopover>
    </div>
  );
}

export function Metric({ label, children, className, ...props }: MetricProps) {
  return (
    <div className={cn("flex w-fit max-w-full flex-col gap-1 text-left text-foreground", className)} {...props}>
      <p className="body-small-plus w-fit whitespace-nowrap text-muted-foreground underline decoration-dashed underline-offset-3">
        {label}
      </p>
      {children}
    </div>
  );
}
