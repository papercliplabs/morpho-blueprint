"use client";
import clsx from "clsx";
import { ReactNode } from "react";

import { MetricWithTooltip } from "@/components/Metric";
import { NumberFlowWithLoading } from "@/components/ui/number-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketSummary } from "@/data/whisk/getMarketSummaries";
import { useBorrowSummaryMetrics } from "@/hooks/useBorrowSummaryMetrics";

interface BorrowSummaryMetricsProps {
  marketSummaries: MarketSummary[];
}

function MetricSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <Skeleton className={clsx("mt-[2px] h-[28px]", className)} {...props} />;
}

export function BorrowSummaryMetrics({ marketSummaries }: BorrowSummaryMetricsProps) {
  const { data, isPositionsLoading } = useBorrowSummaryMetrics({ marketSummaries });

  return (
    <BorrowSummaryMetricsLayout
      totalBorrowed={
        <NumberFlowWithLoading
          isLoading={isPositionsLoading}
          loadingContent={<MetricSkeleton className="w-[90px]" />}
          value={data.totalBorrowedUsd}
          format={{ currency: "USD" }}
          className="heading-5"
        />
      }
      userBorrowed={
        <NumberFlowWithLoading
          isLoading={isPositionsLoading}
          loadingContent={<MetricSkeleton className="w-[90px]" />}
          value={data.userBorrowsUsd}
          format={{ currency: "USD" }}
          className="heading-5"
        />
      }
      userBorrowApy={
        <NumberFlowWithLoading
          isLoading={isPositionsLoading}
          loadingContent={<MetricSkeleton className="w-[90px]" />}
          value={data.userBorrowApy}
          format={{ style: "percent" }}
          className="heading-5"
        />
      }
    />
  );
}

export function BorrowSummaryMetricsSkeleton() {
  return (
    <BorrowSummaryMetricsLayout
      totalBorrowed={<MetricSkeleton className="w-[90px]" />}
      userBorrowed={<MetricSkeleton className="w-[90px]" />}
      userBorrowApy={<MetricSkeleton className="w-[90px]" />}
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
          className="md:items-end"
        >
          {userBorrowed}
        </MetricWithTooltip>
        <MetricWithTooltip
          label="Your borrow APY"
          tooltip="Your net borrow APY across all markets in the table."
          className="md:items-end"
        >
          {userBorrowApy}
        </MetricWithTooltip>
      </div>
    </div>
  );
}
