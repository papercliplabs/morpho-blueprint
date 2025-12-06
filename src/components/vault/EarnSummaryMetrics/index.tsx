"use client";
import clsx from "clsx";
import type { ReactNode } from "react";

import { MetricWithTooltip } from "@/components/Metric";
import NumberFlow, { NumberFlowWithLoading } from "@/components/ui/number-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_CONFIG } from "@/config";
import type { VaultSummary } from "@/data/whisk/getVaultSummaries";
import { useEarnSummaryMetrics } from "@/hooks/useEarnSummaryMetrics";

interface EarnSummaryMetricsProps {
  vaultSummaries: VaultSummary[];
}

function MetricSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <Skeleton className={clsx("mt-[2px] h-[34px]", className)} {...props} />;
}

export function EarnSummaryMetrics({ vaultSummaries }: EarnSummaryMetricsProps) {
  const { data, isPositionsLoading } = useEarnSummaryMetrics({ vaultSummaries });

  return (
    <EarnSummaryMetricsLayout
      totalSupplied={<NumberFlow value={data.totalSuppliedUsd} format={{ currency: "USD" }} className="heading-4" />}
      userDeposited={
        <NumberFlowWithLoading
          isLoading={isPositionsLoading}
          value={data.userDepositsUsd}
          format={{ currency: "USD" }}
          className="heading-4"
          loadingContent={<MetricSkeleton className="w-[90px]" />}
        />
      }
      userEarnApy={
        <NumberFlowWithLoading
          isLoading={isPositionsLoading}
          value={data.userEarnApy}
          format={{ style: "percent" }}
          className="heading-4"
          loadingContent={<Skeleton className="mt-[2px] h-[28px] w-[84px]" />}
        />
      }
    />
  );
}

export function EarnSummaryMetricsSkeleton() {
  return (
    <EarnSummaryMetricsLayout
      totalSupplied={<MetricSkeleton className="w-[90px]" />}
      userDeposited={<MetricSkeleton className="w-[90px]" />}
      userEarnApy={<MetricSkeleton className="w-[84px]" />}
    />
  );
}

interface EarnSummaryMetricsLayoutProps {
  totalSupplied: ReactNode;

  userDeposited: ReactNode;
  userEarnApy: ReactNode;
}

function EarnSummaryMetricsLayout({ totalSupplied, userDeposited, userEarnApy }: EarnSummaryMetricsLayoutProps) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row">
      <div className="flex gap-8">
        <MetricWithTooltip
          className="flex-1"
          label="Total supplied"
          tooltip="Total supplied across all vaults within the table."
        >
          {totalSupplied}
        </MetricWithTooltip>
      </div>
      <div className="flex gap-8">
        <MetricWithTooltip
          label="Your deposits"
          tooltip="Sum of your deposits across all vaults in the table."
          className="flex-1 md:items-end"
        >
          {userDeposited}
        </MetricWithTooltip>
        <MetricWithTooltip
          label="Your earn APY"
          tooltip={`Your net earn APY across all vaults in the table. The native APY is from a ${APP_CONFIG.apyWindow} rolling average.`}
          className="flex-1 md:items-end"
        >
          {userEarnApy}
        </MetricWithTooltip>
      </div>
    </div>
  );
}
