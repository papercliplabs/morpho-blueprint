"use client";
import { ReactNode } from "react";

import { MetricWithTooltip } from "@/components/Metric";
import NumberFlow from "@/components/ui/number-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { VaultSummary } from "@/data/whisk/getVaultSummaries";
import { useEarnSummaryMetrics } from "@/hooks/useEarnSummaryMetrics";

interface EarnSummaryMetricsProps {
  vaultSummaries: VaultSummary[];
}

const metricSkeleton = <Skeleton className="mt-[2px] h-[28px] w-[90px]" />;

export function EarnSummaryMetrics({ vaultSummaries }: EarnSummaryMetricsProps) {
  const { data } = useEarnSummaryMetrics({ vaultSummaries });

  return (
    <EarnSummaryMetricsLayout
      totalSupplied={<NumberFlow value={data.totalSuppliedUsd} format={{ currency: "USD" }} className="heading-5" />}
      totalBorrowed={<NumberFlow value={data.totalBorrowedUsd} format={{ currency: "USD" }} className="heading-5" />}
      userDeposited={<NumberFlow value={data.userDepositsUsd} format={{ currency: "USD" }} className="heading-5" />}
      userEarnApy={<NumberFlow value={data.userEarnApy} format={{ style: "percent" }} className="heading-5" />}
    />
  );
}

export function EarnSummaryMetricsSkeleton() {
  return (
    <EarnSummaryMetricsLayout
      totalSupplied={metricSkeleton}
      totalBorrowed={metricSkeleton}
      userDeposited={metricSkeleton}
      userEarnApy={metricSkeleton}
    />
  );
}

interface EarnSummaryMetricsLayoutProps {
  totalSupplied: ReactNode;
  totalBorrowed: ReactNode;

  userDeposited: ReactNode;
  userEarnApy: ReactNode;
}

function EarnSummaryMetricsLayout({
  totalSupplied,
  totalBorrowed,
  userDeposited,
  userEarnApy,
}: EarnSummaryMetricsLayoutProps) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row">
      <div className="flex gap-8">
        <MetricWithTooltip label="Total supplied" tooltip="Total supplied across all vaults within the table.">
          {totalSupplied}
        </MetricWithTooltip>
        <MetricWithTooltip label="Total borrowed" tooltip="Total borrowed across all vaults within the table.">
          {totalBorrowed}
        </MetricWithTooltip>
      </div>
      <div className="flex gap-8">
        <MetricWithTooltip
          label="Your deposits"
          tooltip="Your deposits across all vaults within the table."
          className="md:items-end"
        >
          {userDeposited}
        </MetricWithTooltip>
        <MetricWithTooltip
          label="Your earn APY"
          tooltip="Your net earn APY across all vaults within the table."
          className="md:items-end"
        >
          {userEarnApy}
        </MetricWithTooltip>
      </div>
    </div>
  );
}
