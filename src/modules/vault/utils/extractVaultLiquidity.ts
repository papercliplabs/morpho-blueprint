import type { Vault } from "@/modules/vault/data/getVault";

export function extractVaultLiquidity(vault: Vault) {
  switch (vault.__typename) {
    case "MorphoVault":
      return vault.totalLiquidity.usd ?? undefined;
    case "MorphoVaultV2": {
      return Number(vault.totalAssets.formatted);
    }
    default:
      return undefined;
  }
}
