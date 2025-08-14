import { type Address, getAddress } from "viem";

import { APP_CONFIG, type VaultTag } from "@/config";
import type { SupportedChainId } from "@/config/types";
import type { VaultSummary } from "@/data/whisk/getVaultSummaries";
import type { ApyFragmentFragment } from "@/generated/gql/whisk/graphql";

export function getVaultTag(chainId: SupportedChainId, vaultAddress: Address): VaultTag | undefined {
  const configsForChain = APP_CONFIG.supportedVaults?.[chainId] ?? [];
  const target = getAddress(vaultAddress);
  return configsForChain.find((v) => getAddress(v.address) === target)?.tag;
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
