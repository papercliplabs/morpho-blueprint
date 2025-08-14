import type { ReactNode } from "react";

import { MetricWithTooltip } from "@/components/Metric";
import { ApyTooltipContent, ApyTooltipTrigger } from "@/components/Tooltips/ApyToolip";
import NumberFlow from "@/components/ui/number-flow";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vault } from "@/data/whisk/getVault";
import { extractVaultSupplyApy } from "@/utils/vault";

interface VaultKeyMetricsProps {
  vault: Vault;
}

export function VaultKeyMetrics({ vault }: VaultKeyMetricsProps) {
  const supplyApy = extractVaultSupplyApy(vault);
  return (
    <VaultKeyMetricsLayout
      totalDepositsValue={<NumberFlow value={vault.totalSupplied.usd ?? 0} format={{ currency: "USD" }} />}
      availableLiquidityValue={<NumberFlow value={vault.totalLiquidity.usd ?? 0} format={{ currency: "USD" }} />}
      supplyApyValue={<ApyTooltipTrigger totalApy={supplyApy.total} showSparkle={supplyApy.rewards.length > 0} />}
      supplyApyTooltip={
        <ApyTooltipContent
          type="earn"
          nativeApy={supplyApy.base}
          totalApy={supplyApy.total}
          performanceFee={supplyApy.fee}
          rewards={supplyApy.rewards}
        />
      }
    />
  );
}

export function VaultKeyMetricsSkeleton() {
  const metricSkeleton = <Skeleton className="mt-0.5 h-[34px] w-[140px]" />;
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
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
      <MetricWithTooltip
        label="Total deposits"
        className="heading-4"
        tooltip="The total amount of assets currently deposited in the vault."
      >
        {totalDepositsValue}
      </MetricWithTooltip>
      <MetricWithTooltip
        label="Available liquidity"
        className="heading-4"
        tooltip="The available assets that are not currently bring borrowed."
      >
        {availableLiquidityValue}
      </MetricWithTooltip>
      <MetricWithTooltip label="Supply APY" className="heading-4" tooltip={supplyApyTooltip}>
        {supplyApyValue}
      </MetricWithTooltip>
    </div>
  );
}
