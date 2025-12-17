import { APP_CONFIG } from "@/config";
import type { ApyFragmentFragment } from "@/generated/gql/whisk/graphql";
import type { MarketSummary } from "@/modules/market/data/getMarketSummaries";

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
