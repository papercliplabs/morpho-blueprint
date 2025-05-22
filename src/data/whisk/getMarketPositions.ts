import "server-only";
import { cache } from "react";
import { Address, Hex } from "viem";

import { graphql } from "@/generated/gql/whisk";
import { GetMarketPositionsQuery } from "@/generated/gql/whisk/graphql";

import { executeWhiskQuery } from "./execute";
import { getWhitelistedMarketIds } from "./getWhitelistedMarketIds";

const query = graphql(`
  query getMarketPositions($chainId: Number!, $marketIds: [String!]!, $accountAddress: String!) {
    morphoMarketPositions(chainId: $chainId, marketIds: $marketIds, accountAddress: $accountAddress) {
      market {
        chain {
          id
        }
        marketId
      }

      collateralAssets
      collateralAssetsUsd

      borrowAssets
      borrowAssetsUsd

      walletCollateralAssetHolding {
        balance
        balanceUsd
      }

      walletLoanAssetHolding {
        balance
        balanceUsd
      }

      ltv
    }
  }
`);

// ChainId -> MarketId -> MarketPosition
export const getMarketPositions = cache(async (accountAddress: Address): Promise<MarketPositionMap> => {
  console.log("getMarketPositions", accountAddress);
  const whitelistedMarketIds = await getWhitelistedMarketIds();
  const partialQueryVariables = Object.entries(whitelistedMarketIds);

  const responses = await Promise.all(
    partialQueryVariables.map(
      async ([chainId, marketIds]) =>
        await executeWhiskQuery(query, {
          chainId: parseInt(chainId),
          marketIds,
          accountAddress,
        })
    )
  );

  const data: MarketPositionMap = {};
  for (const position of responses.flatMap((resp) => resp.morphoMarketPositions)) {
    if (!data[position.market.chain.id]) {
      data[position.market.chain.id] = {};
    }
    data[position.market.chain.id][position.market.marketId as Hex] = position;
  }

  return data;
});

export type MarketPosition = NonNullable<GetMarketPositionsQuery["morphoMarketPositions"]>[number];
export type MarketPositionMap = Record<number, Record<Hex, MarketPosition>>;
