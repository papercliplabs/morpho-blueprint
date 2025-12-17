import type { Address } from "viem";
import type { SupportedChainId } from "@/config/types";
import type { Erc4626VaultProtocol } from "@/generated/gql/whisk/graphql";
import type { Vault } from "@/modules/vault/data/getVault";

export interface VaultIdentifier {
  chainId: SupportedChainId;
  vaultAddress: Address;
  protocol: Erc4626VaultProtocol;
}

export type MorphoVaultV1 = Extract<Vault, { __typename: "MorphoVault" }>;
export type MorphoVaultV2 = Extract<Vault, { __typename: "MorphoVaultV2" }>;
