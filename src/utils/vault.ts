import { type Address, getAddress } from "viem";

import { APP_CONFIG, VAULT_TAG_OPTIONS } from "@/config";
import type { SupportedChainId, VaultConfig, VaultTag } from "@/config/types";
import type { VaultSummary } from "@/data/whisk/getVaultSummaries";
import type { ApyFragmentFragment } from "@/generated/gql/whisk/graphql";

export function getVaultTagData(
  chainId: SupportedChainId,
  vaultAddress: Address,
): { tag: VaultTag; color: string } | undefined {
  const configsForChain = APP_CONFIG.supportedVaults?.[chainId] ?? [];
  const target = getAddress(vaultAddress);

  const tag = configsForChain.find((v) => getAddress(v.address) === target)?.tag;

  if (!tag) {
    return undefined;
  }

  const tagIndex = VAULT_TAG_OPTIONS.indexOf(tag);

  const color = `oklch(from var(--chart-${(tagIndex + 1) % 5}) l c h / 0.1)`;

  return { tag, color };
}

export function extractVaultSupplyApy(vault: VaultSummary): ApyFragmentFragment {
  switch (APP_CONFIG.apyWindow) {
    case "1d":
      return vault.supplyApy1d;
    case "7d":
      return vault.supplyApy7d;
    case "30d":
      return vault.supplyApy30d;
  }
}

export function getVaultConfig(chainId: SupportedChainId, vaultAddress: string): VaultConfig | undefined {
  return APP_CONFIG.supportedVaults[chainId]?.find((v) => v.address === getAddress(vaultAddress));
}

export function customizeVault<
  V extends {
    name: string;
    chain: { id: number };
    vaultAddress: string;
    metadata?: Record<string, unknown> | null;
  },
>(vault: V): V & { isHidden: boolean } {
  const { chain, name, metadata, vaultAddress } = vault;

  const chainId = chain.id as SupportedChainId;
  const config = getVaultConfig(chainId, vaultAddress);

  if (!config) return { ...vault, isHidden: true };

  return {
    ...vault,
    name: config?.name ?? name,
    ...(metadata && {
      metadata: {
        ...metadata,
        description: config?.description || metadata?.description,
      },
    }),
    isHidden: config?.isHidden ?? false,
  };
}
