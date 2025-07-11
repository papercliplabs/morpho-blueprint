import "server-only";
import { unstable_cache } from "next/cache";
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

export const getMarketSummaries = cache(
  unstable_cache(
    async () => {
      const whitelistedMarketIds = await getWhitelistedMarketIds();
      const queryVariables = Object.entries(whitelistedMarketIds);

      const responses = await Promise.all(
        queryVariables.map(
          async ([chainId, marketIds]) =>
            await executeWhiskQuery(query, {
              chainId: Number.parseInt(chainId),
              marketIds,
            }),
        ),
      );

      return responses.flatMap((resp) => resp.morphoMarkets);
    },
    ["getMarketSummaries"],
    { revalidate: 10 }, // Light cache, mostly to help in dev
  ),
);

export type MarketSummary = NonNullable<Awaited<ReturnType<typeof getMarketSummaries>>>[number];
