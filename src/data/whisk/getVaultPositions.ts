import "server-only";
import { cache } from "react";
import { Address, getAddress } from "viem";

import { APP_CONFIG } from "@/config";
import { graphql } from "@/generated/gql/whisk";
import { GetVaultPositionsQuery } from "@/generated/gql/whisk/graphql";

import { executeWhiskQuery } from "./execute";

const query = graphql(`
  query getVaultPositions($chainId: Number!, $vaultAddresses: [String!]!, $accountAddress: String!) {
    morphoVaultPositions(chainId: $chainId, vaultAddresses: $vaultAddresses, accountAddress: $accountAddress) {
      vault {
        chain {
          id
        }
        vaultAddress
      }

      supplyAssets
      supplyAssetsUsd

      walletUnderlyingAssetHolding {
        balance
        balanceUsd
      }
    }
  }
`);

// ChainId -> VaultAddress -> VaultPosition
export const getVaultPositions = cache(async (accountAddress: Address): Promise<VaultPositionMap> => {
  console.log("getVaultPositions", accountAddress);
  const partialQueryVariables = Object.entries(APP_CONFIG.whitelistedVaults);

  const responses = await Promise.all(
    partialQueryVariables.map(
      async ([chainId, vaultAddresses]) =>
        await executeWhiskQuery(query, {
          chainId: parseInt(chainId),
          vaultAddresses,
          accountAddress,
        })
    )
  );

  const data: VaultPositionMap = {};
  for (const position of responses.flatMap((resp) => resp.morphoVaultPositions)) {
    if (!data[position.vault.chain.id]) {
      data[position.vault.chain.id] = {};
    }
    data[position.vault.chain.id][getAddress(position.vault.vaultAddress)] = position;
  }

  return data;
});

export type VaultPosition = NonNullable<GetVaultPositionsQuery["morphoVaultPositions"]>[number];
export type VaultPositionMap = Record<number, Record<Address, VaultPosition>>;
