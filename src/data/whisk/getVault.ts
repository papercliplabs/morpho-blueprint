import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { Address } from "viem";

import { graphql } from "@/generated/gql/whisk";
import { GetVaultQuery } from "@/generated/gql/whisk/graphql";

import { executeWhiskQuery } from "./execute";

const query = graphql(`
  query getVault($chainId: Number!, $vaultAddress: String!) {
    morphoVault(chainId: $chainId, address: $vaultAddress) {
      ...VaultSummaryFragment

      asset {
        priceUsd
      }

      liquidityAssets
      liquidityAssetsUsd

      metadata {
        description
      }

      performanceFee
      feeRecipientAddress
      ownerAddress
      curatorAddress
      guardianAddress

      marketAllocations {
        market {
          marketId
          chain {
            ...ChainInfoFragment
          }
          isIdle
          name
          lltv
          collateralAsset {
            ...TokenInfoFragment
          }
          loanAsset {
            ...TokenInfoFragment
          }
          supplyApy {
            ...MarketApyFragment
          }
        }
        enabled
        position {
          supplyAssetsUsd
        }
        supplyCapUsd
        vaultSupplyShare
      }
    }
  }
`);

export const getVault = cache(
  unstable_cache(
    async (chainId: number, vaultAddress: Address): Promise<Vault | null> => {
      const data = await executeWhiskQuery(query, {
        chainId,
        vaultAddress,
      });

      return data.morphoVault;
    },
    ["getVault"],
    { revalidate: 10 } // Light cache, mostly to help in dev
  )
);

export type Vault = NonNullable<GetVaultQuery["morphoVault"]>;
