import { MarketUtils, MathLib } from "@morpho-org/blue-sdk";
import { APP_CONFIG } from "@/config";
import type { MarketNonIdle } from "@/modules/market/data/getMarket";
import type { MarketPosition } from "@/modules/market/data/getMarketPositions";

export function computeMaxBorrow(
  market: MarketNonIdle,
  collateralAmountChange: bigint,
  position?: MarketPosition,
): bigint {
  const totalCollateral = MathLib.max(BigInt(position?.collateralAmount?.raw ?? 0) + collateralAmountChange, 0n);
  const price = BigInt(market.collateralPriceInLoanAsset?.raw ?? 0);
  const lltv = BigInt(market.lltv.raw);

  const maxLtv = MathLib.zeroFloorSub(lltv, APP_CONFIG.actionParameters.maxBorrowLtvMarginWad);

  if (price === 0n || maxLtv === 0n) {
    return 0n;
  }

  const maxBorrow = MarketUtils.getMaxBorrowAssets(totalCollateral, { price }, { lltv: maxLtv })!;
  return MathLib.max(maxBorrow, 0n);
}
