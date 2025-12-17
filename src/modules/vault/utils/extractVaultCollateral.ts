import type { VaultSummary } from "@/modules/vault/data/getVaultSummaries";

type VaultCollateral = {
  icon: string | null;
  name: string;
  symbol: string;
  supplyUsd: number;
  vaultSupplyShare: number;
};

export function extractVaultCollateral(vault: VaultSummary): Array<VaultCollateral> {
  switch (vault.__typename) {
    case "MorphoVault": {
      return vault.marketAllocations
        .filter(({ enabled, market }) => enabled && market.collateralAsset !== null)
        .map(({ market, position, vaultSupplyShare }) => ({
          icon: market.collateralAsset!.icon,
          name: market.collateralAsset!.name,
          symbol: market.collateralAsset!.symbol,
          supplyUsd: position.supplyAmount.usd ?? 0,
          vaultSupplyShare,
        }))
        .sort((a, b) => b.vaultSupplyShare - a.vaultSupplyShare);
    }
    case "MorphoVaultV2": {
      const allocations: Array<VaultCollateral> = [];
      const vaultV2TotalAssetsUsd = vault.totalAssets?.usd ?? 0;

      for (const adapter of vault.adapters) {
        if (adapter.__typename === "MarketV1Adapter") {
          for (const { collateralToken, allocation, relativeCap } of adapter.collateralCaps) {
            allocations.push({
              icon: collateralToken.icon,
              name: collateralToken.name,
              symbol: collateralToken.symbol,
              supplyUsd: allocation.usd ?? 0,
              vaultSupplyShare: Number(relativeCap.formatted),
            });
          }
        }
        if (adapter.__typename === "VaultV1Adapter" && adapter.vault) {
          const totalAllocation = Number(adapter.adapterCap?.allocation.formatted ?? 0);
          const vaultV1TotalAssets = Number(adapter.vault?.totalAssets?.formatted ?? 0);
          const allocationPercent = vaultV1TotalAssets > 0 ? totalAllocation / vaultV1TotalAssets : 0;

          for (const { market, position, enabled } of adapter.vault.marketAllocations) {
            if (!enabled || !market.collateralAsset) continue;

            const supplyUsd = (position.supplyAmount.usd ?? 0) * allocationPercent;
            allocations.push({
              icon: market.collateralAsset.icon,
              name: market.collateralAsset.name,
              symbol: market.collateralAsset.symbol,
              supplyUsd,
              vaultSupplyShare: vaultV2TotalAssetsUsd > 0 ? supplyUsd / vaultV2TotalAssetsUsd : 0,
            });
          }
        }
      }

      return allocations.sort((a, b) => b.vaultSupplyShare - a.vaultSupplyShare);
    }
    default:
      return [];
  }
}
