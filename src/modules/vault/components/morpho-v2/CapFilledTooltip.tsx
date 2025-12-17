import PercentRing from "@/common/components/ui/icons/PercentRing";
import { TooltipPopover, TooltipPopoverContent, TooltipPopoverTrigger } from "@/common/components/ui/tooltip-popover";
import { formatNumber } from "@/common/utils/format";

interface PercentOfCapProps {
  capType: "absolute" | "relative";
  capValue: number;
  allocationValue: number;
}

export function CapFilledTooltip({ capType, capValue, allocationValue }: PercentOfCapProps) {
  const percentFilled = capValue > 0 ? allocationValue / capValue : 0;

  return (
    <TooltipPopover>
      <TooltipPopoverTrigger>
        <PercentRing percent={percentFilled} />
      </TooltipPopoverTrigger>
      <TooltipPopoverContent>
        <div>
          {capType === "absolute" ? "Absolute Cap" : "Relative Cap"}:{" "}
          {formatNumber(capValue, capType === "absolute" ? { currency: "USD" } : { style: "percent" })}
        </div>
        <div>Percent filled: {formatNumber(percentFilled, { style: "percent" })}</div>
      </TooltipPopoverContent>
    </TooltipPopover>
  );
}
