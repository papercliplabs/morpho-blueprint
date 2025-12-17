import type { SupportedChainId } from "@/config/types";
import { getVaultConfig } from "./getVaultConfig";

export function normalizeVault<
  V extends {
    name: string;
    chain: { id: number };
    vaultAddress: string;
    metadata?: Record<string, unknown> | null;
  },
>(vault: V): V & { isHidden: boolean; chain: { id: SupportedChainId } } {
  const { chain, name, metadata, vaultAddress } = vault;

  const chainId = chain.id as SupportedChainId;
  const config = getVaultConfig(chainId, vaultAddress);

  if (!config) return { ...vault, isHidden: true, chain: { id: chainId } };

  return {
    ...vault,
    name: config?.name ?? name,
    chain: { ...chain, id: chainId },
    ...(metadata && {
      metadata: {
        ...metadata,
        description: config?.description || metadata?.description,
      },
    }),
    isHidden: config?.isHidden ?? false,
  };
}
