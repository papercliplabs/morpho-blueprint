"use client";
import { useMemo } from "react";
import { Hex } from "viem";

import { MarketPosition } from "@/data/whisk/getMarketPositions";
import { MarketSummary } from "@/data/whisk/getMarketSummaries";

import { useMarketPositions } from "./useMarketPositions";

export interface BorrowTableDataEntry {
  marketSummary: MarketSummary;
  position?: MarketPosition;
}

// Stitch together market summaries and accounts positions
export function useBorrowTableData({ marketSummaries }: { marketSummaries: MarketSummary[] }): {
  data: BorrowTableDataEntry[];
  isPositionsLoading: boolean;
} {
  const { data: positions, isLoading } = useMarketPositions();

  const data = useMemo(() => {
    const dataEntries: BorrowTableDataEntry[] = [];

    for (const marketSummary of marketSummaries) {
      const position = positions?.[marketSummary.chain.id]?.[marketSummary.marketId as Hex];
      dataEntries.push({ marketSummary, position });
    }
    return dataEntries;
  }, [marketSummaries, positions]);

  return { data, isPositionsLoading: isLoading };
}
