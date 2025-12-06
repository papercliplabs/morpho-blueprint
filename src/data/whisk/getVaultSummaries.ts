import "server-only";

import { cache } from "react";
import { APP_CONFIG } from "@/config";
import type { SupportedChainId } from "@/config/types";
import { graphql } from "@/generated/gql/whisk";
import type { Erc4626VaultSummariesQuery } from "@/generated/gql/whisk/graphql";
import { timeframe } from "@/utils/timeframe";
import { normalizeVault } from "@/utils/vault";
import { executeWhiskQuery } from "./execute";

const query = graphql(`
  query Erc4626VaultSummaries($keys: [Erc4626VaultKey!]!, $timeframe: ApyTimeframe!) {
    erc4626Vaults(where: {keys: $keys}, limit: 250) {
      pageInfo {
        hasNextPage
      }
      items {
        ...VaultSummaryFragment
      }      
    }
  }
`);

type VaultQueryItem = NonNullable<Erc4626VaultSummariesQuery["erc4626Vaults"]["items"][number]>;
export type VaultSummary = VaultQueryItem & {
  isHidden: boolean;
};

export const getVaultSummaries = cache(async () => {
  const keys = Object.entries(APP_CONFIG.supportedVaults).flatMap(([chainId, vaults]) =>
    vaults.map((v) => ({
      chainId: Number.parseInt(chainId) as SupportedChainId,
      vaultAddress: v.address,
      protocol: v.protocol,
    })),
  );

  const response = await executeWhiskQuery(query, { keys, timeframe });

  if (response.erc4626Vaults.pageInfo.hasNextPage) {
    console.warn("More vaults available, but not fetched.");
  }

  return response.erc4626Vaults.items.filter((v) => v !== null).map(normalizeVault);
});
