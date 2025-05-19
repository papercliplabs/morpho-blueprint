"use client";
import { ReactNode } from "react";

import { MarketSummary } from "@/data/whisk/getMarketSummaries";
import { useBorrowSummaryMetrics } from "@/hooks/useBorrowSummaryMetrics";

import { Metric } from "../Metric";
import NumberFlow from "../ui/number-flow";
import { Skeleton } from "../ui/skeleton";

interface BorrowSummaryMetricsProps {
  marketSummaries: MarketSummary[];
}

const metricSkeleton = <Skeleton className="h-[36px] w-[70px]" />;

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
