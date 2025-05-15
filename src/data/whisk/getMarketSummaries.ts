import "server-only";
import { cache } from "react";

import { WHITELISTED_MARKETS } from "@/config";
import { graphql } from "@/generated/gql/whisk";

import { executeWhiskQuery } from "./execute";

const query = graphql(`
  query getMarketSummaries($chainId: Number!, $marketIds: [String!]!) {
    morphoMarkets(chainId: $chainId, marketIds: $marketIds) {
      ...MarketSummaryFragment
    }
  }
`);

export const getMarketSummaries = cache(async () => {
  const queryVariables = Object.entries(WHITELISTED_MARKETS);

  const responses = await Promise.all(
    queryVariables.map(
      async ([chainId, marketIds]) =>
        await executeWhiskQuery(query, {
          chainId: parseInt(chainId),
          marketIds,
        })
    )
  );

  return responses.flatMap((resp) => resp.morphoMarkets);
});

export type MarketSummary = NonNullable<Awaited<ReturnType<typeof getMarketSummaries>>>[number];
