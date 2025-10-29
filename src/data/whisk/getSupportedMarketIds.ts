import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Hex } from "viem";

import { APP_CONFIG } from "@/config";
import type { SupportedChainId } from "@/config/types";
import { graphql } from "@/generated/gql/whisk";
import { SECONDS_PER_DAY } from "@/utils/constants";
import type { ChainId } from "@/whisk-types";
import { executeWhiskQuery } from "./execute";

const query = graphql(`
  query SupportedMarketIds($chainIds: [ChainId!]!, $vaultAddresses: [Address!]!) {
    morphoVaults(where: {chainId_in: $chainIds, vaultAddress_in: $vaultAddresses}) {
      items {
        chain {
          id
        }
        marketAllocations {
          market {
            marketId
          }
        }
      }
    }
  }
`);

// Return mapping chainId -> marketIds
const getSupportedMarketIdsUncached = cache(async (): Promise<Record<SupportedChainId, Hex[]>> => {
  const chainIds = Object.keys(APP_CONFIG.supportedVaults) as unknown as ChainId[];
  const vaultAddresses = Object.values(APP_CONFIG.supportedVaults)
    .flat()
    .map((v) => v.address);

  const responses = await executeWhiskQuery(query, {
    chainIds,
    vaultAddresses,
  });

  // chainId -> marketIds
  const marketWhitelist = {} as Record<SupportedChainId, Set<Hex>>;
  for (const item of responses.morphoVaults.items) {
    if (item === null) {
      continue;
    }

    const chainId = item.chain.id as SupportedChainId;
    const allocatingMarketIds = item.marketAllocations.map((allocation) => allocation.market.marketId);

    if (!marketWhitelist[chainId]) {
      marketWhitelist[chainId] = new Set();
    }

    for (const marketId of allocatingMarketIds) {
      marketWhitelist[chainId].add(marketId);
    }
  }

  // Convert Sets back to arrays
  const result = {} as Record<SupportedChainId, Hex[]>;
  for (const [chainId, marketIdsSet] of Object.entries(marketWhitelist)) {
    result[Number(chainId) as SupportedChainId] = Array.from(marketIdsSet);
  }

  return result;
});

export const getSupportedMarketIds = unstable_cache(getSupportedMarketIdsUncached, ["getSupportedMarketIds"], {
  revalidate: SECONDS_PER_DAY,
});
