import type { VaultSummary } from "@/modules/vault/data/getVaultSummaries";

export function extractVaultCurator(vault: VaultSummary): { name: string; image: string; url: string } | undefined {
  switch (vault.__typename) {
    case "MorphoVault":
    case "MorphoVaultV2":
      return vault.metadata?.curator ?? undefined;
    default:
      return undefined;
  }
}
