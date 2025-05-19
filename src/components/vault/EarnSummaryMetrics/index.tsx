"use client";
import { ReactNode } from "react";

import { Metric } from "@/components/Metric";
import NumberFlow from "@/components/ui/number-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { VaultSummary } from "@/data/whisk/getVaultSummaries";
import { useEarnSummaryMetrics } from "@/hooks/useEarnSummaryMetrics";

interface EarnSummaryMetricsProps {
  vaultSummaries: VaultSummary[];
}

const metricSkeleton = <Skeleton className="h-[36px] w-[70px]" />;

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
        <Metric label="Total supplied">{totalSupplied}</Metric>
        <Metric label="Total borrowed">{totalBorrowed}</Metric>
      </div>
      <div className="flex gap-8">
        <Metric label="Your deposits" className="md:items-end">
          {userDeposited}
        </Metric>
        <Metric label="Your earn APY" className="md:items-end">
          {userEarnApy}
        </Metric>
      </div>
    </div>
  );
}
