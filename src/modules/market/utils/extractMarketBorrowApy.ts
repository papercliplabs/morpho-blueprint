import type { Apy } from "@/common/data/types";
import { APP_CONFIG } from "@/config";
import type { MarketBorrowApyWindows } from "@/modules/market/market.types";

export function extractMarketBorrowApy(market: MarketBorrowApyWindows): Apy {
  switch (APP_CONFIG.apyWindow) {
    case "1d":
      return market.borrowApy1d;
    case "7d":
      return market.borrowApy7d;
    case "30d":
      return market.borrowApy30d;
  }
}
