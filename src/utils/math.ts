import type { MarketPositionChange, VaultPositionChange } from "@/actions";
import { APP_CONFIG } from "@/config";
import type { MarketNonIdle } from "@/data/whisk/getMarket";
import type { MarketPosition } from "@/data/whisk/getMarketPositions";
import type { VaultPosition } from "@/data/whisk/getVaultPositions";

export function computeAvailableToBorrow(
  market: MarketNonIdle,
  currentPosition: MarketPosition,
  collateralAmountChange: number,
  borrowAmountChange: number,
): number {
  const currentCollateral = Number(currentPosition.collateralAmount?.formatted ?? 0);
  const currentLoan = Number(currentPosition.borrowAmount.formatted);
  const newCollateral = Math.max(currentCollateral + collateralAmountChange, 0);
  const newLoan = Math.max(currentLoan + borrowAmountChange, 0);

  // Includes margin for borrow origination
  const maxLoan =
    newCollateral *
    Number(market.collateralPriceInLoanAsset?.formatted ?? 0) *
    (Number(market.lltv.formatted) - APP_CONFIG.actionParameters.maxBorrowLtvMargin);

  return Math.max(maxLoan - newLoan, 0);
}

export function computeMarketMaxWithdrawCollateral(
  market: MarketNonIdle,
  currentPosition: MarketPosition,
  loanRepaymentAmount: number,
): number {
  if (Number(market.lltv.formatted) === 0 || Number(market.collateralPriceInLoanAsset?.formatted ?? 0) === 0) {
    return 0;
  }

  const collateral = Number(currentPosition.collateralAmount?.formatted ?? 0);
  const currentLoan = Number(currentPosition.borrowAmount.formatted);
  const newLoan = currentLoan - loanRepaymentAmount;
  const minRequiredCollateral =
    newLoan /
    (Number(market.lltv.formatted) - APP_CONFIG.actionParameters.maxBorrowLtvMargin) /
    Number(market.collateralPriceInLoanAsset?.formatted ?? 0);
  const collateralWithdrawMax = collateral - minRequiredCollateral;
  return Math.max(collateralWithdrawMax, 0);
}

export function computeMarketPositonChange({
  market,
  currentPosition,
  collateralAmountChange,
  loanAmountChange,
}: {
  market: MarketNonIdle;
  currentPosition?: MarketPosition;
  collateralAmountChange: number;
  loanAmountChange: number;
}): MarketPositionChange {
  if (!currentPosition) {
    return {
      collateral: {
        before: 0,
        after: 0,
      },
      loan: {
        before: 0,
        after: 0,
      },
      availableToBorrow: {
        before: 0,
        after: 0,
      },
      ltv: {
        before: 0,
        after: 0,
      },
    };
  }

  const currentCollateral = Number(currentPosition.collateralAmount?.formatted ?? 0);
  const currentLoan = Number(currentPosition.borrowAmount.formatted);

  const newCollateral = Math.max(currentCollateral + collateralAmountChange, 0);
  const newLoan = Math.max(currentLoan + loanAmountChange, 0);

  const currentAvailableToBorrow = computeAvailableToBorrow(market, currentPosition, 0, 0);
  const newAvailableToBorrow = computeAvailableToBorrow(
    market,
    currentPosition,
    collateralAmountChange,
    loanAmountChange,
  );

  const collateralInLoan = newCollateral * Number(market.collateralPriceInLoanAsset?.formatted ?? 0);

  const currentLtv = Number(currentPosition.ltv?.formatted ?? 0);
  const newLtv =
    collateralAmountChange === 0 && loanAmountChange === 0
      ? currentLtv
      : collateralInLoan > 0
        ? newLoan / collateralInLoan
        : 0;

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
  supplyAmountChange: number;
}): VaultPositionChange {
  if (!currentPosition) {
    return {
      balance: {
        before: 0,
        after: 0,
      },
    };
  }

  const currentSupply = Number(currentPosition.supplyAmount.formatted);
  const newSupply = Math.max(currentSupply + supplyAmountChange, 0);

  return {
    balance: {
      before: currentSupply,
      after: newSupply,
    },
  };
}
