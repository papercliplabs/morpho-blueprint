import type { Address, Hex } from "viem";
import type { SupportedChainId } from "@/config/types";

export interface VaultIdentifier {
  chainId: SupportedChainId;
  vaultAddress: Address;
}

export interface MarketIdentifier {
  chainId: SupportedChainId;
  marketId: Hex;
}

export type BigIntString = string;
