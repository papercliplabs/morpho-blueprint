import "server-only";
import { cache } from "react";
import type { Hex } from "viem";
import type { SupportedChainId } from "@/config/types";
import { graphql } from "@/generated/gql/whisk";
import type { MarketQuery } from "@/generated/gql/whisk/graphql";
import { executeWhiskQuery } from "./execute";

const query = graphql(`
  query Market($chainId: ChainId!, $marketId: Hex!) {
    morphoMarkets(where: {chainId_in: [$chainId], marketId_in: [$marketId]}) {
      items {

        ...MarketSummaryFragment

        isIdle

        totalSupplied {
          raw
          formatted
          usd
        }

        totalBorrowed {
          raw
          formatted
          usd
        }

        liquidityInMarket {
          raw
          formatted
          usd
        }

        publicAllocatorSharedLiquidity {
          raw
          formatted
          usd
        }

        collateralAsset {
          priceUsd
        }

        loanAsset {
          priceUsd
        }

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
              curator {
                ...CuratorInfoFragment
              }
            }
          }
          enabled

          position {
            supplyAmount {
              raw
              formatted
              usd
            }
            supplyShares
          }

          supplyCap {
            raw
            formatted
            usd
          }
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
        collateralPriceInLoanAsset {
          raw
          formatted
        }

        historical {
            hourly {
              ...MarketHistoricalEntryFragment
            }
            daily {
              ...MarketHistoricalEntryFragment
            }
            weekly {
              ...MarketHistoricalEntryFragment
            }
          }
      }
    }
  }
`);

export type Market = NonNullable<MarketQuery["morphoMarkets"]["items"][number]>;
export type MarketNonIdle = Market & { isIdle: false; collateralAsset: NonNullable<Market["collateralAsset"]> };
export function isNonIdleMarket(market: Market | null): market is MarketNonIdle {
  return !!market && market.isIdle === false && !!market.collateralAsset;
}

export const getMarket = cache(async (chainId: SupportedChainId, marketId: Hex): Promise<Market> => {
  const data = await executeWhiskQuery(query, {
    chainId,
    marketId,
  });

  const market = data.morphoMarkets.items[0];

  if (!market) {
    throw new Error(`Market not found: ${chainId}:${marketId}`);
  }

  return market;
});
