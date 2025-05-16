import PercentRing from "@/components/ui/icons/PercentRing";
import { TooltipPopover, TooltipPopoverContent, TooltipPopoverTrigger } from "@/components/ui/tooltip-popover";
import { formatNumber } from "@/utils/format";

type TotalSupplyTooltipSharedProps = {
  totalSupply: number;
  supplyCap: number;
};

type TotalSupplyTooltipTriggerProps = {
  iconPosition?: "left" | "right";
} & TotalSupplyTooltipSharedProps;

function TotalSupplyTooltipTrigger({ iconPosition = "right", totalSupply, supplyCap }: TotalSupplyTooltipTriggerProps) {
  const usage = supplyCap ? totalSupply / supplyCap : 0;

  return (
    <span className="flex items-center gap-1">
      {iconPosition === "left" && <PercentRing percent={usage} />}
      {formatNumber(totalSupply, { currency: "USD" })}
      {iconPosition === "right" && <PercentRing percent={usage} />}
    </span>
  );
}

type TotalSupplyTooltipContentProps = TotalSupplyTooltipSharedProps;

function TotalSupplyTooltipContent({ supplyCap, totalSupply }: TotalSupplyTooltipContentProps) {
  const usage = supplyCap ? totalSupply / supplyCap : 0;
  const remainingCapacity = supplyCap ? supplyCap - totalSupply : Infinity;

  return (
    <div className="body-small flex w-[300px] flex-col gap-4">
      <div className="flex flex-col gap-3">
        <span className="body-medium-plus flex items-center gap-2">
          <span>Total Supply &bull; Usage: {formatNumber(usage, { style: "percent" })}</span>
          <PercentRing percent={usage} />
        </span>
        <span>To mitigate risk, vault curators can set a market supply cap.</span>
      </div>
      <span className="flex flex-col gap-2">
        <span className="flex justify-between">
          <span>Supply Cap</span>
          <span>{formatNumber(supplyCap, { currency: "USD" })}</span>
        </span>
        <span className="flex justify-between">
          <span>Total Supplied</span>
          <span>{formatNumber(totalSupply, { currency: "USD" })}</span>
        </span>
      </span>
      <div className="bg-border h-[1px]" />
      <span className="flex justify-between">
        <span>Remaining Capacity</span>
        <span>{formatNumber(remainingCapacity, { currency: "USD" })}</span>
      </span>
    </div>
  );
}

type TotalSupplyTooltipProps = TotalSupplyTooltipTriggerProps & TotalSupplyTooltipContentProps;

function TotalSupplyTooltip({ iconPosition, totalSupply, supplyCap }: TotalSupplyTooltipProps) {
  return (
    <TooltipPopover>
      <TooltipPopoverTrigger>
        <TotalSupplyTooltipTrigger iconPosition={iconPosition} totalSupply={totalSupply} supplyCap={supplyCap} />
      </TooltipPopoverTrigger>
      <TooltipPopoverContent>
        <TotalSupplyTooltipContent totalSupply={totalSupply} supplyCap={supplyCap} />
      </TooltipPopoverContent>
    </TooltipPopover>
  );
}

export { TotalSupplyTooltip, TotalSupplyTooltipTrigger, TotalSupplyTooltipContent };
