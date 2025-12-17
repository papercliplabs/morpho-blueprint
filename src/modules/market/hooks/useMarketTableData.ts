"use client";
import { useMemo } from "react";
import type { Hex } from "viem";
import { useAccount } from "wagmi";
import { useShallowSearchParams } from "@/common/hooks/useShallowSearchParams";
import { FilterKey } from "@/common/utils/constants";
import type { SupportedChainId } from "@/config/types";
import type { MarketPosition } from "@/modules/market/data/getMarketPositions";
import type { MarketSummary } from "@/modules/market/data/getMarketSummaries";
import { useMarketPositions } from "./useMarketPositions";

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
      const position = positions?.[marketSummary.chain.id as SupportedChainId]?.[marketSummary.marketId as Hex];
      dataEntries.push({ marketSummary, position });
    }

    // Only select non-idle markets
    dataEntries = dataEntries.filter((entry) => !!entry.marketSummary.collateralAsset);

    return dataEntries;
  }, [marketSummaries, positions]);

  const filteredData = useMemo(() => {
    const filteredData = data.filter((dataEntry) => {
      const chainsFilterMatch =
        chainsFilterValues === undefined ||
        chainsFilterValues.length === 0 ||
        chainsFilterValues.includes(dataEntry.marketSummary.chain.name.toString());
      const collateralAssetFilterMatch =
        collateralAssetFilterValues === undefined ||
        collateralAssetFilterValues.length === 0 ||
        collateralAssetFilterValues.includes(dataEntry.marketSummary.collateralAsset?.symbol?.toString() ?? "N/A");
      const loanAssetFilterMatch =
        loanAssetFilterValues === undefined ||
        loanAssetFilterValues.length === 0 ||
        loanAssetFilterValues.includes(dataEntry.marketSummary.loanAsset.symbol.toString());

      let accountFilterMatch = true;
      const accountFilterValue = accountFilterValues?.[0];
      if (dataEntry.position !== undefined && accountFilterValue && isConnected) {
        switch (accountFilterValue) {
          case "positions":
            accountFilterMatch = BigInt(dataEntry.position.collateralAmount?.raw ?? 0n) > 0n;
            break;
          case "wallet":
            accountFilterMatch = (dataEntry.position.walletCollateralAssetHolding?.balance.usd ?? 1) > 0;
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
