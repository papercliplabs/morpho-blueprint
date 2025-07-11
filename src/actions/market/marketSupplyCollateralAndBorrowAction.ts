import { DEFAULT_SLIPPAGE_TOLERANCE, getChainAddresses, type MarketId } from "@morpho-org/blue-sdk";
import type { InputBundlerOperation } from "@morpho-org/bundler-sdk-viem";
import { type Address, maxUint256 } from "viem";

import { getIsContract } from "@/actions/data/rpc/getIsContract";

import { getMarketSimulationStateAccountingForPublicReallocation } from "../data/rpc/getSimulationState";
import type { MarketAction, PublicClientWithChain } from "../types";
import { actionFromInputOps } from "../utils/actionFromInputOps";
import { computeMarketPositionChange } from "../utils/positionChange";

interface MarketSupplyCollateralAndBorrowActionParameters {
  publicClient: PublicClientWithChain;
  marketId: MarketId;
  allocatingVaultAddresses: Address[];
  accountAddress: Address;
  collateralAmount: bigint; // Max uint256 for entire account collateral balance
  borrowAmount: bigint; // Don't support max here since we will only allow origination below a marging from LLTV
}

export async function marketSupplyCollateralAndBorrowAction({
  publicClient,
  marketId,
  allocatingVaultAddresses,
  accountAddress,
  collateralAmount,
  borrowAmount,
}: MarketSupplyCollateralAndBorrowActionParameters): Promise<MarketAction> {
  // Will throw is unsupported chainId
  const { morpho: morphoBlueAddress } = getChainAddresses(publicClient.chain.id);

  if (collateralAmount < 0n || borrowAmount < 0n) {
    return {
      status: "error",
      message: "Collateral and borrow amounts cannot be negative.",
    };
  }
  if (collateralAmount === 0n && borrowAmount === 0n) {
    return {
      status: "error",
      message: "Collateral and borrow amounts cannot both be 0.",
    };
  }

  const [initialSimulationState, isContract] = await Promise.all([
    getMarketSimulationStateAccountingForPublicReallocation({
      marketId,
      accountAddress,
      publicClient,
      allocatingVaultAddresses,
      requestedBorrowAmount: borrowAmount,
    }),
    getIsContract(publicClient, accountAddress),
  ]);

  const market = initialSimulationState.getMarket(marketId);
  const userCollateralBalance = initialSimulationState.getHolding(
    accountAddress,
    market.params.collateralToken,
  ).balance;

  const isMaxSupplyCollateral = collateralAmount === maxUint256;

  const isSupply = collateralAmount > 0n;
  const isBorrow = borrowAmount > 0n;

  const action = actionFromInputOps(
    publicClient.chain.id,
    [
      ...(isSupply
        ? [
            {
              type: "Blue_SupplyCollateral",
              sender: accountAddress,
              address: morphoBlueAddress,
              args: {
                id: marketId,
                onBehalf: accountAddress,
                assets: isMaxSupplyCollateral ? userCollateralBalance : collateralAmount,
              },
            } as InputBundlerOperation,
          ]
        : []),
      ...(isBorrow
        ? [
            {
              type: "Blue_Borrow",
              sender: accountAddress,
              address: morphoBlueAddress,
              args: {
                id: marketId,
                onBehalf: accountAddress,
                receiver: accountAddress,
                assets: borrowAmount,
                slippage: DEFAULT_SLIPPAGE_TOLERANCE,
              },
            } as InputBundlerOperation,
          ]
        : []),
    ],
    accountAddress,
    isContract,
    initialSimulationState,
    `Confirm ${isSupply ? "Supply" : ""}${isSupply && isBorrow ? " & " : ""}${isBorrow ? "Borrow" : ""}`,
  );

  if (action.status === "success") {
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
  return action;
}
