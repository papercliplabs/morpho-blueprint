"use client";
import { useMemo } from "react";
import { getAddress } from "viem";

import { VaultPosition } from "@/data/whisk/getVaultPositions";
import { VaultSummary } from "@/data/whisk/getVaultSummaries";

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

  const data = useMemo(() => {
    const dataEntries: VaultTableDataEntry[] = [];

    for (const vaultSummary of vaultSummaries) {
      const position = positions?.[vaultSummary.chain.id]?.[getAddress(vaultSummary.vaultAddress)];
      dataEntries.push({ vaultSummary, position });
    }
    return dataEntries;
  }, [vaultSummaries, positions]);

  return { data, isPositionsLoading: isLoading };
}
