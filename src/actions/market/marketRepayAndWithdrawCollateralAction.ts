import { DEFAULT_SLIPPAGE_TOLERANCE, getChainAddresses, type MarketId } from "@morpho-org/blue-sdk";
import type { InputBundlerOperation } from "@morpho-org/bundler-sdk-viem";
import { type Address, maxUint256 } from "viem";

import { getIsContract } from "@/actions/data/rpc/getIsContract";
import { getSimulationState } from "@/actions/data/rpc/getSimulationState";

import { type ClientWithChain, type MarketAction, UserFacingError } from "../types";
import { actionFromInputOps } from "../utils/actionFromInputOps";
import { computeMarketPositionChange } from "../utils/positionChange";

interface MarketRepayAndWithdrawCollateralActionParameters {
  publicClient: ClientWithChain;
  marketId: MarketId;
  accountAddress: Address;
  repayAmount: bigint; // Max uint256 for entire position balance
  withdrawCollateralAmount: bigint; // Max uint256 for entire position collateral balance
}

export async function marketRepayAndWithdrawCollateralAction({
  publicClient,
  marketId,
  accountAddress,
  repayAmount,
  withdrawCollateralAmount,
}: MarketRepayAndWithdrawCollateralActionParameters): Promise<MarketAction> {
  const { morpho: morphoBlueAddress } = getChainAddresses(publicClient.chain.id);

  if (repayAmount < 0n || withdrawCollateralAmount < 0n) {
    throw new UserFacingError("Repay and withdraw collateral amounts cannot be negative.");
  }
  if (repayAmount === 0n && withdrawCollateralAmount === 0n) {
    throw new UserFacingError("Repay and withdraw collateral amounts cannot both be 0.");
  }

  const [initialSimulationState, isContract] = await Promise.all([
    getSimulationState({
      actionType: "market",
      accountAddress,
      marketId,
      publicClient,
      requiresPublicReallocation: false,
    }),
    getIsContract(publicClient, accountAddress),
  ]);

  const isMaxRepay = repayAmount === maxUint256;
  const isMaxWithdrawCollateral = withdrawCollateralAmount === maxUint256;

  const userPosition = initialSimulationState.getPosition(accountAddress, marketId);

  const isRepay = repayAmount > 0n;
  const isWithdraw = withdrawCollateralAmount > 0n;

  const action = actionFromInputOps(
    publicClient.chain.id,
    [
      ...(isRepay
        ? [
            {
              type: "Blue_Repay",
              sender: accountAddress,
              address: morphoBlueAddress,
              args: {
                id: marketId,
                onBehalf: accountAddress,
                // Use shares if a max repay to ensure fully closed position
                ...(isMaxRepay ? { shares: userPosition.borrowShares } : { assets: repayAmount }),
                slippage: DEFAULT_SLIPPAGE_TOLERANCE,
              },
            } as InputBundlerOperation,
          ]
        : []),
      ...(isWithdraw
        ? [
            {
              type: "Blue_WithdrawCollateral",
              sender: accountAddress,
              address: morphoBlueAddress,
              args: {
                id: marketId,
                onBehalf: accountAddress,
                receiver: accountAddress,
                assets: isMaxWithdrawCollateral ? userPosition.collateral : withdrawCollateralAmount,
              },
            } as InputBundlerOperation,
          ]
        : []),
    ],
    accountAddress,
    isContract,
    initialSimulationState,
    `Confirm ${isRepay ? "Repay" : ""}${isRepay && isWithdraw ? " & " : ""}${isWithdraw ? "Withdraw" : ""}`,
  );

  return {
    ...action,
    positionChange: computeMarketPositionChange(
      marketId,
      accountAddress,
      initialSimulationState,
      action.finalSimulationState,
    ),
  };
}
