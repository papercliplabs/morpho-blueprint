import { MarketUtils, MathLib, ORACLE_PRICE_SCALE } from "@morpho-org/blue-sdk";
import type { MarketPositionChange, VaultPositionChange } from "@/actions";
import { APP_CONFIG } from "@/config";
import type { MarketNonIdle } from "@/data/whisk/getMarket";
import type { MarketPosition } from "@/data/whisk/getMarketPositions";
import type { VaultPosition } from "@/data/whisk/getVaultPositions";

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

export function computeVaultPositionChange({
  currentPosition,
  supplyAmountChange,
}: {
  currentPosition?: VaultPosition;
  supplyAmountChange: bigint;
}): VaultPositionChange {
  const currentSupply = BigInt(currentPosition?.supplyAmount?.raw ?? 0);
  const newSupply = MathLib.max(currentSupply + supplyAmountChange, 0n);

  return {
    balance: {
      before: currentSupply,
      after: newSupply,
    },
  };
}
