import { MarketId } from "@morpho-org/blue-sdk";
import { MaybeDraft, SimulationState } from "@morpho-org/simulation-sdk";
import { Address } from "viem";

import { MAX_BORROW_LTV_MARGIN } from "@/config";
import { descaleBigIntToNumber } from "@/utils/format";

import { computeScaledAmount } from "./math";

export interface SimulatedValueChange<T> {
  before: T;
  after: T;
  delta: T;
}

export type VaultPositionChange = {
  balance: SimulatedValueChange<{
    rawAmount: bigint;
    amount: number;
  }>;
};

export type MarketPositionChange = {
  collateral: SimulatedValueChange<{
    rawAmount: bigint;
    amount: number;
  }>;
  loan: SimulatedValueChange<{
    rawAmount: bigint;
    amount: number;
  }>;
  availableToBorrow: SimulatedValueChange<{
    rawAmount: bigint;
    amount: number;
  }>;
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
      before: {
        rawAmount: rawBalanceBefore,
        amount: balanceBefore,
      },
      after: {
        rawAmount: rawBalanceAfter,
        amount: balanceAfter,
      },
      delta: {
        rawAmount: rawBalanceAfter - rawBalanceBefore,
        amount: balanceAfter - balanceBefore,
      },
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

  const maxLtv = computeScaledAmount(marketAfter.params.lltv, 1 - MAX_BORROW_LTV_MARGIN);
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

  const availableToBorrowBefore = descaleBigIntToNumber(rawAvailableToBorrowBefore, loanAsset.decimals);
  const availableToBorrowAfter = descaleBigIntToNumber(rawAvailableToBorrowAfter, loanAsset.decimals);

  return {
    collateral: {
      before: {
        rawAmount: positionBefore.collateral,
        amount: collateralBefore,
      },
      after: {
        rawAmount: positionAfter.collateral,
        amount: collateralAfter,
      },
      delta: {
        rawAmount: positionAfter.collateral - positionBefore.collateral,
        amount: collateralAfter - collateralBefore,
      },
    },
    loan: {
      before: {
        rawAmount: rawLoanBefore,
        amount: loanBefore,
      },
      after: {
        rawAmount: rawLoanAfter,
        amount: loanAfter,
      },
      delta: {
        rawAmount: rawLoanAfter - rawLoanBefore,
        amount: loanAfter - loanBefore,
      },
    },
    availableToBorrow: {
      before: {
        rawAmount: rawAvailableToBorrowBefore,
        amount: availableToBorrowBefore,
      },
      after: {
        rawAmount: rawAvailableToBorrowAfter,
        amount: availableToBorrowAfter,
      },
      delta: {
        rawAmount: rawAvailableToBorrowAfter - rawAvailableToBorrowBefore,
        amount: availableToBorrowAfter - availableToBorrowBefore,
      },
    },
    ltv: {
      before: ltvBefore,
      after: ltvAfter,
      delta: ltvAfter - ltvBefore,
    },
  };
}
