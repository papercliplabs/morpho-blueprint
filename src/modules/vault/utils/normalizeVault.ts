import type { ChainInfo } from "@/common/data/types";
import type { SupportedChainId } from "@/config/types";
import type { VaultMetadata } from "@/modules/vault/vault.types";
import { getVaultConfig } from "./getVaultConfig";

/** Applies the per-vault config overrides (name, description, visibility) to an adapted vault. */
export function normalizeVault<
  V extends {
    name: string;
    chain: ChainInfo;
    vaultAddress: string;
    metadata: VaultMetadata | null;
  },
>(vault: V): V & { isHidden: boolean; chain: ChainInfo & { id: SupportedChainId } } {
  const chainId = vault.chain.id as SupportedChainId;
  const chain = { ...vault.chain, id: chainId };
  const config = getVaultConfig(chainId, vault.vaultAddress);

  if (!config) return { ...vault, isHidden: true, chain };

  return {
    ...vault,
    name: config.name ?? vault.name,
    chain,
    metadata: vault.metadata && {
      ...vault.metadata,
      description: config.description || vault.metadata.description,
    },
    isHidden: config.isHidden ?? false,
  };
}
