"use client";
import { useMemo } from "react";
import { useAccount } from "wagmi";

import type { VaultSummary } from "@/data/whisk/getVaultSummaries";

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
    const totalSuppliedUsd = vaultTableData.reduce(
      (acc, entry) => acc + (entry.vaultSummary.totalSupplied.usd ?? 0),
      0,
    );
    const totalLiqudityUsd = vaultTableData.reduce(
      (acc, entry) => acc + (entry.vaultSummary.totalLiquidity.usd ?? 0),
      0,
    );
    const totalBorrowedUsd = totalSuppliedUsd - totalLiqudityUsd;

    let userDepositsUsd: number | undefined;
    let userEarnApy: number | undefined;
    if (address && !isPositionsLoading) {
      userDepositsUsd = vaultTableData.reduce((acc, entry) => {
        return acc + (entry.position?.supplyAmount.usd ?? 0);
      }, 0);

      const userEarnAggregator = vaultTableData.reduce((acc, entry) => {
        return acc + (entry.position?.supplyAmount.usd ?? 0) * (entry.vaultSummary.supplyApy.total ?? 0);
      }, 0);

      userEarnApy = userDepositsUsd > 0 ? userEarnAggregator / userDepositsUsd : 0;
    }

    return {
      totalSuppliedUsd,
      totalBorrowedUsd,

      userDepositsUsd,
      userEarnApy,
    };
  }, [vaultTableData, address, isPositionsLoading]);

  return {
    data: earnSummaryMetrics,
    isPositionsLoading,
  };
}
