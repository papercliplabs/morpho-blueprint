import { type Address, getAddress } from "viem";

import { APP_CONFIG } from "@/config";
import type { SupportedChainId, VaultTag } from "@/config/types";

export function getVaultTag(chainId: SupportedChainId, vaultAddress: Address): VaultTag | undefined {
  const configsForChain = APP_CONFIG.supportedVaults?.[chainId] ?? [];
  const target = getAddress(vaultAddress);
  return configsForChain.find((v) => getAddress(v.address) === target)?.tag;
}
