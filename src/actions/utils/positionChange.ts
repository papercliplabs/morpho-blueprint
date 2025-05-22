import { MarketId } from "@morpho-org/blue-sdk";
import { MaybeDraft, SimulationState } from "@morpho-org/simulation-sdk";
import { Address, parseUnits } from "viem";

import { APP_CONFIG } from "@/config";
import { descaleBigIntToNumber, numberToString } from "@/utils/format";

export interface SimulatedValueChange<T> {
  before: T;
  after: T;
}

export type VaultPositionChange = {
  balance: SimulatedValueChange<number>;
};

export type MarketPositionChange = {
  collateral: SimulatedValueChange<number>;
  loan: SimulatedValueChange<number>;
  availableToBorrow: SimulatedValueChange<number>;
  ltv: SimulatedValueChange<number>;
};

export function computeVaultPositionChange(
  vaultAddress: Address,
  accountAddress: Address,
  initialSimulationState: SimulationState | MaybeDraft<SimulationState>,
  finalSimulationState: SimulationState | MaybeDraft<SimulationState>
): VaultPositionChange {
  const vault = initialSimulationState.getVault(vaultAddress);
  const token = initialSimulationState.getToken(vault.asset);

  const vaultBefore = initialSimulationState.getVault(vaultAddress);
  const sharesBefore = initialSimulationState.getHolding(accountAddress, vaultAddress);
  const rawBalanceBefore = vaultBefore.toAssets(sharesBefore.balance);
  const balanceBefore = descaleBigIntToNumber(rawBalanceBefore, token.decimals);

  const vaultAfter = finalSimulationState.getVault(vaultAddress);
  const sharedAfter = finalSimulationState.getHolding(accountAddress, vaultAddress);
  const rawBalanceAfter = vaultAfter.toAssets(sharedAfter.balance);
  const balanceAfter = descaleBigIntToNumber(rawBalanceAfter, token.decimals);

  return {
    balance: {
      before: balanceBefore,
      after: balanceAfter,
    },
  };
}

export function computeMarketPositionChange(
  marketId: MarketId,
  accountAddress: Address,
  initialSimulationState: SimulationState | MaybeDraft<SimulationState>,
  finalSimulationState: SimulationState | MaybeDraft<SimulationState>
): MarketPositionChange {
  const collateralAsset = initialSimulationState.getToken(
    initialSimulationState.getMarket(marketId).params.collateralToken
  );
  const loanAsset = initialSimulationState.getToken(initialSimulationState.getMarket(marketId).params.loanToken);

  const positionBefore = initialSimulationState.getPosition(accountAddress, marketId);
  const positionAfter = finalSimulationState.getPosition(accountAddress, marketId);

  const marketBefore = initialSimulationState.getMarket(marketId);
  const marketAfter = finalSimulationState.getMarket(marketId);

  const rawCollateralBefore = positionBefore.collateral;
  const collateralBefore = descaleBigIntToNumber(rawCollateralBefore, collateralAsset.decimals);

  const rawCollateralAfter = positionAfter.collateral;
  const collateralAfter = descaleBigIntToNumber(rawCollateralAfter, collateralAsset.decimals);

  const rawLoanBefore = marketBefore.toBorrowAssets(positionBefore.borrowShares);
  const loanBefore = descaleBigIntToNumber(rawLoanBefore, loanAsset.decimals);

  const rawLoanAfter = marketAfter.toBorrowAssets(positionAfter.borrowShares);
  const loanAfter = descaleBigIntToNumber(rawLoanAfter, loanAsset.decimals);

  const rawLtvBefore =
    marketBefore.getLtv({
      collateral: positionBefore.collateral,
      borrowShares: positionBefore.borrowShares,
    }) ?? 0n;
  const rawLtvAfter =
    marketAfter.getLtv({
      collateral: positionAfter.collateral,
      borrowShares: positionAfter.borrowShares,
    }) ?? 0n;
  const ltvBefore = descaleBigIntToNumber(rawLtvBefore, 18);
  const ltvAfter = descaleBigIntToNumber(rawLtvAfter, 18);

  const maxLtv =
    marketAfter.params.lltv - parseUnits(numberToString(APP_CONFIG.actionParameters.maxBorrowLtvMargin), 18);
  const rawMaxBorrowBefore =
    initialSimulationState.getMarket(marketId).getMaxBorrowAssets(rawCollateralBefore, {
      maxLtv,
    }) ?? 0n;
  const rawMaxBorrowAfter =
    initialSimulationState.getMarket(marketId).getMaxBorrowAssets(rawCollateralAfter, {
      maxLtv,
    }) ?? 0n;

  const rawAvailableToBorrowBefore = rawMaxBorrowBefore - rawLoanBefore;
  const rawAvailableToBorrowAfter = rawMaxBorrowAfter - rawLoanAfter;

  const availableToBorrowBefore = Math.max(descaleBigIntToNumber(rawAvailableToBorrowBefore, loanAsset.decimals), 0);
  const availableToBorrowAfter = Math.max(descaleBigIntToNumber(rawAvailableToBorrowAfter, loanAsset.decimals), 0);

  return {
    collateral: {
      before: collateralBefore,
      after: collateralAfter,
    },
    loan: {
      before: loanBefore,
      after: loanAfter,
    },
    availableToBorrow: {
      before: availableToBorrowBefore,
      after: availableToBorrowAfter,
    },
    ltv: {
      before: ltvBefore,
      after: ltvAfter,
    },
  };
}
