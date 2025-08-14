import { APP_CONFIG } from "@/config";
import type { MarketSummary } from "@/data/whisk/getMarketSummaries";
import type { Vault } from "@/data/whisk/getVault";
import type { ApyFragmentFragment } from "@/generated/gql/whisk/graphql";

export function extractMarketBorrowApy(market: MarketSummary): ApyFragmentFragment {
  switch (APP_CONFIG.apyWindow) {
    case "1d":
      return market.borrowApy1d;
    case "7d":
      return market.borrowApy7d;
    case "30d":
      return market.borrowApy30d;
  }
}

export function extractMarketSupplyApy(market: Vault["marketAllocations"][number]["market"]): ApyFragmentFragment {
  switch (APP_CONFIG.apyWindow) {
    case "1d":
      return market.supplyApy1d;
    case "7d":
      return market.supplyApy7d;
    case "30d":
      return market.supplyApy30d;
  }
}
