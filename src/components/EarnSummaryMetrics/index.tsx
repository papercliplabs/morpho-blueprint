"use client";
import { ReactNode } from "react";

import { VaultSummary } from "@/data/whisk/getVaultSummaries";
import { useEarnSummaryMetrics } from "@/hooks/useEarnSummaryMetrics";

import { Metric } from "../Metric";
import NumberFlow from "../ui/number-flow";
import { Skeleton } from "../ui/skeleton";

interface EarnSummaryMetricsProps {
  vaultSummaries: VaultSummary[];
}

const metricSkeleton = <Skeleton className="h-[36px] w-[70px]" />;

export function EarnSummaryMetrics({ vaultSummaries }: EarnSummaryMetricsProps) {
  const { data } = useEarnSummaryMetrics({ vaultSummaries });

  return (
    <EarnSummaryMetricsLayout
      totalSupply={<NumberFlow value={data.totalSuppliedUsd} format={{ currency: "USD" }} className="heading-5" />}
      totalBorrow={<NumberFlow value={data.totalBorrowedUsd} format={{ currency: "USD" }} className="heading-5" />}
      userDeposits={<NumberFlow value={data.userDepositsUsd} format={{ currency: "USD" }} className="heading-5" />}
      userEarnApy={<NumberFlow value={data.userEarnApy} format={{ style: "percent" }} className="heading-5" />}
    />
  );
}

export function EarnSummaryMetricsSkeleton() {
  return (
    <EarnSummaryMetricsLayout
      totalSupply={metricSkeleton}
      totalBorrow={metricSkeleton}
      userDeposits={metricSkeleton}
      userEarnApy={metricSkeleton}
    />
  );
}

interface EarnSummaryMetricsLayoutProps {
  totalSupply: ReactNode;
  totalBorrow: ReactNode;

  userDeposits: ReactNode;
  userEarnApy: ReactNode;
}

function EarnSummaryMetricsLayout({
  totalSupply,
  totalBorrow,
  userDeposits,
  userEarnApy,
}: EarnSummaryMetricsLayoutProps) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row">
      <div className="flex gap-8">
        <Metric label="Total supplied">{totalSupply}</Metric>
        <Metric label="Total borrowed">{totalBorrow}</Metric>
      </div>
      <div className="flex gap-8">
        <Metric label="Your deposits" className="md:items-end">
          {userDeposits}
        </Metric>
        <Metric label="Your earn APY" className="md:items-end">
          {userEarnApy}
        </Metric>
      </div>
    </div>
  );
}
