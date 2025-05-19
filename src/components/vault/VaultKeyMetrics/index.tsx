import { ReactNode } from "react";

import { MetricWithTooltip } from "@/components/Metric";
import { ApyTooltipContent, ApyTooltipTrigger } from "@/components/Tooltips/ApyToolip";
import NumberFlow from "@/components/ui/number-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { Vault } from "@/data/whisk/getVault";

interface VaultKeyMetricsProps {
  vault: Vault;
}

export function VaultKeyMetrics({ vault }: VaultKeyMetricsProps) {
  return (
    <VaultKeyMetricsLayout
      totalDepositsValue={<NumberFlow value={vault.liquidityAssetsUsd} format={{ currency: "USD" }} />}
      availableLiquidityValue={<NumberFlow value={vault.liquidityAssetsUsd} format={{ currency: "USD" }} />}
      supplyApyValue={
        <ApyTooltipTrigger totalApy={vault.supplyApy.total} showSparkle={vault.supplyApy.rewards.length > 0} />
      }
      supplyApyTooltip={
        <ApyTooltipContent
          type="earn"
          nativeApy={vault.supplyApy.base}
          totalApy={vault.supplyApy.total}
          rewards={vault.supplyApy.rewards}
        />
      }
    />
  );
}

export function VaultKeyMetricsSkeleton() {
  const metricSkeleton = <Skeleton className="h-[32px] w-[140px]" />;
  return (
    <VaultKeyMetricsLayout
      totalDepositsValue={metricSkeleton}
      availableLiquidityValue={metricSkeleton}
      supplyApyValue={metricSkeleton}
      supplyApyTooltip={metricSkeleton}
    />
  );
}

interface VaultKeyMetricsLayoutProps {
  totalDepositsValue: ReactNode;
  availableLiquidityValue: ReactNode;
  supplyApyValue: ReactNode;
  supplyApyTooltip: ReactNode;
}

function VaultKeyMetricsLayout({
  totalDepositsValue,
  availableLiquidityValue,
  supplyApyValue,
  supplyApyTooltip,
}: VaultKeyMetricsLayoutProps) {
  return (
    <div className="flex gap-6">
      <MetricWithTooltip label="Total deposits" className="heading-4 flex-1" tooltip="TODO">
        {totalDepositsValue}
      </MetricWithTooltip>
      <MetricWithTooltip label="Available liquidity" className="heading-4 flex-1" tooltip="TODO">
        {availableLiquidityValue}
      </MetricWithTooltip>
      <MetricWithTooltip label="Supply APY" className="heading-4 flex-1" tooltip={supplyApyTooltip}>
        {supplyApyValue}
      </MetricWithTooltip>
    </div>
  );
}
