import { getAddress } from "viem";

import { APP_CONFIG } from "@/config";
import type { SupportedChainId, VaultConfig } from "@/config/types";

export function getVaultConfig(chainId: SupportedChainId, vaultAddress: string): VaultConfig | undefined {
  return APP_CONFIG.supportedVaults[chainId]?.find((v) => v.address === getAddress(vaultAddress));
}
