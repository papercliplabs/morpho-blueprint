import type { Address, Hex } from "viem";
import type { SupportedChainId } from "@/config/types";
import type { Vault } from "@/data/whisk/getVault";
import type { Erc4626VaultProtocol } from "@/generated/gql/whisk/graphql";

export interface VaultIdentifier {
  chainId: SupportedChainId;
  vaultAddress: Address;
  protocol: Erc4626VaultProtocol;
}

export interface MarketIdentifier {
  chainId: SupportedChainId;
  marketId: Hex;
}

export type MorphoVaultV1 = Extract<Vault, { __typename: "MorphoVault" }>;
export type MorphoVaultV2 = Extract<Vault, { __typename: "MorphoVaultV2" }>;
