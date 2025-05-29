"use client";
import { ReactNode } from "react";

import { MetricWithTooltip } from "@/components/Metric";
import NumberFlow from "@/components/ui/number-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketSummary } from "@/data/whisk/getMarketSummaries";
import { useBorrowSummaryMetrics } from "@/hooks/useBorrowSummaryMetrics";

interface BorrowSummaryMetricsProps {
  marketSummaries: MarketSummary[];
}

const metricSkeleton = <Skeleton className="mt-[2px] h-[28px] w-[90px]" />;

export function BorrowSummaryMetrics({ marketSummaries }: BorrowSummaryMetricsProps) {
  const { data } = useBorrowSummaryMetrics({ marketSummaries });

  return (
    <BorrowSummaryMetricsLayout
      totalBorrowed={<NumberFlow value={data.totalBorrowedUsd} format={{ currency: "USD" }} className="heading-5" />}
      userBorrowed={<NumberFlow value={data.userBorrowsUsd} format={{ currency: "USD" }} className="heading-5" />}
      userBorrowApy={<NumberFlow value={data.userBorrowApy} format={{ style: "percent" }} className="heading-5" />}
    />
  );
}

export function BorrowSummaryMetricsSkeleton() {
  return (
    <BorrowSummaryMetricsLayout
      totalBorrowed={metricSkeleton}
      userBorrowed={metricSkeleton}
      userBorrowApy={metricSkeleton}
    />
  );
}

interface BorrowSummaryMetricsLayoutProps {
  totalBorrowed: ReactNode;

  userBorrowed: ReactNode;
  userBorrowApy: ReactNode;
}

function BorrowSummaryMetricsLayout({
  totalBorrowed,

  userBorrowed,
  userBorrowApy,
}: BorrowSummaryMetricsLayoutProps) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row">
      <div className="flex gap-8">
        <MetricWithTooltip
          className="flex-1"
          label="Total borrowed"
          tooltip="The total amount of loan assets borrowed from all markets in the table."
        >
          {totalBorrowed}
        </MetricWithTooltip>
      </div>
      <div className="flex gap-8">
        <MetricWithTooltip
          label="Your borrows"
          tooltip="Sum of your borrows across all markets in the table."
          className="flex-1 md:items-end"
        >
          {userBorrowed}
        </MetricWithTooltip>
        <MetricWithTooltip
          label="Your borrow APY"
          tooltip="Your net borrow APY across all markets in the table."
          className="flex-1 md:items-end"
        >
          {userBorrowApy}
        </MetricWithTooltip>
      </div>
    </div>
  );
}
