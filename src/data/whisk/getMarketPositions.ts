import "server-only";

import { cache } from "react";
import type { Address, Hex } from "viem";
import type { SupportedChainId } from "@/config/types";
import { graphql } from "@/generated/gql/whisk";
import type { MarketPositionsQuery } from "@/generated/gql/whisk/graphql";
import type { ChainId } from "@/whisk-types";
import { executeWhiskQuery } from "./execute";
import { getWhitelistedMarketIds } from "./getWhitelistedMarketIds";

const query = graphql(`
  query MarketPositions($chainIds: [ChainId!]!, $marketIds: [Hex!]!, $accountAddress: Address!) {
    morphoMarketPositions(where: {
      chainId_in: $chainIds,
      marketId_in: $marketIds,
      accountAddress_in: [$accountAddress],
    },
    limit: 250) {
      items {
        market {
          chain {
            id
          }
          marketId
        }

        collateralAmount {
          raw
          formatted
          usd
        }

        borrowAmount {
          raw
          formatted
          usd
        }

        ltv {
          formatted
        }

        walletLoanAssetHolding {
          balance {
            raw
            formatted
            usd
          }
        }

        walletCollateralAssetHolding {
          balance {
            raw
            formatted
            usd
          }
        }
      }
    }
  }
`);

export type MarketPosition = NonNullable<MarketPositionsQuery["morphoMarketPositions"]["items"][number]>;
export type MarketPositionMap = Record<SupportedChainId, Record<Hex, MarketPosition>>; // ChainId -> MarketId -> MarketPosition

export const getMarketPositions = cache(async (accountAddress: Address): Promise<MarketPositionMap> => {
  const whitelistedMarketIds = await getWhitelistedMarketIds();
  const chainIds = Object.keys(whitelistedMarketIds).map((chainId) => Number.parseInt(chainId) as ChainId);
  const marketIds = Object.values(whitelistedMarketIds).flatMap((marketIds) => Array.from(marketIds));

  const response = await executeWhiskQuery(query, {
    chainIds,
    marketIds,
    accountAddress,
  });

  const data: MarketPositionMap = {} as MarketPositionMap;
  for (const position of response.morphoMarketPositions.items) {
    if (!position) {
      // Ignore, will already be logged at execute layer
      continue;
    }

    // Filter out potential for wrong market with same id on another chain
    if (!whitelistedMarketIds[position.market.chain.id as SupportedChainId]?.includes(position.market.marketId)) {
      continue;
    }

    const chainId = position.market.chain.id as SupportedChainId;
    const marketId = position.market.marketId;

    if (!data[chainId]) {
      data[chainId] = {};
    }
    data[chainId][marketId] = position;
  }

  return data;
});
