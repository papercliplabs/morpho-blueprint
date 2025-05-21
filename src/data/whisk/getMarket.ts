import "server-only";
import { cache } from "react";
import { Hex } from "viem";

import { graphql } from "@/generated/gql/whisk";
import { GetMarketQuery } from "@/generated/gql/whisk/graphql";

import { executeWhiskQuery } from "./execute";

const query = graphql(`
  query getMarket($chainId: Number!, $marketId: String!) {
    morphoMarket(chainId: $chainId, marketId: $marketId) {
      ...MarketSummaryFragment

      isIdle

      supplyAssets
      supplyAssetsUsd

      collateralAsset {
        priceUsd
      }

      loanAsset {
        priceUsd
      }

      liquidityAssetsUsd
      publicAllocatorSharedLiquidityAssetsUsd
      # Disabled for now, need better implementation in Whisk for chains with many many vaults and markets...

      vaultAllocations {
        vault {
          vaultAddress
          name
          curatorAddress
          asset {
            ...TokenInfoFragment
          }
          chain {
            ...ChainInfoFragment
          }
          metadata {
            curators {
              ...CuratorInfoFragment
            }
          }
        }
        position {
          supplyAssetsUsd
        }
        supplyCapUsd
        marketSupplyShare
      }

      utilization
      irm {
        address
        targetUtilization
        curve {
          utilization
          supplyApy
          borrowApy
        }
      }

      liquidationPenalty
      oracleAddress
      collateralPriceInLoanAsset
    }
  }
`);

export const getMarket = cache(async (chainId: number, marketId: Hex): Promise<Market | null> => {
  const data = await executeWhiskQuery(query, {
    chainId,
    marketId,
  });

  return data.morphoMarket;
});

export type Market = NonNullable<GetMarketQuery["morphoMarket"]>;
export type MarketNonIdle = Market & { isIdle: false; collateralAsset: NonNullable<Market["collateralAsset"]> };
export function isNonIdleMarket(market: Market | null): market is MarketNonIdle {
  return !!market && market.isIdle === false && !!market.collateralAsset;
}
