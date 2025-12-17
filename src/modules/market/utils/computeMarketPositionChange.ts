import { MarketUtils, MathLib } from "@morpho-org/blue-sdk";
import type { MarketPositionChange } from "@/actions";
import type { MarketNonIdle } from "@/modules/market/data/getMarket";
import type { MarketPosition } from "@/modules/market/data/getMarketPositions";
import { computeMaxBorrow } from "./computeMaxBorrow";

export function computeMarketPositonChange({
  market,
  currentPosition,
  collateralAmountChange,
  loanAmountChange,
}: {
  market: MarketNonIdle;
  currentPosition?: MarketPosition;
  collateralAmountChange: bigint;
  loanAmountChange: bigint;
}): MarketPositionChange {
  const currentCollateral = BigInt(currentPosition?.collateralAmount?.raw ?? 0);
  const currentLoan = BigInt(currentPosition?.borrowAmount?.raw ?? 0);

  const newCollateral = MathLib.max(currentCollateral + collateralAmountChange, 0);
  const newLoan = MathLib.max(currentLoan + loanAmountChange, 0);

  const currentMaxBorrow = computeMaxBorrow(market, 0n, currentPosition);
  const currentAvailableToBorrow = MathLib.max(currentMaxBorrow - currentLoan, 0n);

  const newMaxBorrow = computeMaxBorrow(market, collateralAmountChange, currentPosition);
  const newAvailableToBorrow = MathLib.max(newMaxBorrow - newLoan, 0n);

  const currentLtv = BigInt(currentPosition?.ltv?.raw ?? 0n);

  let newLtv = currentLtv;
  if (newLoan !== currentLoan || newCollateral !== currentCollateral) {
    const newCollateralValue = MarketUtils.getCollateralValue(newCollateral, {
      price: BigInt(market.collateralPriceInLoanAsset?.raw ?? 0),
    });
    newLtv = !newCollateralValue ? 0n : MathLib.wDivUp(newLoan, newCollateralValue);
  }

  return {
    collateral: {
      before: currentCollateral,
      after: newCollateral,
    },
    loan: {
      before: currentLoan,
      after: newLoan,
    },
    availableToBorrow: {
      before: currentAvailableToBorrow,
      after: newAvailableToBorrow,
    },
    ltv: {
      before: currentLtv,
      after: newLtv,
    },
  };
}
