"use client";
import { useMemo } from "react";
import { getAddress } from "viem";

import { VaultPosition } from "@/data/whisk/getVaultPositions";
import { VaultSummary } from "@/data/whisk/getVaultSummaries";

import { useVaultPositions } from "./useVaultPositions";

export interface EarnTableDataEntry {
  vaultSummary: VaultSummary;
  position?: VaultPosition;
}

// Stitch together market summaries and accounts positions
export function useEarnTableData({ vaultSummaries }: { vaultSummaries: VaultSummary[] }): {
  data: EarnTableDataEntry[];
  isPositionsLoading: boolean;
} {
  const { data: positions, isLoading } = useVaultPositions();

  const data = useMemo(() => {
    const dataEntries: EarnTableDataEntry[] = [];

    for (const vaultSummary of vaultSummaries) {
      const position = positions?.[vaultSummary.chain.id]?.[getAddress(vaultSummary.vaultAddress)];
      dataEntries.push({ vaultSummary, position });
    }
    return dataEntries;
  }, [vaultSummaries, positions]);

  return { data, isPositionsLoading: isLoading };
}
