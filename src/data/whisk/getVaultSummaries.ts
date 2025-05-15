import "server-only";
import { cache } from "react";

import { WHITELISTED_VAULTS } from "@/config";
import { graphql } from "@/generated/gql/whisk";

import { executeWhiskQuery } from "./execute";

const query = graphql(`
  query getVaultSummaries($chainId: Number!, $addresses: [String!]!) {
    morphoVaults(chainId: $chainId, addresses: $addresses) {
      ...VaultSummaryFragment
    }
  }
`);

export const getVaultSummaries = cache(async () => {
  const queryVariables = Object.entries(WHITELISTED_VAULTS);

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
});

export type VaultSummary = NonNullable<Awaited<ReturnType<typeof getVaultSummaries>>>[number];
