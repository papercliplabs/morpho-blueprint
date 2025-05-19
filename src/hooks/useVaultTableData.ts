"use client";
import { useMemo } from "react";
import { getAddress } from "viem";

import { FilterKey } from "@/components/filters/types";
import { VaultPosition } from "@/data/whisk/getVaultPositions";
import { VaultSummary } from "@/data/whisk/getVaultSummaries";

import { useShallowSearchParams } from "./useShallowSearchParams";
import { useVaultPositions } from "./useVaultPositions";

export interface VaultTableDataEntry {
  vaultSummary: VaultSummary;
  position?: VaultPosition;
}

// Stitch together market summaries and accounts positions
export function useVaultTableData({ vaultSummaries }: { vaultSummaries: VaultSummary[] }): {
  data: VaultTableDataEntry[];
  isPositionsLoading: boolean;
} {
  const { data: positions, isLoading } = useVaultPositions();

  const {
    values: [chainsFilterValue, assetsFilterValue, curatorsFilterValue, accountFilterValues],
  } = useShallowSearchParams({
    keys: [FilterKey.Chains, FilterKey.Assets, FilterKey.Curators, FilterKey.Account],
  });

  const data = useMemo(() => {
    const dataEntries: VaultTableDataEntry[] = [];

    for (const vaultSummary of vaultSummaries) {
      const position = positions?.[vaultSummary.chain.id]?.[getAddress(vaultSummary.vaultAddress)];
      dataEntries.push({ vaultSummary, position });
    }

    return dataEntries;
  }, [vaultSummaries, positions]);

  const filteredData = useMemo(() => {
    const filteredData = data.filter((dataEntry) => {
      const chainsFilterMatch =
        chainsFilterValue.length === 0 || chainsFilterValue.includes(dataEntry.vaultSummary.chain.name.toString());
      const assetsFilterMatch =
        assetsFilterValue.length === 0 || assetsFilterValue.includes(dataEntry.vaultSummary.asset.symbol.toString());
      // TODO: add curator filter
      const curatorsFilterMatch = true;
      void curatorsFilterValue;

      let accountFilterMatch = true;
      const accountFilterValue = accountFilterValues[0];
      if (dataEntry.position != undefined && accountFilterValue) {
        switch (accountFilterValue) {
          case "positions":
            accountFilterMatch = BigInt(dataEntry.position.supplyAssets) > 0n;
            break;
          case "wallet":
            accountFilterMatch = (dataEntry.position.walletUnderlyingAssetHolding?.balanceUsd ?? 1) > 0;
            break;
          default:
            // Do nothing
            break;
        }
      }

      return chainsFilterMatch && assetsFilterMatch && curatorsFilterMatch && accountFilterMatch;
    });

    return filteredData;
  }, [data, chainsFilterValue, assetsFilterValue, curatorsFilterValue, accountFilterValues]);

  return { data: filteredData, isPositionsLoading: isLoading };
}
