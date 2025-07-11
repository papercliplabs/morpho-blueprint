import { Metric } from "@/components/Metric";
import { TooltipPopover, TooltipPopoverContent, TooltipPopoverTrigger } from "@/components/ui/tooltip-popover";
import { formatNumber } from "@/utils/format";

type AvailableLiquidityTooltipContentProps = {
  marketLiquidity: number;
  publicAllocatorLiquidity: number;
};

function AvailableLiquidityTooltipContent({
  marketLiquidity,
  publicAllocatorLiquidity,
}: AvailableLiquidityTooltipContentProps) {
  return (
    <div className="body-small flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <span className="body-medium-plus">Market Liquidity</span>
        <span>
          The total amount of assets available for borrowing, including liquidity that can be reallocated from other
          markets through the public allocator.
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <span className="flex justify-between">
          <span>Liquidity In Market</span>
          <span className="body-small-plus">{formatNumber(marketLiquidity, { currency: "USD" })}</span>
        </span>
        <span className="flex justify-between">
          <span>Liquidity via Public Allocator</span>
          <span className="body-small-plus">{formatNumber(publicAllocatorLiquidity, { currency: "USD" })}</span>
        </span>
      </div>
      <div className="h-[1px] bg-border" />
      <span className="flex justify-between">
        <span>Total Available Liquidity</span>
        <span className="body-small-plus">
          {formatNumber(marketLiquidity + publicAllocatorLiquidity, { currency: "USD" })}
        </span>
      </span>
    </div>
  );
}

type AvailableLiquidityTooltipProps = AvailableLiquidityTooltipContentProps;

function AvailableLiquidityTooltip({ marketLiquidity, publicAllocatorLiquidity }: AvailableLiquidityTooltipProps) {
  return (
    <TooltipPopover>
      <TooltipPopoverTrigger>
        <Metric label="Available Liquidity">
          <h4>{formatNumber(marketLiquidity + publicAllocatorLiquidity, { currency: "USD" })}</h4>
        </Metric>
      </TooltipPopoverTrigger>
      <TooltipPopoverContent>
        <AvailableLiquidityTooltipContent
          marketLiquidity={marketLiquidity}
          publicAllocatorLiquidity={publicAllocatorLiquidity}
        />
      </TooltipPopoverContent>
    </TooltipPopover>
  );
}

export { AvailableLiquidityTooltip, AvailableLiquidityTooltipContent };
