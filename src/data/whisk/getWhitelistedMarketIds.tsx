import { cache } from "react";
import { Hex } from "viem";

import { SupportedChainId } from "@/config/types";

import { getVaultSummaries } from "./getVaultSummaries";

export const getWhitelistedMarketIds = cache(async (): Promise<Record<SupportedChainId, Hex[]>> => {
  console.log("getWhitelistedMarketIds");
  const vaultSummaries = await getVaultSummaries();

  // chainId -> marketIds
  const marketWhitelist = vaultSummaries.reduce(
    (acc, item) => {
      const chainId = item.chain.id as SupportedChainId;
      if (!acc[chainId]) {
        acc[chainId] = [];
      }
      acc[chainId].push(...item.marketAllocations.map((allocation) => allocation.market.marketId as Hex));
      return acc;
    },
    {} as Record<SupportedChainId, Hex[]>
  );

  return marketWhitelist;
});
