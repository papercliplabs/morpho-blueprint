import { MarketPositionChange, VaultPositionChange } from "@/actions/utils/positionChange";
import { MAX_BORROW_LTV_MARGIN } from "@/config";
import { MarketNonIdle } from "@/data/whisk/getMarket";
import { MarketPosition } from "@/data/whisk/getMarketPositions";
import { Vault } from "@/data/whisk/getVault";
import { VaultPosition } from "@/data/whisk/getVaultPositions";

import { descaleBigIntToNumber } from "./format";

export function computeAvailableToBorrow(
  market: MarketNonIdle,
  currentPosition: MarketPosition,
  collateralAmountChange: number,
  borrowAmountChange: number
): number {
  const currentCollateral = descaleBigIntToNumber(currentPosition.collateralAssets, market.collateralAsset.decimals);
  const currentLoan = descaleBigIntToNumber(currentPosition.borrowAssets, market.loanAsset.decimals);
  const newCollateral = Math.max(currentCollateral + collateralAmountChange, 0);
  const newLoan = Math.max(currentLoan + borrowAmountChange, 0);

  // Includes margin for borrow origination
  const maxLoan = newCollateral * market.collateralPriceInLoanAsset * (market.lltv - MAX_BORROW_LTV_MARGIN);

  return Math.max(maxLoan - newLoan, 0);
}

export function computeMarketMaxWithdrawCollateral(
  market: MarketNonIdle,
  currentPosition: MarketPosition,
  loanRepaymentAmount: number
): number {
  if (market.lltv == 0 || market.collateralPriceInLoanAsset == 0) {
    return 0;
  }

  const collateral = descaleBigIntToNumber(currentPosition.collateralAssets, market.collateralAsset.decimals);
  const currentLoan = descaleBigIntToNumber(currentPosition.borrowAssets, market.loanAsset.decimals);
  const newLoan = currentLoan - loanRepaymentAmount;
  const minRequiredCollateral = newLoan / (market.lltv - MAX_BORROW_LTV_MARGIN) / market.collateralPriceInLoanAsset;
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

  const currentCollateral = descaleBigIntToNumber(currentPosition.collateralAssets, market.collateralAsset.decimals);
  const currentLoan = descaleBigIntToNumber(currentPosition.borrowAssets, market.loanAsset.decimals);

  const newCollateral = Math.max(currentCollateral + collateralAmountChange, 0);
  const newLoan = Math.max(currentLoan + loanAmountChange, 0);

  const currentAvailableToBorrow = computeAvailableToBorrow(market, currentPosition, 0, 0);
  const newAvailableToBorrow = computeAvailableToBorrow(
    market,
    currentPosition,
    collateralAmountChange,
    loanAmountChange
  );

  const collateralInLoan = newCollateral * market.collateralPriceInLoanAsset;

  const currentLtv = currentPosition.ltv;
  const newLtv =
    collateralAmountChange == 0 && loanAmountChange == 0
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
  vault,
  currentPosition,
  supplyAmountChange,
}: {
  vault: Vault;
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

  const currentSupply = descaleBigIntToNumber(currentPosition.supplyAssets, vault.asset.decimals);
  const newSupply = currentSupply + supplyAmountChange;

  return {
    balance: {
      before: currentSupply,
      after: newSupply,
    },
  };
}
