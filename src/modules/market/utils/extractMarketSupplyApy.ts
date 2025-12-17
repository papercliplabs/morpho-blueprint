import { APP_CONFIG } from "@/config";
import type { ApyFragmentFragment, MorphoVaultV1MarketAllocationFragment } from "@/generated/gql/whisk/graphql";

export function extractMarketSupplyApy(
  market: MorphoVaultV1MarketAllocationFragment["marketAllocations"][number]["market"],
): ApyFragmentFragment {
  switch (APP_CONFIG.apyWindow) {
    case "1d":
      return market.supplyApy1d;
    case "7d":
      return market.supplyApy7d;
    case "30d":
      return market.supplyApy30d;
  }
}
