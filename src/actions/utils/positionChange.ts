import { type MarketId, MathLib } from "@morpho-org/blue-sdk";
import type { MaybeDraft, SimulationState } from "@morpho-org/simulation-sdk";
import type { Address } from "viem";

import { APP_CONFIG } from "@/config";

import type { MarketPositionChange, VaultPositionChange } from "../types";

export function computeVaultPositionChange(
  vaultAddress: Address,
  accountAddress: Address,
  initialSimulationState: SimulationState | MaybeDraft<SimulationState>,
  finalSimulationState: SimulationState | MaybeDraft<SimulationState>,
): VaultPositionChange {
  const vaultBefore = initialSimulationState.getVault(vaultAddress);
  const sharesBefore = initialSimulationState.getHolding(accountAddress, vaultAddress);
  const rawBalanceBefore = vaultBefore.toAssets(sharesBefore.balance);

  const vaultAfter = finalSimulationState.getVault(vaultAddress);
  const sharedAfter = finalSimulationState.getHolding(accountAddress, vaultAddress);
  const rawBalanceAfter = vaultAfter.toAssets(sharedAfter.balance);

  return {
    balance: {
      before: rawBalanceBefore,
      after: rawBalanceAfter,
    },
  };
}

export function computeMarketPositionChange(
  marketId: MarketId,
  accountAddress: Address,
  initialSimulationState: SimulationState | MaybeDraft<SimulationState>,
  finalSimulationState: SimulationState | MaybeDraft<SimulationState>,
): MarketPositionChange {
  const positionBefore = initialSimulationState.getPosition(accountAddress, marketId);
  const positionAfter = finalSimulationState.getPosition(accountAddress, marketId);

  const marketBefore = initialSimulationState.getMarket(marketId);
  const marketAfter = finalSimulationState.getMarket(marketId);

  const rawCollateralBefore = positionBefore.collateral;

  const rawCollateralAfter = positionAfter.collateral;

  const rawLoanBefore = marketBefore.toBorrowAssets(positionBefore.borrowShares);

  const rawLoanAfter = marketAfter.toBorrowAssets(positionAfter.borrowShares);

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

  const maxLtv = MathLib.zeroFloorSub(marketAfter.params.lltv, APP_CONFIG.actionParameters.maxBorrowLtvMarginWad);
  const rawMaxBorrowBefore =
    initialSimulationState.getMarket(marketId).getMaxBorrowAssets(rawCollateralBefore, {
      maxLtv,
    }) ?? 0n;
  const rawMaxBorrowAfter =
    initialSimulationState.getMarket(marketId).getMaxBorrowAssets(rawCollateralAfter, {
      maxLtv,
    }) ?? 0n;

  const rawAvailableToBorrowBefore = MathLib.zeroFloorSub(rawMaxBorrowBefore, rawLoanBefore);
  const rawAvailableToBorrowAfter = MathLib.zeroFloorSub(rawMaxBorrowAfter, rawLoanAfter);

  return {
    collateral: {
      before: rawCollateralBefore,
      after: rawCollateralAfter,
    },
    loan: {
      before: rawLoanBefore,
      after: rawLoanAfter,
    },
    availableToBorrow: {
      before: rawAvailableToBorrowBefore,
      after: rawAvailableToBorrowAfter,
    },
    ltv: {
      before: rawLtvBefore,
      after: rawLtvAfter,
    },
  };
}
