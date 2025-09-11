"use client";
import { useMemo } from "react";
import { useAccount } from "wagmi";

import type { VaultSummary } from "@/data/whisk/getVaultSummaries";
import { extractVaultSupplyApy } from "@/utils/vault";
import { useVaultTableData } from "./useVaultTableData";

interface EarnSummaryMetrics {
  data: {
    totalSuppliedUsd: number;
    totalBorrowedUsd: number;

    userDepositsUsd?: number;
    userEarnApy?: number;
  };

  isPositionsLoading: boolean;
}

export function useEarnSummaryMetrics({ vaultSummaries }: { vaultSummaries: VaultSummary[] }): EarnSummaryMetrics {
  const { data: vaultTableData, isPositionsLoading } = useVaultTableData({ vaultSummaries });
  const { address } = useAccount();

  const earnSummaryMetrics = useMemo(() => {
    const totalSuppliedUsd = vaultSummaries.reduce((acc, entry) => acc + (entry.totalSupplied.usd ?? 0), 0);
    const totalLiqudityUsd = vaultSummaries.reduce((acc, entry) => acc + (entry.totalLiquidity.usd ?? 0), 0);
    const totalBorrowedUsd = totalSuppliedUsd - totalLiqudityUsd;

    let userDepositsUsd: number | undefined;
    let userEarnApy: number | undefined;
    if (address && !isPositionsLoading) {
      userDepositsUsd = vaultTableData
        .filter((v) => !v.vaultSummary.isHidden)
        .reduce((acc, entry) => {
          return acc + (entry.position?.supplyAmount.usd ?? 0);
        }, 0);

      const userEarnAggregator = vaultTableData
        .filter((v) => !v.vaultSummary.isHidden)
        .reduce((acc, entry) => {
          const apy = extractVaultSupplyApy(entry.vaultSummary);
          return acc + (entry.position?.supplyAmount.usd ?? 0) * apy.total;
        }, 0);

      userEarnApy = userDepositsUsd > 0 ? userEarnAggregator / userDepositsUsd : 0;
    }

    return {
      totalSuppliedUsd,
      totalBorrowedUsd,

      userDepositsUsd,
      userEarnApy,
    };
  }, [vaultTableData, address, isPositionsLoading, vaultSummaries]);

  return {
    data: earnSummaryMetrics,
    isPositionsLoading,
  };
}
