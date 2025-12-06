import { APP_CONFIG } from "@/config";
import type { ApyWindow } from "@/config/types";
import { ApyTimeframe } from "@/generated/gql/whisk/graphql";

function apyWindowToTimeframe(window: ApyWindow): ApyTimeframe {
  switch (window) {
    case "1d":
      return ApyTimeframe.OneDay;
    case "7d":
      return ApyTimeframe.SevenDays;
    case "30d":
      return ApyTimeframe.ThirtyDays;
  }
}

export const timeframe = apyWindowToTimeframe(APP_CONFIG.apyWindow);
