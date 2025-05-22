import "server-only";
import { cache } from "react";

import { graphql } from "@/generated/gql/whisk";

import { executeWhiskQuery } from "./execute";
import { getWhitelistedMarketIds } from "./getWhitelistedMarketIds";

const query = graphql(`
  query getMarketSummaries($chainId: Number!, $marketIds: [String!]!) {
    morphoMarkets(chainId: $chainId, marketIds: $marketIds) {
      ...MarketSummaryFragment
    }
  }
`);

export const getMarketSummaries = cache(async () => {
  console.log("getMarketSummaries");
  const whitelistedMarketIds = await getWhitelistedMarketIds();
  const queryVariables = Object.entries(whitelistedMarketIds);

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
