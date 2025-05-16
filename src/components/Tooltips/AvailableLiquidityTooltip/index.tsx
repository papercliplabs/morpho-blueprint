import { Metric } from "@/components/Metric";
import { TooltipPopover, TooltipPopoverContent, TooltipPopoverTrigger } from "@/components/ui/tooltip-popover";
import { formatNumber } from "@/utils/format";

type AvailableLiquidityTooltipContentProps = {
  marketLiquidity: number;
  publicAllocatorLiquidity: number;
  totalLiquidity: number;
};

function AvailableLiquidityTooltipContent({
  marketLiquidity,
  publicAllocatorLiquidity,
  totalLiquidity,
}: AvailableLiquidityTooltipContentProps) {
  return (
    <div className="body-small flex w-[300px] flex-col gap-4">
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
      <div className="bg-border h-[1px]" />
      <span className="flex justify-between">
        <span>Total Available Liquidity</span>
        <span className="body-small-plus">{formatNumber(totalLiquidity, { currency: "USD" })}</span>
      </span>
    </div>
  );
}

type AvailableLiquidityTooltipProps = AvailableLiquidityTooltipContentProps;

function AvailableLiquidityTooltip({
  marketLiquidity,
  publicAllocatorLiquidity,
  totalLiquidity,
}: AvailableLiquidityTooltipProps) {
  return (
    <TooltipPopover>
      <TooltipPopoverTrigger>
        <Metric label="Available Liquidity">
          <h4>{formatNumber(totalLiquidity, { currency: "USD" })}</h4>
        </Metric>
      </TooltipPopoverTrigger>
      <TooltipPopoverContent>
        <AvailableLiquidityTooltipContent
          marketLiquidity={marketLiquidity}
          publicAllocatorLiquidity={publicAllocatorLiquidity}
          totalLiquidity={totalLiquidity}
        />
      </TooltipPopoverContent>
    </TooltipPopover>
  );
}

export { AvailableLiquidityTooltip, AvailableLiquidityTooltipContent };
