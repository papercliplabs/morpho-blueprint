import { ReactNode } from "react";

import { MetricWithTooltip } from "@/components/Metric";
import { ApyTooltipContent, ApyTooltipTrigger } from "@/components/Tooltips/ApyToolip";
import { AvailableLiquidityTooltipContent } from "@/components/Tooltips/AvailableLiquidityTooltip";
import NumberFlow from "@/components/ui/number-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { Market } from "@/data/whisk/getMarket";

interface MarketKeyMetricsProps {
  market: Market;
}

export function MarketKeyMetrics({ market }: MarketKeyMetricsProps) {
  return (
    <MarketKeyMetricsLayout
      totalSupplyValue={<NumberFlow value={market.supplyAssetsUsd ?? 0} format={{ currency: "USD" }} />}
      availableToBorrowValue={
        <NumberFlow
          value={market.liquidityAssetsUsd + market.publicAllocatorSharedLiquidityAssetsUsd}
          format={{ currency: "USD" }}
        />
      }
      availableToBorrowTooltip={
        <AvailableLiquidityTooltipContent
          marketLiquidity={market.liquidityAssetsUsd}
          publicAllocatorLiquidity={market.publicAllocatorSharedLiquidityAssetsUsd}
        />
      }
      borrowApyValue={
        <ApyTooltipTrigger totalApy={market.borrowApy.total} showSparkle={market.borrowApy.rewards.length > 0} />
      }
      borrowApyTooltip={
        <ApyTooltipContent
          type="borrow"
          nativeApy={market.borrowApy.base}
          totalApy={market.borrowApy.total}
          rewards={market.borrowApy.rewards}
        />
      }
    />
  );
}

export function MarketKeyMetricsSkeleton() {
  const metricSkeleton = <Skeleton className="h-[32px] w-[140px]" />;
  return (
    <MarketKeyMetricsLayout
      totalSupplyValue={metricSkeleton}
      availableToBorrowValue={metricSkeleton}
      availableToBorrowTooltip={metricSkeleton}
      borrowApyValue={metricSkeleton}
      borrowApyTooltip={metricSkeleton}
    />
  );
}

interface MarketKeyMetricsLayoutProps {
  totalSupplyValue: ReactNode;
  availableToBorrowValue: ReactNode;
  availableToBorrowTooltip: ReactNode;
  borrowApyValue: ReactNode;
  borrowApyTooltip: ReactNode;
}

function MarketKeyMetricsLayout({
  totalSupplyValue,
  availableToBorrowValue,
  availableToBorrowTooltip,
  borrowApyValue,
  borrowApyTooltip,
}: MarketKeyMetricsLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <MetricWithTooltip
        label="Total Supply"
        className="heading-4"
        tooltip="The total amount of loan assets supplied to this market."
      >
        {totalSupplyValue}
      </MetricWithTooltip>
      <MetricWithTooltip label="Available to Borrow" className="heading-4" tooltip={availableToBorrowTooltip}>
        {availableToBorrowValue}
      </MetricWithTooltip>
      <MetricWithTooltip label="Borrow APY" className="heading-4" tooltip={borrowApyTooltip}>
        {borrowApyValue}
      </MetricWithTooltip>
    </div>
  );
}
