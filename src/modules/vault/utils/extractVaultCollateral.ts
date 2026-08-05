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
      const allocationsBySymbol = new Map<string, VaultCollateral>();
      const vaultV2TotalAssetsUsd = vault.totalAssets?.usd ?? 0;

      for (const adapter of vault.allocations) {
        if (adapter.__typename !== "Erc4626VaultAdapter") continue;
        const morphoVault = adapter.vault;
        if (!morphoVault || morphoVault.__typename !== "MorphoVault") continue;

        const totalAllocation = Number(adapter.adapterCap?.allocation.formatted ?? 0);
        const vaultV1TotalAssets = Number(morphoVault.totalAssets?.formatted ?? 0);
        const allocationPercent = vaultV1TotalAssets > 0 ? totalAllocation / vaultV1TotalAssets : 0;

        for (const { market, position, enabled } of morphoVault.marketAllocations) {
          if (!enabled || !market.collateralAsset) continue;

          const supplyUsd = (position.supplyAmount.usd ?? 0) * allocationPercent;
          const existing = allocationsBySymbol.get(market.collateralAsset.symbol);
          const totalSupplyUsd = (existing?.supplyUsd ?? 0) + supplyUsd;
          allocationsBySymbol.set(market.collateralAsset.symbol, {
            icon: market.collateralAsset.icon,
            name: market.collateralAsset.name,
            symbol: market.collateralAsset.symbol,
            supplyUsd: totalSupplyUsd,
            vaultSupplyShare: vaultV2TotalAssetsUsd > 0 ? totalSupplyUsd / vaultV2TotalAssetsUsd : 0,
          });
        }
      }

      return Array.from(allocationsBySymbol.values()).sort((a, b) => b.vaultSupplyShare - a.vaultSupplyShare);
    }
    default:
      return [];
  }
}
