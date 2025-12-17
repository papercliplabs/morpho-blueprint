"use client";
import { useMemo } from "react";
import { useAccount } from "wagmi";
import type { MarketSummary } from "@/modules/market/data/getMarketSummaries";
import { extractMarketBorrowApy } from "@/modules/market/utils/extractMarketBorrowApy";
import { useMarketTableData } from "./useMarketTableData";

interface EarnSummaryMetrics {
  data: {
    // totalCollateralUsd: number; // TODO: need to add the Whisk
    totalBorrowedUsd: number;

    userBorrowsUsd?: number;
    userBorrowApy?: number;
  };

  isPositionsLoading: boolean;
}

export function useBorrowSummaryMetrics({ marketSummaries }: { marketSummaries: MarketSummary[] }): EarnSummaryMetrics {
  const { data: marketTableData, isPositionsLoading } = useMarketTableData({ marketSummaries });
  const { address } = useAccount();

  const borrowSummaryMetrics = useMemo(() => {
    const totalBorrowedUsd = marketSummaries.reduce((acc, entry) => acc + (entry.totalBorrowed.usd ?? 0), 0);

    let userBorrowsUsd: number | undefined;
    let userBorrowApy: number | undefined;
    if (address && !isPositionsLoading) {
      userBorrowsUsd = marketTableData.reduce((acc, entry) => {
        return acc + (entry.position?.borrowAmount.usd ?? 0);
      }, 0);

      const userBorrowAggregator = marketTableData.reduce((acc, entry) => {
        const apy = extractMarketBorrowApy(entry.marketSummary);
        return acc + (entry.position?.borrowAmount.usd ?? 0) * apy.total;
      }, 0);

      userBorrowApy = userBorrowsUsd > 0 ? userBorrowAggregator / userBorrowsUsd : 0;
    }

    return {
      totalBorrowedUsd,

      userBorrowsUsd,
      userBorrowApy,
    };
  }, [marketTableData, address, isPositionsLoading, marketSummaries]);

  return {
    data: borrowSummaryMetrics,
    isPositionsLoading,
  };
}
