import { type Address, getAddress } from "viem";

import { APP_CONFIG, VAULT_TAG_OPTIONS } from "@/config";
import type { SupportedChainId, VaultConfig, VaultTag } from "@/config/types";
import type { Vault } from "@/data/whisk/getVault";
import type { VaultSummary } from "@/data/whisk/getVaultSummaries";

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

export function getVaultConfig(chainId: SupportedChainId, vaultAddress: string): VaultConfig | undefined {
  return APP_CONFIG.supportedVaults[chainId]?.find((v) => v.address === getAddress(vaultAddress));
}

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

export function getVaultLiquidity(vault: Vault) {
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

type VaultCollateral = {
  icon: string | null;
  name: string;
  symbol: string;
  supplyUsd: number;
  vaultSupplyShare: number;
};

export function getVaultCollateral(vault: VaultSummary): Array<VaultCollateral> {
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
          for (const { market, position, vaultSupplyShare, enabled } of adapter.vault.marketAllocations) {
            if (!enabled || !market.collateralAsset) continue;
            allocations.push({
              icon: market.collateralAsset.icon,
              name: market.collateralAsset.name,
              symbol: market.collateralAsset.symbol,
              supplyUsd: position.supplyAmount.usd ?? 0,
              vaultSupplyShare,
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

export function getVaultCurator(vault: VaultSummary): { name: string; image: string; url: string } | undefined {
  switch (vault.__typename) {
    case "MorphoVault":
    case "MorphoVaultV2":
      return vault.metadata?.curator ?? undefined;
    default:
      return undefined;
  }
}
