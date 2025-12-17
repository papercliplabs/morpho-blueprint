"use client";
import { useMemo } from "react";
import { useAccount } from "wagmi";

import type { VaultSummary } from "@/modules/vault/data/getVaultSummaries";
import { useVaultTableData } from "./useVaultTableData";

interface EarnSummaryMetrics {
  data: {
    totalSuppliedUsd: number;

    userDepositsUsd?: number;
    userEarnApy?: number;
  };

  isPositionsLoading: boolean;
}

export function useEarnSummaryMetrics({ vaultSummaries }: { vaultSummaries: VaultSummary[] }): EarnSummaryMetrics {
  const { data: vaultTableData, isPositionsLoading } = useVaultTableData({ vaultSummaries });
  const { address } = useAccount();

  const earnSummaryMetrics = useMemo(() => {
    const totalSuppliedUsd = vaultSummaries.reduce((acc, entry) => acc + (entry.totalAssets.usd ?? 0), 0);

    let userDepositsUsd: number | undefined;
    let userEarnApy: number | undefined;
    if (address && !isPositionsLoading) {
      userDepositsUsd = vaultTableData
        .filter((v) => !v.vaultSummary.isHidden)
        .reduce((acc, entry) => {
          return acc + (entry.position?.assets.usd ?? 0);
        }, 0);

      const userEarnAggregator = vaultTableData
        .filter((v) => !v.vaultSummary.isHidden)
        .reduce((acc, entry) => {
          const apy = entry.vaultSummary.apy;
          return acc + (entry.position?.assets.usd ?? 0) * apy.total;
        }, 0);

      userEarnApy = userDepositsUsd > 0 ? userEarnAggregator / userDepositsUsd : 0;
    }

    return {
      totalSuppliedUsd,

      userDepositsUsd,
      userEarnApy,
    };
  }, [vaultTableData, address, isPositionsLoading, vaultSummaries]);

  return {
    data: earnSummaryMetrics,
    isPositionsLoading,
  };
}
