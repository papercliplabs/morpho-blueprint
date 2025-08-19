import { type Address, getAddress } from "viem";

import { APP_CONFIG, VAULT_TAG_OPTIONS } from "@/config";
import type { SupportedChainId, VaultTag } from "@/config/types";
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
