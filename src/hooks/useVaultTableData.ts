"use client";
import { useMemo } from "react";
import { getAddress } from "viem";
import { useAccount } from "wagmi";

import { FilterKey } from "@/components/filters/types";
import type { SupportedChainId } from "@/config/types";
import type { VaultPosition } from "@/data/whisk/getVaultPositions";
import type { VaultSummary } from "@/data/whisk/getVaultSummaries";
import { getVaultCurator, getVaultTagData } from "@/utils/vault";
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
  const { isConnected } = useAccount();

  const {
    values: [chainsFilterValues, assetsFilterValues, curatorsFilterValues, tagFilterValues, accountFilterValues],
  } = useShallowSearchParams({
    keys: [FilterKey.Chains, FilterKey.SupplyAssets, FilterKey.Curators, FilterKey.VaultTags, FilterKey.Account],
  });

  const data = useMemo(() => {
    const dataEntries: VaultTableDataEntry[] = [];

    for (const vaultSummary of vaultSummaries) {
      const position = positions?.[vaultSummary.chain.id as SupportedChainId]?.[getAddress(vaultSummary.vaultAddress)];
      dataEntries.push({ vaultSummary, position });
    }

    return dataEntries;
  }, [vaultSummaries, positions]);

  const filteredData = useMemo(() => {
    const filteredData = data.filter((dataEntry) => {
      const chainsFilterMatch =
        chainsFilterValues === undefined ||
        chainsFilterValues.length === 0 ||
        chainsFilterValues.includes(dataEntry.vaultSummary.chain.name.toString());
      const assetsFilterMatch =
        assetsFilterValues === undefined ||
        assetsFilterValues.length === 0 ||
        assetsFilterValues.includes(dataEntry.vaultSummary.asset.symbol.toString());
      const curatorsFilterMatch =
        curatorsFilterValues === undefined ||
        curatorsFilterValues.length === 0 ||
        curatorsFilterValues.includes(getVaultCurator(dataEntry.vaultSummary)?.name ?? "N/A");

      // Tags filter: match against optional supportedVaults
      let tagFilterMatch = true;
      if (tagFilterValues !== undefined && tagFilterValues.length > 0) {
        const thisVaultTagData = getVaultTagData(
          dataEntry.vaultSummary.chain.id as SupportedChainId,
          dataEntry.vaultSummary.vaultAddress,
        );
        tagFilterMatch = thisVaultTagData !== undefined && tagFilterValues.includes(thisVaultTagData.tag);
      }

      let accountFilterMatch = true;
      const accountFilterValue = accountFilterValues?.[0];
      if (dataEntry.position !== undefined && accountFilterValue && isConnected) {
        switch (accountFilterValue) {
          case "positions":
            accountFilterMatch = BigInt(dataEntry.position.assets.raw ?? 0n) > 0n;
            break;
          case "wallet":
            accountFilterMatch = (dataEntry.position.walletAssetHolding?.balance.usd ?? 1) > 0;
            break;
          default:
            // Do nothing
            break;
        }
      }

      return chainsFilterMatch && assetsFilterMatch && curatorsFilterMatch && tagFilterMatch && accountFilterMatch;
    });

    return filteredData;
  }, [
    data,
    chainsFilterValues,
    assetsFilterValues,
    curatorsFilterValues,
    tagFilterValues,
    accountFilterValues,
    isConnected,
  ]);

  return { data: filteredData, isPositionsLoading: isLoading };
}
