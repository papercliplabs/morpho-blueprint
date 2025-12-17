import "server-only";

import { cache } from "react";
import type { SupportedChainId } from "@/config/types";
import { graphql } from "@/generated/gql/whisk";
import type { MarketSummariesQuery } from "@/generated/gql/whisk/graphql";
import type { ChainId } from "@/whisk-types";
import { executeWhiskQuery } from "../../../common/utils/executeWhiskQuery";
import { getSupportedMarketIds } from "./getSupportedMarketIds";

const query = graphql(`
  query MarketSummaries($chainIds: [ChainId!]!, $marketIds: [Hex!]!) {
    morphoMarkets(where: {chainId_in: $chainIds, marketId_in: $marketIds}, limit: 250) {
      pageInfo {
        hasNextPage
      }
      items {
        ...MarketSummaryFragment
      }
    }
  }
`);

export type MarketSummary = NonNullable<MarketSummariesQuery["morphoMarkets"]["items"][number]>;

export const getMarketSummaries = cache(async () => {
  const supportedMarketIds = await getSupportedMarketIds();
  const chainIds = Object.keys(supportedMarketIds).map((chainId) => Number.parseInt(chainId) as ChainId);
  const marketIds = Object.values(supportedMarketIds).flatMap((marketIds) => Array.from(marketIds));

  const response = await executeWhiskQuery(query, {
    chainIds,
    marketIds,
  });

  if (response.morphoMarkets.pageInfo.hasNextPage) {
    console.warn("More markets available, but not fetched.");
  }

  const markets = response.morphoMarkets.items.filter((market) => {
    // Ignore errored vaults (already log at execute layer)
    if (market === null) {
      return false;
    }

    // Filter out potential for wrong market with same id on another chain
    if (!supportedMarketIds[market.chain.id as SupportedChainId]?.includes(market.marketId)) {
      return false;
    }

    return true;
  });

  return markets as MarketSummary[];
});
