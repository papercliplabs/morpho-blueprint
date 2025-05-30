import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { APP_CONFIG } from "@/config";
import { graphql } from "@/generated/gql/whisk";

import { executeWhiskQuery } from "./execute";

const query = graphql(`
  query getVaultSummaries($chainId: Number!, $addresses: [String!]!) {
    morphoVaults(chainId: $chainId, addresses: $addresses) {
      ...VaultSummaryFragment
    }
  }
`);

export const getVaultSummaries = cache(
  unstable_cache(
    async () => {
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

      return responses.flatMap((resp) => resp.morphoVaults);
    },
    ["getVaultSummaries"],
    { revalidate: 10 } // Light cache, mostly to help in dev
  )
);

export type VaultSummary = NonNullable<Awaited<ReturnType<typeof getVaultSummaries>>>[number];
