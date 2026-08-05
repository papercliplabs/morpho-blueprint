import "server-only";

import { cache } from "react";
import { pageSize, warnIfTruncated } from "@/common/data/adapters/pagination";
import { executeMorphoQuery } from "@/common/utils/executeMorphoQuery";
import type { SupportedChainId } from "@/config/types";
import { graphql } from "@/generated/gql/morpho";
import type { MarketSummary } from "@/modules/market/market.types";
import { toMarketSummary } from "./adapters";
import { getSupportedMarketIds } from "./getSupportedMarketIds";

const query = graphql(`
  query MarketSummaries($first: Int!, $chainIds: [Int!]!, $marketIds: [String!]!) {
    markets(first: $first, where: { chainId_in: $chainIds, uniqueKey_in: $marketIds }) {
      pageInfo {
        count
        countTotal
      }
      items {
        ...MarketSummaryFragment
      }
    }
  }
`);

export type { MarketSummary };

export const getMarketSummaries = cache(async (): Promise<MarketSummary[]> => {
  const supportedMarketIds = await getSupportedMarketIds();

  // One request per chain. `chainId_in` and `uniqueKey_in` are independent filters, so flattening
  // every chain's ids into one request matches their Cartesian product; with `first` sized to the
  // intended pair count, a market id that also exists on another configured chain would fill the
  // page and push a configured market off it. The post-filter below cannot recover a market that
  // never made it into the response.
  const byChain = Object.entries(supportedMarketIds)
    .map(([chainId, ids]) => [Number.parseInt(chainId) as SupportedChainId, Array.from(ids)] as const)
    .filter(([, ids]) => ids.length > 0);

  if (byChain.length === 0) return [];

  const responses = await Promise.all(
    byChain.map(([chainId, ids]) =>
      // Paginated-field cost scales with `first`, so request exactly the derived market set.
      executeMorphoQuery(query, {
        first: pageSize(ids.length, "markets"),
        chainIds: [chainId],
        marketIds: ids,
      }),
    ),
  );

  return responses.flatMap((response) => {
    warnIfTruncated("markets", response.markets.pageInfo);
    return (response.markets.items ?? [])
      .filter((market) => supportedMarketIds[market.chain.id as SupportedChainId]?.includes(market.marketId))
      .map(toMarketSummary);
  });
});
