"use client";
import { ReactNode } from "react";

import { Metric } from "@/components/Metric";
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
        <Metric label="Total borrowed">{totalBorrowed}</Metric>
      </div>
      <div className="flex gap-8">
        <Metric label="Your borrows" className="md:items-end">
          {userBorrowed}
        </Metric>
        <Metric label="Your borrow APY" className="md:items-end">
          {userBorrowApy}
        </Metric>
      </div>
    </div>
  );
}
