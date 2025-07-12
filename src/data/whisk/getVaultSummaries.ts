import "server-only";

import { cache } from "react";
import { APP_CONFIG } from "@/config";
import type { SupportedChainId } from "@/config/types";
import { graphql } from "@/generated/gql/whisk";
import type { VaultSummariesQuery } from "@/generated/gql/whisk/graphql";
import type { ChainId } from "@/whisk-types";
import { executeWhiskQuery } from "./execute";

const query = graphql(`
  query VaultSummaries($chainIds: [ChainId!]!, $vaultAddresses: [Address!]!) {
    morphoVaults(where: {chainId_in: $chainIds, vaultAddress_in: $vaultAddresses}, limit: 250) {
      pageInfo {
        hasNextPage
      }
      items {
        ...VaultSummaryFragment
      }
    }
  }
`);

export type VaultSummary = NonNullable<VaultSummariesQuery["morphoVaults"]["items"][number]>;

export const getVaultSummaries = cache(async () => {
  const chainIds = Object.keys(APP_CONFIG.supportedVaults).map((chainId) => Number.parseInt(chainId) as ChainId);
  const vaultAddresses = Object.values(APP_CONFIG.supportedVaults).flat();

  const response = await executeWhiskQuery(query, {
    chainIds,
    vaultAddresses,
  });

  if (response.morphoVaults.pageInfo.hasNextPage) {
    console.warn("More vaults available, but not fetched.");
  }

  const vaults = response.morphoVaults.items.filter((vault) => {
    // Ignore errored vaults (already log at execute layer)
    if (vault === null) {
      return false;
    }

    // Filter out potential for wrong vault with same address on another chain
    if (!APP_CONFIG.supportedVaults[vault.chain.id as SupportedChainId].includes(vault.vaultAddress)) {
      return false;
    }

    return true;
  });

  return vaults as VaultSummary[];
});
