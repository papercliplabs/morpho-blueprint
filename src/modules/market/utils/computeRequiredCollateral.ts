import { MathLib, ORACLE_PRICE_SCALE } from "@morpho-org/blue-sdk";
import { APP_CONFIG } from "@/config";
import type { MarketNonIdle } from "@/modules/market/data/getMarket";
import type { MarketPosition } from "@/modules/market/data/getMarketPositions";

export function computeRequiredCollateral(
  market: MarketNonIdle,
  loanAmountChange: bigint,
  position?: MarketPosition,
): bigint {
  const lltv = BigInt(market.lltv.raw);
  const price = BigInt(market.collateralPriceInLoanAsset?.raw ?? 0n);
  const maxLtv = MathLib.zeroFloorSub(lltv, APP_CONFIG.actionParameters.maxBorrowLtvMarginWad);
  if (price === 0n || maxLtv === 0n) {
    return 0n;
  }

  const currentLoan = BigInt(position?.borrowAmount?.raw ?? 0n);
  const newLoan = MathLib.max(currentLoan + loanAmountChange, 0n);

  // Following https://github.com/morpho-org/sdks/blob/main/packages/blue-sdk/src/market/MarketUtils.ts#L390-L418
  return MathLib.wDivUp(MathLib.mulDivUp(newLoan, ORACLE_PRICE_SCALE, price), maxLtv);
}
