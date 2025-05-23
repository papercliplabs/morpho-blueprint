import { unstable_cache } from "next/cache";
import { cache } from "react";
import { Hex } from "viem";

import { APP_CONFIG } from "@/config";
import { SupportedChainId } from "@/config/types";
import { graphql } from "@/generated/gql/whisk";
import { SECONDS_PER_DAY } from "@/utils/contants";

import { executeWhiskQuery } from "./execute";

const query = graphql(`
  query getWhitelistedMarketIds($chainId: Number!, $addresses: [String!]!) {
    morphoVaults(chainId: $chainId, addresses: $addresses) {
      marketAllocations {
        market {
          marketId
        }
      }
    }
  }
`);

const getWhitelistedMarketIdsUncached = cache(async (): Promise<Record<SupportedChainId, Hex[]>> => {
  const queryVariables = Object.entries(APP_CONFIG.whitelistedVaults);

  const responses = await Promise.all(
    queryVariables.map(
      async ([chainId, addresses]) =>
        await executeWhiskQuery(query, {
          chainId: parseInt(chainId),
          addresses,
        })
    )
  );

  // chainId -> marketIds
  const marketWhitelist = responses.reduce(
    (acc, resp, i) => {
      const chainId = Number(queryVariables[i][0]) as SupportedChainId;
      if (!acc[chainId]) {
        acc[chainId] = [];
      }
      acc[chainId].push(
        ...resp.morphoVaults.flatMap((vault) =>
          vault.marketAllocations.map((allocation) => allocation.market.marketId as Hex)
        )
      );
      return acc;
    },
    {} as Record<SupportedChainId, Hex[]>
  );

  return marketWhitelist;
});

export const getWhitelistedMarketIds = unstable_cache(getWhitelistedMarketIdsUncached, ["getWhitelistedMarketIds"], {
  revalidate: SECONDS_PER_DAY,
});
