import { ReactNode } from "react";

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
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <TooltipPopover>
        <TooltipPopoverTrigger className="w-fit">
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
    <div className={cn("text-foreground flex w-fit flex-col gap-1 text-left", className)} {...props}>
      <p className="body-small-plus text-muted-foreground w-fit whitespace-nowrap underline decoration-dashed underline-offset-3">
        {label}
      </p>
      {children}
    </div>
  );
}
