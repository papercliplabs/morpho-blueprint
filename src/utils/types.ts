import { Address, Hex } from "viem";

export interface VaultIdentifier {
  chainId: number;
  vaultAddress: Address;
}

export interface MarketIdentifier {
  chainId: number;
  marketId: Hex;
}
