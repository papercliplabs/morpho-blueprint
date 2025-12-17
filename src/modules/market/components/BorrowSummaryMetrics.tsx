"use client";
import clsx from "clsx";
import type { ReactNode } from "react";

import { MetricWithTooltip } from "@/common/components/Metric";
import { NumberFlowWithLoading } from "@/common/components/ui/number-flow";
import { Skeleton } from "@/common/components/ui/skeleton";
import { APP_CONFIG } from "@/config";
import type { MarketSummary } from "@/modules/market/data/getMarketSummaries";
import { useBorrowSummaryMetrics } from "@/modules/market/hooks/useBorrowSummaryMetrics";

interface BorrowSummaryMetricsProps {
  marketSummaries: MarketSummary[];
}

function MetricSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <Skeleton className={clsx("mt-[2px] h-[34px]", className)} {...props} />;
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
          className="heading-4"
        />
      }
      userBorrowed={
        <NumberFlowWithLoading
          isLoading={isPositionsLoading}
          loadingContent={<MetricSkeleton className="w-[90px]" />}
          value={data.userBorrowsUsd}
          format={{ currency: "USD" }}
          className="heading-4"
        />
      }
      userBorrowApy={
        <NumberFlowWithLoading
          isLoading={isPositionsLoading}
          loadingContent={<MetricSkeleton className="w-[90px]" />}
          value={data.userBorrowApy}
          format={{ style: "percent" }}
          className="heading-4"
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
          tooltip={`Your net borrow APY across all markets in the table. The native APY is from a ${APP_CONFIG.apyWindow} rolling average.`}
          className="flex-1 md:items-end"
        >
          {userBorrowApy}
        </MetricWithTooltip>
      </div>
    </div>
  );
}
