import type { Apy } from "@/common/data/types";
import { APP_CONFIG } from "@/config";
import type { MarketSupplyApyWindows } from "@/modules/market/market.types";

export function extractMarketSupplyApy(market: MarketSupplyApyWindows): Apy {
  switch (APP_CONFIG.apyWindow) {
    case "1d":
      return market.supplyApy1d;
    case "7d":
      return market.supplyApy7d;
    case "30d":
      return market.supplyApy30d;
  }
}
