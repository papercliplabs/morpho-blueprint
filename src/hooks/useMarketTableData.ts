"use client";
import { useMemo } from "react";
import type { Hex } from "viem";
import { useAccount } from "wagmi";

import { FilterKey } from "@/components/filters/types";
import type { MarketPosition } from "@/data/whisk/getMarketPositions";
import type { MarketSummary } from "@/data/whisk/getMarketSummaries";

import { useMarketPositions } from "./useMarketPositions";
import { useShallowSearchParams } from "./useShallowSearchParams";

export interface MarketTableDataEntry {
  marketSummary: MarketSummary;
  position?: MarketPosition;
}

// Stitch together market summaries and accounts positions
export function useMarketTableData({ marketSummaries }: { marketSummaries: MarketSummary[] }): {
  data: MarketTableDataEntry[];
  isPositionsLoading: boolean;
} {
  const { data: positions, isLoading } = useMarketPositions();
  const { isConnected } = useAccount();

  const {
    values: [chainsFilterValues, collateralAssetFilterValues, loanAssetFilterValues, accountFilterValues],
  } = useShallowSearchParams({
    keys: [FilterKey.Chains, FilterKey.CollateralAssets, FilterKey.LoanAssets, FilterKey.Account],
  });

  const data = useMemo(() => {
    let dataEntries: MarketTableDataEntry[] = [];

    for (const marketSummary of marketSummaries) {
      const position = positions?.[marketSummary.chain.id]?.[marketSummary.marketId as Hex];
      dataEntries.push({ marketSummary, position });
    }

    // Only select non-idle markets
    dataEntries = dataEntries.filter((entry) => !!entry.marketSummary.collateralAsset);

    return dataEntries;
  }, [marketSummaries, positions]);

  const filteredData = useMemo(() => {
    const filteredData = data.filter((dataEntry) => {
      const chainsFilterMatch =
        chainsFilterValues.length === 0 || chainsFilterValues.includes(dataEntry.marketSummary.chain.name.toString());
      const collateralAssetFilterMatch =
        collateralAssetFilterValues.length === 0 ||
        collateralAssetFilterValues.includes(dataEntry.marketSummary.collateralAsset?.symbol?.toString() ?? "N/A");
      const loanAssetFilterMatch =
        loanAssetFilterValues.length === 0 ||
        loanAssetFilterValues.includes(dataEntry.marketSummary.loanAsset.symbol.toString());

      let accountFilterMatch = true;
      const accountFilterValue = accountFilterValues[0];
      if (dataEntry.position !== undefined && accountFilterValue && isConnected) {
        switch (accountFilterValue) {
          case "positions":
            accountFilterMatch = BigInt(dataEntry.position.collateralAssets) > 0n;
            break;
          case "wallet":
            accountFilterMatch = (dataEntry.position.walletCollateralAssetHolding?.balanceUsd ?? 1) > 0;
            break;
          default:
            // Do nothing
            break;
        }
      }

      return chainsFilterMatch && collateralAssetFilterMatch && loanAssetFilterMatch && accountFilterMatch;
    });

    return filteredData;
  }, [data, chainsFilterValues, collateralAssetFilterValues, loanAssetFilterValues, accountFilterValues, isConnected]);

  return { data: filteredData, isPositionsLoading: isLoading };
}
